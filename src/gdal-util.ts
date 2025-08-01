import type { Dataset, Driver } from 'gdal-async'
import gdal from 'gdal-async'

/**
 * 根据策略获取对应的采样方法
 * @param resampling
 */
function getBuildOverviewResampling(resampling: number) {
  switch (resampling) {
    case 1:
      return 'AVERAGE' // 加权平均法
    case 2:
      return 'BILINEAR' // 双线性内插法
    case 3:
      return 'CUBIC' // 三次卷积内插法
    case 4:
      return 'CUBICSPLINE' // B样条卷积内插法
    case 5:
      return 'LANCZOS' // Lanczos窗口sinc卷积内插法
    case 6:
      return 'MODE' // 最常出现值法
    case 7:
      return 'NEAREST' // 最邻近法
    default:
      return 'CUBIC'
  }
}

function getResampling(resampling: number) {
  let gdal_resampling
  switch (resampling) {
    case 1:
      return gdal_resampling = gdal.GRA_Average
    case 2:
      return gdal_resampling = gdal.GRA_Bilinear
    case 3:
      return gdal_resampling = gdal.GRA_Cubic
    case 4:
      return gdal_resampling = gdal.GRA_CubicSpline
    case 5:
      return gdal_resampling = gdal.GRA_Lanczos
    case 6:
      return gdal_resampling = gdal.GRA_Mode
    case 7:
      return gdal_resampling = gdal.GRA_NearestNeighbor
    default:
      return gdal_resampling = gdal.GRA_Cubic
  }
}

/**
 * 根据驱动名称（支持任意大小写）获取 GDAL 驱动
 * @param driverName 驱动名称
 */
function getDriverByName(driverName: string) {
  const length = gdal.drivers.count()
  const nameNormal = driverName.toUpperCase()
  for (let i = 0; i < length; i++) {
    const driver = gdal.drivers.get(i)
    if (driver.description === nameNormal) {
      return driver
    }
  }
  throw new Error(`当前gdal中不存在输入的驱动名称${nameNormal}`)
}

/**
 * 栅格重投影
 * @description 输入一个源数据，设置投影输出数据文件路径和投影坐标系的epsg编码，设置采样参数，输出栅格重投影文件
 * @param src_ds  输入的栅格文件路径或者gdal的数据集对象。
 * @param reproject_path  输出的重投影后的栅格文件路径。
 * @param t_epsg  重投影的坐标系epsg编码。
 * @param resampling  重投影后的采样参数，默认是 0，意义为：0: average, 1: bilinear, 2: cubic, 3: cubicspline, 4: lanczos, 5: mode, 6: nearestNeighbor。
 * @return
 *
 * @author freegis
 */
function reprojectImage(src_ds: string | Dataset, reproject_path: string, t_epsg: number, resampling = 1) {
  let s_ds: Dataset
  if (typeof src_ds === 'string')
    s_ds = gdal.open(src_ds)
  else
    s_ds = src_ds
  // 获取源数据集的 坐标系
  const s_srs = s_ds.srs!
  // 投影的目标坐标系
  const t_srs = gdal.SpatialReference.fromEPSGA(t_epsg)
  // 输入源数据，源坐标系，目标坐标系，智能计算出输出的栅格像元分辨率和仿射变换参数
  const { rasterSize, geoTransform } = gdal.suggestedWarpOutput({
    src: s_ds,
    s_srs,
    t_srs,
  })
  // 获取原始数据第一个band的数据类型，作为新的投影后的数据类型
  // 如果不写，类似默认是uint8，而dem是 int16，就会数据错误
  const dataType = s_ds.bands.get(1).dataType!
  // 使用源数据的驱动，保持文件格式不变
  const t_driver = s_ds.driver
  // 创建输出图像
  const t_ds = t_driver.create(reproject_path, rasterSize.x, rasterSize.y, s_ds.bands.count(), dataType)
  // 重置索引和仿射变换参数
  t_ds.srs = t_srs
  t_ds.geoTransform = geoTransform
  // 重采样方法
  const gdal_resampling = getResampling(resampling)
  gdal.reprojectImage({ src: s_ds, dst: t_ds, s_srs, t_srs, resampling: gdal_resampling })
  // 复制源数据的nodata值到目标数据
  const bands = s_ds.bands.count()
  // console.log(`原始数据波段数：${bands}`)
  for (let i = 0; i < bands; i++) {
    const s_band = s_ds.bands.get(i + 1)
    const t_band = t_ds.bands.get(i + 1)
    t_band.noDataValue = s_band.noDataValue
    const dataType = s_band.dataType
    // console.log(`第${i + 1}波段数据类型: ${dataType}`)
  }
  // t_ds.bands.get(1).noDataValue = s_ds.bands.get(1).noDataValue
  // 关闭退出
  t_ds.close()
  if (typeof src_ds === 'string') {
    s_ds.close()
  }
}

export {
  getBuildOverviewResampling,
  getDriverByName,
  reprojectImage,
}
