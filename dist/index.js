import * as __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__ from "node:fs";
import * as __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__ from "node:fs/promises";
import * as __WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__ from "node:os";
import * as __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__ from "node:path";
import * as __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__ from "gdal-async";
import * as __WEBPACK_EXTERNAL_MODULE_tinypool__ from "tinypool";
import * as __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__ from "node:crypto";
var package_namespaceObject = JSON.parse('{"KR":"dem-dynamic-terrain"}');
function getBuildOverviewResampling(resampling) {
    switch(resampling){
        case 1:
            return 'AVERAGE';
        case 2:
            return 'BILINEAR';
        case 3:
            return 'CUBIC';
        case 4:
            return 'CUBICSPLINE';
        case 5:
            return 'LANCZOS';
        case 6:
            return 'MODE';
        case 7:
            return 'NEAREST';
        default:
            return 'CUBIC';
    }
}
function getResampling(resampling) {
    switch(resampling){
        case 1:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Average;
        case 2:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Bilinear;
        case 3:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Cubic;
        case 4:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_CubicSpline;
        case 5:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Lanczos;
        case 6:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Mode;
        case 7:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_NearestNeighbor;
        default:
            return __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GRA_Cubic;
    }
}
function reprojectImage(src_ds, reproject_path, t_epsg, resampling = 1) {
    let s_ds;
    s_ds = 'string' == typeof src_ds ? __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].open(src_ds) : src_ds;
    const s_srs = s_ds.srs;
    const t_srs = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].SpatialReference.fromEPSGA(t_epsg);
    const { rasterSize, geoTransform } = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].suggestedWarpOutput({
        src: s_ds,
        s_srs,
        t_srs
    });
    const dataType = s_ds.bands.get(1).dataType;
    const t_driver = s_ds.driver;
    const t_ds = t_driver.create(reproject_path, rasterSize.x, rasterSize.y, s_ds.bands.count(), dataType);
    t_ds.srs = t_srs;
    t_ds.geoTransform = geoTransform;
    const gdal_resampling = getResampling(resampling);
    __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].reprojectImage({
        src: s_ds,
        dst: t_ds,
        s_srs,
        t_srs,
        resampling: gdal_resampling
    });
    t_ds.bands.get(1).noDataValue = s_ds.bands.get(1).noDataValue;
    t_ds.close();
    if ('string' == typeof src_ds) s_ds.close();
}
const tileBoundMap = new Map();
tileBoundMap.set(3857, {
    xmin: -20037508.342789244,
    ymin: -20037508.342789244,
    xmax: 20037508.342789244,
    ymax: 20037508.342789244
});
tileBoundMap.set(900913, {
    xmin: -20037508.342789244,
    ymin: -20037508.342789244,
    xmax: 20037508.342789244,
    ymax: 20037508.342789244
});
tileBoundMap.set(4490, {
    xmin: -180,
    ymin: -90,
    xmax: 180,
    ymax: 90
});
tileBoundMap.set(4326, {
    xmin: -180,
    ymin: -90,
    xmax: 180,
    ymax: 90
});
function ST_TileEnvelope(z, x, y, offset = 0, bbox = tileBoundMap.get(3857)) {
    const tile_size = 256.0;
    const boundsWidth = bbox.xmax - bbox.xmin;
    const boundsHeight = bbox.ymax - bbox.ymin;
    if (boundsWidth <= 0 || boundsHeight <= 0) throw new Error('Geometric bounds are too small');
    if (z < 0 || z >= 32) throw new Error(`Invalid tile zoom value, ${z}`);
    const worldTileSize = 0x01 << (z > 31 ? 31 : z);
    if (x < 0 || x >= worldTileSize) throw new Error(`Invalid tile x value, ${x}`);
    if (y < 0 || y >= worldTileSize) throw new Error(`Invalid tile y value, ${y}`);
    const tileGeoSizeX = +boundsWidth / worldTileSize;
    const tileGeoSizeY = +boundsHeight / worldTileSize;
    const tileGeoSize = Math.max(tileGeoSizeX, tileGeoSizeY);
    const x1 = bbox.xmin + tileGeoSize * x - tileGeoSize / tile_size * offset;
    const x2 = bbox.xmin + tileGeoSize * (x + 1) + tileGeoSize / tile_size * offset;
    const y1 = bbox.ymax - tileGeoSize * (y + 1) - tileGeoSize / tile_size * offset;
    const y2 = bbox.ymax - tileGeoSize * y + tileGeoSize / tile_size * offset;
    return [
        x1,
        y1,
        x2,
        y2
    ];
}
function getTileByCoors(coord, zoom, bbox = tileBoundMap.get(3857)) {
    const left = bbox.xmin;
    const top = bbox.ymax;
    const _width = coord[0] - left;
    const _height = top - coord[1];
    const worldTileSize = 0x01 << zoom;
    const boundsWidth = bbox.xmax - bbox.xmin;
    const boundsHeight = bbox.ymax - bbox.ymin;
    const tileGeoSize = +Math.max(boundsWidth, boundsHeight) / worldTileSize;
    const row = Math.floor(_height / tileGeoSize);
    const column = Math.floor(_width / tileGeoSize);
    return {
        row,
        column
    };
}
const pool = new __WEBPACK_EXTERNAL_MODULE_tinypool__["default"]({
    filename: new URL('./create-tile.js', import.meta.url).href,
    runtime: 'child_process'
});
const statistics = {
    tileCount: 0,
    completeCount: 0,
    levelInfo: {}
};
let sourceDs;
let projectDs;
let projectPath;
let encodePath;
let tileBoundTool;
async function recycle() {
    if (sourceDs) {
        try {
            sourceDs.close();
        } catch (e) {
            console.error(e);
        }
        sourceDs = null;
    }
    if (projectDs) {
        try {
            projectDs.close();
        } catch (e) {
            console.error(e);
        }
        projectDs = null;
    }
    if (projectPath && (0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(projectPath)) {
        await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].rm(projectPath, {
            recursive: true
        });
        projectPath = null;
    }
    if (encodePath && (0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(encodePath)) {
        await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].rm(encodePath, {
            recursive: true
        });
        encodePath = null;
    }
    const ovrPath = `${encodePath}.ovr`;
    if ((0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(ovrPath)) await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].rm(ovrPath, {
        recursive: true
    });
}
async function reproject(ds, epsg, resampling) {
    const projectDatasetPath = __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].join(__WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__["default"].tmpdir(), package_namespaceObject.KR, `${(0, __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__.randomUUID)()}.tif`);
    await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].mkdir(__WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].dirname(projectDatasetPath), {
        recursive: true
    });
    reprojectImage(ds, projectDatasetPath, epsg, resampling);
    return projectDatasetPath;
}
function buildPyramid(ds, minZoom, resampling) {
    const res = ds.geoTransform[1];
    const maxPixel = Math.min(ds.rasterSize.x, ds.rasterSize.y);
    let overviewNum = 1;
    while(maxPixel / 2 ** overviewNum > 256)overviewNum++;
    let res_zoom = (tileBoundTool.xmax - tileBoundTool.xmin) / 256;
    let originZ = 0;
    while(res_zoom / 2 > res){
        res_zoom /= 2;
        originZ++;
    }
    const overviews = [];
    for(let zoom = originZ - 1; zoom >= originZ - 1 - overviewNum; zoom--){
        if (zoom < minZoom) break;
        const factor = 2 ** (originZ - zoom);
        overviews.push(factor);
    }
    const buildOverviewResampling = getBuildOverviewResampling(resampling);
    ds.buildOverviews(buildOverviewResampling, overviews);
    return {
        maxOverViewsZ: originZ - 1,
        minOverViewsZ: originZ - overviews.length
    };
}
async function generateTile(input, output, options) {
    const { minZoom, maxZoom, epsg, encoding, isClean, resampling } = options;
    const tileSize = 256;
    tileBoundTool = tileBoundMap.get(epsg);
    const isSavaMbtiles = '.mbtiles' === __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].extname(output);
    let outputDir = output;
    if (true === isSavaMbtiles) outputDir = __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].join(__WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__["default"].tmpdir(), (0, __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__.randomUUID)());
    let stepIndex = 0;
    if (isClean) {
        if ((0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(output)) await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].rm(output, {
            recursive: true
        });
        await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].mkdir(output, {
            recursive: true
        });
        console.log(`>> 步骤${++stepIndex}: 清空输出文件夹 - 完成`);
    }
    sourceDs = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].open(input, 'r');
    if (sourceDs.srs?.getAuthorityCode() !== epsg) {
        projectPath = await reproject(sourceDs, epsg, resampling);
        projectDs = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].open(projectPath, 'r+');
        sourceDs.close();
        console.log(`>> 步骤${++stepIndex}: 重投影至 EPSG:${epsg} - 完成`);
    } else projectDs = sourceDs;
    sourceDs = null;
    const overViewInfo = buildPyramid(projectDs, minZoom, resampling);
    console.log(`>> 步骤${++stepIndex}: 构建影像金字塔索引 - 完成`);
    const geoTransform = projectDs.geoTransform;
    const dsInfo = {
        width: projectDs.rasterSize.x,
        height: projectDs.rasterSize.y,
        resX: geoTransform[1],
        resY: geoTransform[5],
        startX: geoTransform[0],
        startY: geoTransform[3],
        endX: geoTransform[0] + projectDs.rasterSize.x * geoTransform[1],
        endY: geoTransform[3] + projectDs.rasterSize.y * geoTransform[5],
        path: projectDs.description
    };
    let pileUpCount = 0;
    let miny;
    let maxy;
    if (dsInfo.startY < dsInfo.endY) {
        miny = dsInfo.startY;
        maxy = dsInfo.endY;
    } else {
        miny = dsInfo.endY;
        maxy = dsInfo.startY;
    }
    const startPoint = [
        dsInfo.startX,
        maxy
    ];
    const endPoint = [
        dsInfo.endX,
        miny
    ];
    for(let tz = minZoom; tz <= maxZoom; ++tz){
        const minRC = getTileByCoors(startPoint, tz, tileBoundTool);
        const maxRC = getTileByCoors(endPoint, tz, tileBoundTool);
        statistics.tileCount += (maxRC.row - minRC.row + 1) * (maxRC.column - minRC.column + 1);
        statistics.levelInfo[tz] = {
            tminx: minRC.column,
            tminy: minRC.row,
            tmaxx: maxRC.column,
            tmaxy: maxRC.row
        };
    }
    const buffer = 1;
    let outTileSize = tileSize;
    if ('mapbox' === encoding) outTileSize = tileSize + 2 * buffer;
    const jobs = [];
    for(let tz = minZoom; tz <= maxZoom; tz++){
        const { tminx, tminy, tmaxx, tmaxy } = statistics.levelInfo[tz];
        let overviewInfo;
        if (tz > overViewInfo.maxOverViewsZ) overviewInfo = dsInfo;
        else {
            const startZ = Math.max(tz, overViewInfo.minOverViewsZ);
            const factorZoom = overViewInfo.maxOverViewsZ - startZ;
            const factor = 2 ** (factorZoom + 1);
            overviewInfo = {
                index: factorZoom,
                startX: dsInfo.startX,
                startY: dsInfo.startY,
                width: Math.ceil(+dsInfo.width / factor),
                height: Math.ceil(+dsInfo.height / factor),
                resX: dsInfo.resX * factor,
                resY: dsInfo.resY * factor
            };
        }
        for(let j = tminx; j <= tmaxx; j++){
            await __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__["default"].mkdir(__WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].join(outputDir, tz.toString(), j.toString()), {
                recursive: true
            });
            for(let i = tminy; i <= tmaxy; i++){
                const tileBound = ST_TileEnvelope(tz, j, i, buffer, tileBoundTool);
                const { rb, wb } = geoQuery(overviewInfo, tileBound[0], tileBound[3], tileBound[2], tileBound[1], outTileSize);
                const createInfo = {
                    outTileSize,
                    overviewInfo,
                    rb,
                    wb,
                    encoding,
                    dsPath: dsInfo.path,
                    x: j,
                    y: i,
                    z: tz,
                    outputTile: outputDir
                };
                pileUpCount++;
                console.log(`切片任务: ${tz}/${j}/${i}`);
                jobs.push(pool.run(createInfo));
            }
        }
    }
    console.log(`切片总数数量: ${pileUpCount}`);
    await Promise.all(jobs);
    await pool.destroy();
    await recycle();
    resetStats();
    console.log(`\n>> 步骤${++stepIndex}: 切片 - 完成`);
}
function resetStats() {
    statistics.tileCount = 0;
    statistics.completeCount = 0;
    statistics.levelInfo = {};
}
function geoQuery(overviewInfo, ulx, uly, lrx, lry, querysize = 0) {
    const { startX, startY, width, height, resX, resY } = overviewInfo;
    let rx = Math.floor((ulx - startX) / resX + 0.001);
    let ry = Math.floor((uly - startY) / resY + 0.001);
    let rxsize = Math.max(1, Math.floor((lrx - ulx) / resX + 0.5));
    let rysize = Math.max(1, Math.floor((lry - uly) / resY + 0.5));
    let wxsize, wysize;
    if (querysize) {
        wxsize = querysize;
        wysize = querysize;
    } else {
        wxsize = rxsize;
        wysize = rysize;
    }
    let wx = 0;
    if (rx < 0) {
        const rxshift = Math.abs(rx);
        wx = Math.floor(+rxshift / rxsize * wxsize);
        wxsize -= wx;
        rxsize -= Math.floor(+rxshift / rxsize * rxsize);
        rx = 0;
    }
    if (rx + rxsize > width) {
        wxsize = Math.floor(wxsize * (width - rx) * 1.0 / rxsize);
        rxsize = width - rx;
    }
    let wy = 0;
    if (ry < 0) {
        const ryshift = Math.abs(ry);
        wy = Math.floor(+ryshift / rysize * wysize);
        wysize -= wy;
        rysize -= Math.floor(+ryshift / rysize * rysize);
        ry = 0;
    }
    if (ry + rysize > height) {
        wysize = Math.floor(wysize * (height - ry) * 1.0 / rysize);
        rysize = height - ry;
    }
    return {
        rb: {
            rx,
            ry,
            rxsize,
            rysize
        },
        wb: {
            wx,
            wy,
            wxsize,
            wysize
        }
    };
}
const src_rslib_entry_ = generateTile;
export { src_rslib_entry_ as default, statistics };
