import type { Dataset, Driver } from 'gdal-async'
import type { Bound } from './tile-util'
import type { CreateInfo, Options, OverviewInfo, StatisticsInfo } from './types'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import gdal from 'gdal-async'
import Tinypool from 'tinypool'
import { getBuildOverviewResampling, reprojectImage } from './gdal-util'
import { getTileByCoors, ST_TileEnvelope, tileBoundMap } from './tile-util'
import { uuid } from './util'

const pool = new Tinypool({
  filename: new URL('./create-tile.js', import.meta.url).href,
  runtime: 'child_process',
})

export const statistics: StatisticsInfo = {
  tileCount: 0,
  completeCount: 0,
  levelInfo: {},
}

// 公共资源，包括ds，path对象
let sourceDs: Dataset | null
let projectDs: Dataset | null
let projectPath: string | null
let encodePath: string | null
let tileBoundTool: Bound

/**
 * 清理临时文件
 */
async function recycle() {
  if (sourceDs !== null) {
    try {
      sourceDs.close()
    }
    catch (e) {
      console.error(e)
    }
    sourceDs = null
  }
  if (projectDs !== null) {
    try {
      projectDs.close()
    }
    catch (e) {
      console.error(e)
    }
    projectDs = null
  }
  // 存在临时文件，强制删除
  if (projectPath && existsSync(projectPath)) {
    await fs.rm(projectPath, { recursive: true })
    projectPath = null
  }
  if (encodePath && existsSync(encodePath)) {
    await fs.rm(encodePath, { recursive: true })
    encodePath = null
  }
  // 存在临时影像金字塔附属文件
  const ovrPath = `${encodePath}.ovr`
  if (existsSync(ovrPath)) {
    await fs.rm(ovrPath)
  }
}

/**
 * 重投影数据集
 */
function reproject(ds: Dataset, epsg: number, resampling: number) {
  const projectDatasetPath = path.join(os.tmpdir(), 'dem-dynamic-terrain', `${uuid()}.tif`)
  reprojectImage(ds, projectDatasetPath, epsg, resampling)
  return projectDatasetPath
}

/**
 * 构建影像金字塔
 * @param ds
 * @param  minZoom
 * @returns adjustZoom
 */
function buildPyramid(ds: gdal.Dataset, minZoom: number, resampling: number) {
  const res = ds.geoTransform![1] // 使用resx替代整个影像的分辨率
  const maxPixel = Math.min(ds.rasterSize.x, ds.rasterSize.y)
  // 金字塔分级制度，默认2的等比
  let overviewNum = 1
  while (maxPixel / 2 ** overviewNum > 256) {
    overviewNum++
  }
  // 计算originZ
  let res_zoom = (tileBoundTool.xmax - tileBoundTool.xmin) / 256
  let originZ = 0
  while (res_zoom / 2 > res) {
    res_zoom = res_zoom / 2
    originZ++
  }
  // 即从originZ以下，建立overviewNum个影像金字塔 <originZ| originZ-1 originZ-2 originZ-3 originZ-4 |originZ-5>
  const overviews: number[] = []
  for (let zoom = originZ - 1; zoom >= originZ - 1 - overviewNum; zoom--) {
    if (zoom < minZoom)
      break
    const factor = 2 ** (originZ - zoom)
    overviews.push(factor)
  }
  const buildOverviewResampling = getBuildOverviewResampling(resampling)
  ds.buildOverviews(buildOverviewResampling, overviews)
  // z>=originZ使用原始影像
  return {
    maxOverViewsZ: originZ - 1, // 大于该值用原始影像
    minOverViewsZ: originZ - overviews.length, // 小于该值，用最后一级别影像金字塔索引
  }
}

/**
 * 生产切片
 * @param input TIF 文件路径
 * @param output 输出目录
 * @param options 可选配置
 */
