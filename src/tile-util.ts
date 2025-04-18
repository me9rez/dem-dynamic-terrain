export type EPSG = 3857 | 4326 | 4490 | 900913

export interface Bound {
  xmin: number
  ymin: number
  xmax: number
  ymax: number
}

/**
 * 切片范围
 */
const tileBoundMap = new Map<EPSG, Bound>()

tileBoundMap.set(3857, {
  xmin: -20037508.342789244,
  ymin: -20037508.342789244,
  xmax: 20037508.342789244,
  ymax: 20037508.342789244,
})
tileBoundMap.set(900913, {
  xmin: -20037508.342789244,
  ymin: -20037508.342789244,
  xmax: 20037508.342789244,
  ymax: 20037508.342789244,
})
tileBoundMap.set(4490, {
  xmin: -180,
  ymin: -90,
  xmax: 180,
  ymax: 90,
})
tileBoundMap.set(4326, {
  xmin: -180,
  ymin: -90,
  xmax: 180,
  ymax: 90,
})

/**
 * 根据xyz计算对应地理坐标系的地理边界
 * @param z
 * @param x
 * @param y
 * @param offset
 * @param bbox
 */
function ST_TileEnvelope(z: number, x: number, y: number, offset = 0, bbox = tileBoundMap.get(3857)!) {
  const tile_size = 256.0
  const boundsWidth = bbox.xmax - bbox.xmin
  const boundsHeight = bbox.ymax - bbox.ymin
  if (boundsWidth <= 0 || boundsHeight <= 0)
    throw new Error('Geometric bounds are too small')
  if (z < 0 || z >= 32)
    throw new Error(`Invalid tile zoom value, ${z}`)
    // 总瓦片数量=worldTileSize*worldTileSize
  const worldTileSize = 0x01 << (z > 31 ? 31 : z)

  if (x < 0 || x >= worldTileSize)
    throw new Error(`Invalid tile x value, ${x}`)
  if (y < 0 || y >= worldTileSize)
    throw new Error(`Invalid tile y value, ${y}`)
    // 地理切片分辨率
  const tileGeoSizeX = boundsWidth * 1.0 / worldTileSize
  const tileGeoSizeY = boundsHeight * 1.0 / worldTileSize

  const tileGeoSize = Math.max(tileGeoSizeX, tileGeoSizeY)

  const x1 = bbox.xmin + tileGeoSize * x - tileGeoSize / tile_size * offset
  const x2 = bbox.xmin + tileGeoSize * (x + 1) + tileGeoSize / tile_size * offset

  const y1 = bbox.ymax - tileGeoSize * (y + 1) - tileGeoSize / tile_size * offset
  const y2 = bbox.ymax - tileGeoSize * (y) + tileGeoSize / tile_size * offset

  return [x1, y1, x2, y2]
}

/**
 * 根据任意地理坐标计算在指定zoom层级下其对应的瓦片行列号
 * @param coord
 * @param zoom
 * @param bbox
 */
function getTileByCoors(coord: [number, number], zoom: number, bbox = tileBoundMap.get(3857)!) {
  // 计算coor与bbox左上角坐标
  const left = bbox.xmin
  const top = bbox.ymax
  const _width = coord[0] - left
  const _height = top - coord[1]
  const worldTileSize = 0x01 << zoom
  const boundsWidth = bbox.xmax - bbox.xmin
  const boundsHeight = bbox.ymax - bbox.ymin
  const tileGeoSize = Math.max(boundsWidth, boundsHeight) * 1.0 / worldTileSize
  const row = Math.floor(_height / tileGeoSize)
  const column = Math.floor(_width / tileGeoSize)

  return {
    row,
    column,
  }
}

export {
  getTileByCoors,
  ST_TileEnvelope,
  tileBoundMap,
}
