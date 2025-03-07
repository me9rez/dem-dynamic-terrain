import type { Dataset } from 'gdal-async';

export declare type CreateInfo = {
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
};

export declare type DsInfo = {
    ds: Dataset;
    path: string;
};

/**
 * 生产切片
 * @param tifFilePath TIF 文件路径
 * @param outputDir 输出目录
 * @param options 可选配置
 */
declare function generateTile(input: string, output: string, options: Options): Promise<void>;
export default generateTile;

export declare type LevelInfo = {
    tminx: number;
    tminy: number;
    tmaxx: number;
    tmaxy: number;
};

export declare type LevelInfoDict = {
    [key: number]: LevelInfo;
};

export declare type Options = {
    minZoom: number;
    maxZoom: number;
    epsg: number;
    encoding: 'mapbox' | 'terrarium';
    isClean: boolean;
    resampling: number;
    baseHeight: number;
};

export declare type OverviewInfo = {
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
};

export declare type OverviewInfoDict = {
    [key: number]: OverviewInfo;
};

export declare let statistics: StatisticsInfo;

export declare type StatisticsInfo = {
    tileCount: number;
    completeCount: number;
    levelInfo: LevelInfoDict;
};

export { }
