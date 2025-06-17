import type { Dataset, Driver } from 'gdal-async'
import type { Bound } from './tile-util'
import type {
  CreateInfo,
  Options,
  OverviewInfo,
  StatisticsInfo,
} from './types'

import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import Emittery from 'emittery'
import gdal from 'gdal-async'

import PQueue from 'p-queue'
import Tinypool from 'tinypool'

import yoctoSpinner from 'yocto-spinner'
import pkg from '../package.json'
import { getBuildOverviewResampling, reprojectImage } from './gdal-util'
import { createLogger } from './logger'
import { getTileByCoors, ST_TileEnvelope, tileBoundMap } from './tile-util'
import { uuid } from './util'

export interface EventMap {
  completed: {
    id: string
    tileCount: number
    createTileCount: number
  }
  idle: {
    id: string
    tileCount: number
    createTileCount: number
  }
}

/**
 * tif切片
 */
export class TIF2Tiles {
  private input: string
  private output: string
  private options: Options

  private queue: PQueue
  private pool: Tinypool
  private log: (msg: string) => void = () => {}

  // 公共资源，包括ds，path对象
  private sourceDs: Dataset | null
  private projectDs: Dataset | null
  private projectPath: string | null
  private encodePath: string | null
  private tileBoundTool: Bound

  // 统计信息
  statistics: StatisticsInfo = {
    tileCount: 0,
    completeCount: 0,
    levelInfo: {},
  }

  // 任务id
  id = uuid()
  emitter = new Emittery<EventMap>()

  constructor(input: string, output: string, options: Options) {
    this.input = input
    this.output = output
    this.options = options

    this.pool = new Tinypool({
      filename: this.getWorkerPath(),
      runtime: 'child_process',
      // minThreads: os.cpus().length / 2,
    })
    this.queue = new PQueue({
      concurrency: os.cpus().length,
      autoStart: false,
    })
    this.sourceDs = null
    this.projectDs = null
    this.projectPath = null
    this.encodePath = null
    this.tileBoundTool = {
      xmin: 0,
      ymin: 0,
      xmax: 0,
      ymax: 0,
    }
    const { log } = createLogger(options.log)
    this.log = log
  }

  getWorkerPath() {
    if (import.meta?.env?.MODE === 'production') {
      return new URL('./create-tile.js', import.meta.url).href
    }
    else {
      return new URL('./create-tile.ts', import.meta.url).href
    }
  }

  /**
   * 清理临时文件
   */
  async recycle() {
    const log = this.log
    if (this.sourceDs) {
      try {
        this.sourceDs.close()
      }
      catch (e: any) {
        log(e)
      }
      this.sourceDs = null
    }
    if (this.projectDs) {
      try {
        this.projectDs.close()
      }
      catch (e: any) {
        log(e)
      }
      this.projectDs = null
    }
    // 存在临时文件，强制删除
    if (this.projectPath && existsSync(this.projectPath)) {
      await fs.rm(this.projectPath, { recursive: true })
      this.projectPath = null
    }
    if (this.encodePath && existsSync(this.encodePath)) {
      await fs.rm(this.encodePath, { recursive: true })
      this.encodePath = null
    }
    // 存在临时影像金字塔附属文件
    const ovrPath = `${this.encodePath}.ovr`
    if (existsSync(ovrPath)) {
      await fs.rm(ovrPath, { recursive: true })
    }
  }

  /**
   * 重投影数据集
   */
  async reproject(ds: Dataset, epsg: number, resampling: number) {
    // 临时重投影tif文件路径
    const projectDatasetPath = path.join(
      os.tmpdir(),
      pkg.tempDir,
      `${this.id}.tif`,
    )
    // 创建目录
    await fs.mkdir(path.dirname(projectDatasetPath), { recursive: true })
    // 重投影
    reprojectImage(ds, projectDatasetPath, epsg, resampling)
    return projectDatasetPath
  }

