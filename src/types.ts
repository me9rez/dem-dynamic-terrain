import type { Dataset, Driver } from 'gdal-async'

export interface Options {
  minZoom: number
  maxZoom: number
  epsg: number
  encoding: 'mapbox' | 'terrarium'
  isClean: boolean
  resampling: number
  baseHeight: number
  type: 'terrain' | 'dom'
}

export interface LevelInfo {
  tminx: number
  tminy: number
  tmaxx: number
  tmaxy: number
}

export interface LevelInfoDict {
  [key: number]: LevelInfo
}

export interface OverviewInfo {
  index?: number
  startX: number
  startY: number
  width: number
  height: number
  resX: number
  resY: number
  endX?: number
  endY?: number
  path?: string
}

export interface OverviewInfoDict {
  [key: number]: OverviewInfo
}

export interface DsInfo {
  ds: Dataset
  path: string
}

export interface StatisticsInfo {
  tileCount: number
  completeCount: number
  levelInfo: LevelInfoDict
}

export interface CreateInfo {
  outTileSize: number
  overviewInfo: OverviewInfo
  rb: { rx: number, ry: number, rxsize: number, rysize: number, ds?: Dataset }
  wb: { wx: number, wy: number, wxsize: number, wysize: number, ds?: Dataset }
  encoding: 'mapbox' | 'terrarium'
  dsPath: string
  x: number
  y: number
  z: number
  outputTile: string
  type: 'terrain' | 'dom'
}
