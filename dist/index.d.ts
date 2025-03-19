import type { Dataset } from 'gdal-async';

export declare interface CreateInfo {
    outTileSize: number;
    overviewInfo: OverviewInfo;
    rb: {
        rx: number;
        ry: number;
        rxsize: number;
        rysize: number;
        ds?: Dataset;
    };
    wb: {
        wx: number;
        wy: number;
        wxsize: number;
        wysize: number;
        ds?: Dataset;
    };
    encoding: 'mapbox' | 'terrarium';
    dsPath: string;
    x: number;
    y: number;
    z: number;
    outputTile: string;
}

export declare interface DsInfo {
    ds: Dataset;
    path: string;
}

/**
 * 生产切片
 * @param input TIF 文件路径
 * @param output 输出目录
 * @param options 可选配置
 */
declare function generateTile(input: string, output: string, options: Options): Promise<void>;
export default generateTile;

export declare interface LevelInfo {
    tminx: number;
    tminy: number;
    tmaxx: number;
    tmaxy: number;
}

export declare interface LevelInfoDict {
    [key: number]: LevelInfo;
}

export declare interface Options {
    minZoom: number;
    maxZoom: number;
    epsg: number;
    encoding: 'mapbox' | 'terrarium';
    isClean: boolean;
    resampling: number;
    baseHeight: number;
}

export declare interface OverviewInfo {
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

export declare interface OverviewInfoDict {
    [key: number]: OverviewInfo;
}

export declare const statistics: StatisticsInfo;

export declare interface StatisticsInfo {
    tileCount: number;
    completeCount: number;
    levelInfo: LevelInfoDict;
}

export { }