  /**
   * 构建影像金字塔
   * @param ds
   * @param  minZoom
   * @returns adjustZoom
   */
  buildPyramid(ds: gdal.Dataset, minZoom: number, resampling: number) {
    const res = ds.geoTransform![1] // 使用resx替代整个影像的分辨率
    const maxPixel = Math.min(ds.rasterSize.x, ds.rasterSize.y)
    // 金字塔分级制度，默认2的等比
    let overviewNum = 1
    while (maxPixel / 2 ** overviewNum > 256) {
      overviewNum++
    }
    // 计算originZ
    let res_zoom = (this.tileBoundTool.xmax - this.tileBoundTool.xmin) / 256
    let originZ = 0
    while (res_zoom / 2 > res) {
      res_zoom = res_zoom / 2
      originZ++
    }
    // 即从originZ以下，建立overviewNum个影像金字塔 <originZ| originZ-1 originZ-2 originZ-3 originZ-4 |originZ-5>
    const overviews: number[] = []
    for (let zoom = originZ - 1; zoom >= originZ - 1 - overviewNum; zoom--) {
      if (zoom < minZoom) {
        break
      }
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
   * 生成切片
   */
  async generateTile() {
    const log = this.log
    // 切图参数
    const { input, output, options } = this
    // 切片类型
    const type = options.type
    // 结构可选参数
    const { minZoom, maxZoom, epsg, encoding, isClean, resampling } = options
    // 固定瓦片尺寸
    const tileSize = 256
    // 瓦片边界
    this.tileBoundTool = tileBoundMap.get(epsg as any)!
    // 判断是否以mbtiles转储
    const isSavaMbtiles = path.extname(output) === '.mbtiles'
    // 定义切片临时输出目录
    let outputDir = output
    // 如果以mbtiles存储重定向为临时目录
    if (isSavaMbtiles === true) {
      outputDir = path.join(os.tmpdir(), this.id)
    }

    let stepIndex = 0
    if (isClean) {
      if (existsSync(output)) {
        await fs.rm(output, { recursive: true })
      }
      await fs.mkdir(output, { recursive: true })
      log(`- 步骤${++stepIndex}: 清空输出文件夹 - 完成`)
    }

    this.sourceDs = gdal.open(input, 'r')
    // #region 步骤 1 - 重投影
    if (this.sourceDs.srs?.getAuthorityCode() !== epsg as any as string) {
      this.projectPath = await this.reproject(this.sourceDs, epsg, resampling)
      this.projectDs = gdal.open(this.projectPath, 'r+')
      this.sourceDs.close() // 原始的就不需要了
      log(`- 步骤${++stepIndex}: 重投影至 EPSG:${epsg} - 完成`)
    }
    else {
      this.projectDs = this.sourceDs
    }
    this.sourceDs = null
    // #endregion

    // #region 步骤 2 - 建立影像金字塔，地形通常是30m 90m精度
    const overViewInfo = this.buildPyramid(this.projectDs, minZoom, resampling)
    log(`- 步骤${++stepIndex}: 构建影像金字塔索引 - 完成`)
    // #endregion

    // #region 步骤3 - 切片
    const projectDs = this.projectDs
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

    // 切片总数
    let tileCount = 0
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
      const minRC = getTileByCoors(startPoint, tz, this.tileBoundTool)
      const maxRC = getTileByCoors(endPoint, tz, this.tileBoundTool)
      this.statistics.tileCount += (maxRC.row - minRC.row + 1) * (maxRC.column - minRC.column + 1)
      this.statistics.levelInfo[tz] = {
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
    if (type === 'dom') {
      outTileSize = tileSize
    }

    let spinner: any
    if (options.log) {
      spinner = yoctoSpinner({
        text: `步骤${++stepIndex}: 开始准备切片队列 - 完成`,
      }).start()
    }
    else {
      spinner = {
        text: '',
        error: () => {},
        success: () => {},
      }
    }

    const queue = this.queue
    // 切片任务数组
    const jobs: any[] = []

    // 监听切片完成事件
    queue.on('completed', (result) => {
      jobs.push(result)
      // 计算进度
      const percent = Math.floor((jobs.length / tileCount) * 100)
      // 更新进度条
      spinner.text = `切片进度: ${percent}%`

      this.emitter.emit('completed', {
        id: this.id,
        tileCount,
        createTileCount: jobs.length,
      })
    })

    // 队列中所有任务完成
    queue.on('idle', async () => {
      if (jobs.length !== tileCount) {
        spinner.error(`步骤${++stepIndex}: 切片 - 失败`)
      }
      if (jobs.length === tileCount) {
        spinner.success(`步骤${++stepIndex}: 切片 - 完成`)
      }

      this.resetStats()
      await this.pool.destroy()
      await this.recycle()

      this.emitter.emit('idle', {
        id: this.id,
        tileCount,
        createTileCount: jobs.length,
      })
    })

    for (let tz = minZoom; tz <= maxZoom; tz++) {
      const { tminx, tminy, tmaxx, tmaxy } = this.statistics.levelInfo[tz]
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
        await fs.mkdir(path.join(outputDir, tz.toString(), j.toString()), {
          recursive: true,
        })

        for (let i = tminy; i <= tmaxy; i++) {
          const tileBound = ST_TileEnvelope(
            tz,
            j,
            i,
            buffer,
            this.tileBoundTool,
          )
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
            type,
          }
          tileCount++
          // 加入队列
          queue.add(() => this.pool.run(createInfo))
        }
      }
    }
    log(`\n- 步骤${++stepIndex}: 生成切片任务队列: ${tileCount} - 完成`)
    queue.start()
    // #endregion
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.statistics.tileCount = 0
    this.statistics.completeCount = 0
    this.statistics.levelInfo = {}
  }
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
function geoQuery(
  overviewInfo: OverviewInfo,
  ulx: number,
  uly: number,
  lrx: number,
  lry: number,
  querysize = 0,
) {
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

export * from './types'