async function generateTile(input: string, output: string, options: Options) {
  // 结构可选参数
  const { minZoom, maxZoom, epsg, encoding, isClean, resampling } = options
  // 固定瓦片尺寸
  const tileSize = 256
  // 瓦片边界
  tileBoundTool = tileBoundMap.get(epsg as any)!
  // 判断是否以mbtiles转储
  const isSavaMbtiles = (path.extname(output) === '.mbtiles')
  // 定义切片临时输出目录
  let outputDir = output
  // 如果以mbtiles存储重定向为临时目录
  if (isSavaMbtiles === true) {
    outputDir = path.join(os.tmpdir(), uuid())
  }

  let stepIndex = 0
  if (isClean) {
    if (existsSync(output)) {
      await fs.rm(output, { recursive: true })
    }
    await fs.mkdir(output, { recursive: true })
    console.log(`>> 步骤${++stepIndex}: 清空输出文件夹 - 完成`)
  }
  sourceDs = gdal.open(input, 'r')
  // #region 步骤 1 - 重投影
  // @ts-expect-error
  if (sourceDs.srs?.getAuthorityCode() !== epsg) {
    projectPath = reproject(sourceDs, epsg, resampling)
    projectDs = gdal.open(projectPath, 'r+')
    sourceDs.close() // 原始的就不需要了
    console.log(`>> 步骤${++stepIndex}: 重投影至 EPSG:${epsg} - 完成`)
  }
  else {
    projectDs = sourceDs
  }
  sourceDs = null
  // #endregion
  // #region 步骤 2 - 建立影像金字塔 由于地形通常是30m 90m精度
  const overViewInfo = buildPyramid(projectDs, minZoom, resampling)
  console.log(`>> 步骤${++stepIndex}: 构建影像金字塔索引 - 完成`)
  // #endregion

  // #region 步骤3 - 切片
  const geoTransform = projectDs.geoTransform!
  const dsInfo: OverviewInfo = {
    width: projectDs.rasterSize.x,
    height: projectDs.rasterSize.y,
    resX: geoTransform[1],
    resY: geoTransform[5],
    startX: geoTransform[0],
    startY: geoTransform[3],
    endX: geoTransform[0] + projectDs.rasterSize.x * geoTransform[1],
    endY: geoTransform[3] + projectDs.rasterSize.y * geoTransform[5],
    path: projectDs.description,
  }

  // 计算切片总数
  // 堆积任务数量
  let pileUpCount = 0
  let miny: number | undefined
  let maxy: number | undefined

  if (dsInfo.startY < dsInfo.endY!) {
    miny = dsInfo.startY
    maxy = dsInfo.endY
  }
  else {
    miny = dsInfo.endY
    maxy = dsInfo.startY
  }
  // xyz是从左上角开始，往右下角走
  const startPoint: [number, number] = [dsInfo.startX, maxy!]
  const endPoint: [number, number] = [dsInfo.endX!, miny!]
  for (let tz = minZoom; tz <= maxZoom; ++tz) {
    const minRC = getTileByCoors(startPoint, tz, tileBoundTool)
    const maxRC = getTileByCoors(endPoint, tz, tileBoundTool)
    statistics.tileCount += (maxRC.row - minRC.row + 1) * (maxRC.column - minRC.column + 1)
    statistics.levelInfo[tz] = {
      tminx: minRC.column,
      tminy: minRC.row,
      tmaxx: maxRC.column,
      tmaxy: maxRC.row,
    }
  }
  // 实际裙边有1像素 256+1+1 上下左右各1像素
  // 裙边所需的缩放
  const buffer = 1
  let outTileSize = tileSize
  if (encoding === 'mapbox') {
    outTileSize = tileSize + buffer * 2
  }

  // 切片任务数组
  const jobs: any[] = []

  for (let tz = minZoom; tz <= maxZoom; tz++) {
    const { tminx, tminy, tmaxx, tmaxy } = statistics.levelInfo[tz]
    let overviewInfo: OverviewInfo
    // 根据z获取宽高和分辨率信息
    if (tz > overViewInfo.maxOverViewsZ) {
      overviewInfo = dsInfo
    }
    else {
      const startZ = Math.max(tz, overViewInfo.minOverViewsZ)
      const factorZoom = overViewInfo.maxOverViewsZ - startZ
      const factor = 2 ** (factorZoom + 1)
      overviewInfo = {
        index: factorZoom, // 影像金字塔序号从0开始
        startX: dsInfo.startX,
        startY: dsInfo.startY,
        width: Math.ceil(dsInfo.width * 1.0 / factor),
        height: Math.ceil(dsInfo.height * 1.0 / factor),
        resX: dsInfo.resX * factor,
        resY: dsInfo.resY * factor,
      }
    }
    for (let j = tminx; j <= tmaxx; j++) {
      // 递归创建目录
      await fs.mkdir(path.join(outputDir, tz.toString(), j.toString()), { recursive: true })
      for (let i = tminy; i <= tmaxy; i++) {
        const tileBound = ST_TileEnvelope(tz, j, i, buffer, tileBoundTool)
        const { rb, wb } = geoQuery(
          overviewInfo,
          tileBound[0],
          tileBound[3],
          tileBound[2],
          tileBound[1],
          outTileSize,
        )
        const createInfo: CreateInfo = {
          outTileSize,
          overviewInfo,
          rb,
          wb,
          encoding,
          dsPath: dsInfo.path!,
          x: j,
          y: i,
          z: tz,
          outputTile: outputDir,
        }
        pileUpCount++
        console.log(`切片任务: ${tz}/${j}/${i}`)
        jobs.push(pool.run(createInfo))
      }
    }
  }

  console.log(`切片总数数量: ${pileUpCount}`)
  await Promise.all(jobs)
  await pool.destroy()
  await recycle()
  resetStats()
  console.log(`\n>> 步骤${++stepIndex}: 切片 - 完成`)
  // #endregion
}

