import type { Dataset, Driver } from 'gdal-async'

export type Options = {
    minZoom: number,
    maxZoom: number,
    epsg: number,
    encoding: 'mapbox' | 'terrarium',
    isClean: boolean,
    resampling: number
    baseHeight: number
}

export type LevelInfo = {
    tminx: number;
    tminy: number;
    tmaxx: number;
    tmaxy: number;
}

export type LevelInfoDict = {
    [key: number]: LevelInfo;
}


export type OverviewInfo = {
    index?: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
    resX: number;
    resY: number;
    endX?: number;
    endY?: number;
    path?: string;
}

export type OverviewInfoDict = {
    [key: number]: OverviewInfo;
}

export type DsInfo = {
    ds: Dataset;
    path: string;
}

export type StatisticsInfo = {
    tileCount: number;
    completeCount: number;
    levelInfo: LevelInfoDict;
}

export type CreateInfo = {
    outTileSize: number,
    overviewInfo: OverviewInfo,
    rb: { rx: number, ry: number, rxsize: number, rysize: number, ds?: Dataset },
    wb: { wx: number, wy: number, wxsize: number, wysize: number, ds?: Dataset },
    encoding: 'mapbox' | 'terrarium',
    dsPath: string,
    x: number,
    y: number,
    z: number,
    outputTile: string
}