/**
 * 重置统计信息
 */
function resetStats() {
  statistics.tileCount = 0
  statistics.completeCount = 0
  statistics.levelInfo = {}
}

/**
 * TODO: 重构使其支持影像金字塔查询
 * @param overviewInfo
 * @param ulx
 * @param uly
 * @param lrx
 * @param lry
 * @param querysize
 */
function geoQuery(overviewInfo: OverviewInfo, ulx: number, uly: number, lrx: number, lry: number, querysize = 0) {
  const { startX, startY, width, height, resX, resY } = overviewInfo
  // 根据金字塔级别，重置分辨率，重置宽高
  let rx = Math.floor((ulx - startX) / resX + 0.001)
  let ry = Math.floor((uly - startY) / resY + 0.001)
  let rxsize = Math.max(1, Math.floor((lrx - ulx) / resX + 0.5))
  let rysize = Math.max(1, Math.floor((lry - uly) / resY + 0.5))
  let wxsize, wysize
  if (!querysize) {
    wxsize = rxsize
    wysize = rysize
  }
  else {
    wxsize = querysize
    wysize = querysize
  }
  let wx = 0
  if (rx < 0) {
    const rxshift = Math.abs(rx)
    wx = Math.floor(wxsize * (rxshift * 1.0 / rxsize))
    wxsize = wxsize - wx
    rxsize = rxsize - Math.floor(rxsize * (rxshift * 1.0 / rxsize))
    rx = 0
  }
  if ((rx + rxsize) > width) {
    wxsize = Math.floor(wxsize * (width - rx) * 1.0 / rxsize)
    rxsize = width - rx
  }
  let wy = 0
  if (ry < 0) {
    const ryshift = Math.abs(ry)
    wy = Math.floor(wysize * (ryshift * 1.0 / rysize))
    wysize = wysize - wy
    rysize = rysize - Math.floor(rysize * (ryshift * 1.0 / rysize))
    ry = 0
  }
  if ((ry + rysize) > height) {
    wysize = Math.floor(wysize * (height - ry) * 1.0 / rysize)
    rysize = height - ry
  }
  return {
    rb: { rx, ry, rxsize, rysize },
    wb: { wx, wy, wxsize, wysize },
  }
}

/**
 * 根据tms或xyz策略修正Y的实际值
 * @param ty
 * @param tz
 * @param tms2xyz
 */
function getYtile(ty: number, tz: number, tms2xyz = true) {
  if (tms2xyz) {
    return 2 ** tz - 1 - ty
  }
  return ty
}

export default generateTile
export * from './types'
