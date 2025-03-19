import * as __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__ from "node:fs";
import * as __WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__ from "node:os";
import * as __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__ from "gdal-async";
import * as __WEBPACK_EXTERNAL_MODULE_tinypool__ from "tinypool";
import * as __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__ from "node:crypto";
import * as __WEBPACK_EXTERNAL_MODULE_commander__ from "commander";
import * as __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__ from "node:fs/promises";
import * as __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__ from "node:path";
import * as __WEBPACK_EXTERNAL_MODULE_node_process_786449bf__ from "node:process";
var __webpack_modules__ = {
    "./src/cli.ts?__rslib_entry__": function(module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.a(module, async function(__webpack_handle_async_dependencies__, __webpack_async_result__) {
            try {
                __webpack_require__.r(__webpack_exports__);
                var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:fs/promises");
                var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:path");
                var node_process__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("node:process");
                var commander__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("commander");
                var _package_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./package.json");
                var _index__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("./src/index.ts");
                const version = _package_json__WEBPACK_IMPORTED_MODULE_4__.i8;
                commander__WEBPACK_IMPORTED_MODULE_3__.program.name(_package_json__WEBPACK_IMPORTED_MODULE_4__.u2).description('使用 GDAL 制作地形瓦片，支持 mapbox 和 terrarium 两种编码输出格式，当前仅输出 PNG 图片格式。').version(version, '-v, --version', '当前版本').helpOption('-h, --help', '帮助');
                commander__WEBPACK_IMPORTED_MODULE_3__.program.option('-i, --input <string>', '<必填> 输入 tif 格式的 DEM 文件路径，支持相对路径').option('-o, --output <string>', '<必填> 输出目录，支持相对路径').option('-f, --configFile <File>', '<可选> 通过配置文件执行任务，输入绝对路径，可参考配置模板').option('-r, --resampling <number>', `<可选> 构建影像金字塔或重投影时设置重采样策略，默认3，1:AVERAGE|
  2:BILINEAR|3:CUBIC|
  4:CUBICSPLINE|5:LANCZOS|
  6:MODE|7:NEAREST`, '3').option('-g, --epsg <number>', '<可选> Tile适用坐标系，3857 | 4490 | 4326', '3857').option('-c, --clean', '<可选> 是否清空输出目录', false).option('-z, --zoom <number-number>', '<可选> 指定瓦片的等级生成范围。例如，想生成 7 ~ 12 级的瓦片，则输入 -z 7-12', '5-14').option('-e, --encoding <string>', '<可选> 指定瓦片的数据编码规则（mapbox 或 terrarium）', 'mapbox').option('-b, --baseHeight <number>', '<可选> 基准高度，默认0', '0');
                commander__WEBPACK_IMPORTED_MODULE_3__.program.parse();
                const options = commander__WEBPACK_IMPORTED_MODULE_3__.program.opts();
                let params;
                params = options.configFile ? JSON.parse(await node_fs_promises__WEBPACK_IMPORTED_MODULE_0__["default"].readFile(options.configFile, 'utf-8')) : options;
                const inputDem = params.input;
                const outputDir = params.output;
                if (void 0 === inputDem || void 0 === outputDir) {
                    console.log('参数缺失: 输入文件路径或输出目录必填');
                    node_process__WEBPACK_IMPORTED_MODULE_2__["default"].exit();
                }
                const encoding = params.encoding;
                const epsg = Number(params.epsg);
                const isClean = params.clean;
                let baseHeight = Number(params.baseHeight);
                if (Number.isNaN(baseHeight)) baseHeight = 0;
                let zoom = params.zoom;
                zoom = zoom.split('-');
                const minZoom = Number(zoom[0]);
                const maxZoom = Number(zoom[1]);
                if (Number.isNaN(minZoom) || Number.isNaN(maxZoom)) {
                    console.log(`参数 -zoom: ${zoom} 错误，应为整数`);
                    node_process__WEBPACK_IMPORTED_MODULE_2__["default"].exit();
                }
                if (minZoom >= maxZoom) {
                    console.log(`参数 -zoom: ${zoom} 错误：最小级别: ${minZoom} 应小于最大级别: ${maxZoom}`);
                    node_process__WEBPACK_IMPORTED_MODULE_2__["default"].exit();
                }
                const inputAbsolutePath = node_path__WEBPACK_IMPORTED_MODULE_1__["default"].isAbsolute(inputDem) ? inputDem : node_path__WEBPACK_IMPORTED_MODULE_1__["default"].resolve(node_process__WEBPACK_IMPORTED_MODULE_2__["default"].cwd(), inputDem);
                const outFileAbsolutePath = node_path__WEBPACK_IMPORTED_MODULE_1__["default"].isAbsolute(outputDir) ? outputDir : node_path__WEBPACK_IMPORTED_MODULE_1__["default"].resolve(node_process__WEBPACK_IMPORTED_MODULE_2__["default"].cwd(), outputDir);
                const logMsg = `\n>> 开始转换...
- 输入文件: ${inputAbsolutePath}
- 输出路径: ${outFileAbsolutePath}
- Tile适用坐标系: EPSG:${epsg}
- 瓦片编码: ${'mapbox' === encoding ? 'mapbox(raster-dem)' : encoding}
- 瓦片尺寸: 256 px
- 瓦片等级: ${minZoom} 至 ${maxZoom} 级
- 基准高度: ${baseHeight}
`;
                console.log(logMsg);
                const args = {
                    minZoom,
                    maxZoom,
                    epsg,
                    encoding,
                    isClean,
                    baseHeight,
                    resampling: params.resampling
                };
                await (0, _index__WEBPACK_IMPORTED_MODULE_5__.Z)(inputDem, outputDir, args);
                __webpack_async_result__();
            } catch (e) {
                __webpack_async_result__(e);
            }
        }, 1);
    },
    "./src/index.ts": function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            Z: ()=>src
        });
        var promises_ = __webpack_require__("node:fs/promises");
        var external_node_path_ = __webpack_require__("node:path");
        var package_0 = __webpack_require__("./package.json");
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
                await promises_["default"].rm(projectPath, {
                    recursive: true
                });
                projectPath = null;
            }
            if (encodePath && (0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(encodePath)) {
                await promises_["default"].rm(encodePath, {
                    recursive: true
                });
                encodePath = null;
            }
            const ovrPath = `${encodePath}.ovr`;
            if ((0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(ovrPath)) await promises_["default"].rm(ovrPath, {
                recursive: true
            });
        }
        async function reproject(ds, epsg, resampling) {
            const projectDatasetPath = external_node_path_["default"].join(__WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__["default"].tmpdir(), package_0.KR, `${(0, __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__.randomUUID)()}.tif`);
            await promises_["default"].mkdir(external_node_path_["default"].dirname(projectDatasetPath), {
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
            const isSavaMbtiles = '.mbtiles' === external_node_path_["default"].extname(output);
            let outputDir = output;
            if (true === isSavaMbtiles) outputDir = external_node_path_["default"].join(__WEBPACK_EXTERNAL_MODULE_node_os_74b4b876__["default"].tmpdir(), (0, __WEBPACK_EXTERNAL_MODULE_node_crypto_9ba42079__.randomUUID)());
            let stepIndex = 0;
            if (isClean) {
                if ((0, __WEBPACK_EXTERNAL_MODULE_node_fs_5ea92f0c__.existsSync)(output)) await promises_["default"].rm(output, {
                    recursive: true
                });
                await promises_["default"].mkdir(output, {
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
                    await promises_["default"].mkdir(external_node_path_["default"].join(outputDir, tz.toString(), j.toString()), {
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
        const src = generateTile;
    },
    commander: function(module) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_commander__;
    },
    "node:fs/promises": function(module) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_node_fs_promises_153e37e0__;
    },
    "node:path": function(module) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__;
    },
    "node:process": function(module) {
        module.exports = __WEBPACK_EXTERNAL_MODULE_node_process_786449bf__;
    },
    "./package.json": function(module) {
        module.exports = JSON.parse('{"u2":"@deepgis/dem-dynamic-terrain","i8":"0.0.1","KR":"dem-dynamic-terrain"}');
    }
};
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
    return module.exports;
}
(()=>{
    var webpackQueues = "function" == typeof Symbol ? Symbol("webpack queues") : "__webpack_queues__";
    var webpackExports = "function" == typeof Symbol ? Symbol("webpack exports") : "__webpack_exports__";
    var webpackError = "function" == typeof Symbol ? Symbol("webpack error") : "__webpack_error__";
    var resolveQueue = (queue)=>{
        if (queue && queue.d < 1) {
            queue.d = 1;
            queue.forEach((fn)=>fn.r--);
            queue.forEach((fn)=>fn.r-- ? fn.r++ : fn());
        }
    };
    var wrapDeps = (deps)=>deps.map((dep)=>{
            if (null !== dep && "object" == typeof dep) {
                if (dep[webpackQueues]) return dep;
                if (dep.then) {
                    var queue = [];
                    queue.d = 0;
                    dep.then((r)=>{
                        obj[webpackExports] = r;
                        resolveQueue(queue);
                    }, (e)=>{
                        obj[webpackError] = e;
                        resolveQueue(queue);
                    });
                    var obj = {};
                    obj[webpackQueues] = (fn)=>fn(queue);
                    return obj;
                }
            }
            var ret = {};
            ret[webpackQueues] = function() {};
            ret[webpackExports] = dep;
            return ret;
        });
    __webpack_require__.a = (module, body, hasAwait)=>{
        var queue;
        hasAwait && ((queue = []).d = -1);
        var depQueues = new Set();
        var exports = module.exports;
        var currentDeps;
        var outerResolve;
        var reject;
        var promise = new Promise((resolve, rej)=>{
            reject = rej;
            outerResolve = resolve;
        });
        promise[webpackExports] = exports;
        promise[webpackQueues] = (fn)=>{
            queue && fn(queue), depQueues.forEach(fn), promise["catch"](function() {});
        };
        module.exports = promise;
        body((deps)=>{
            currentDeps = wrapDeps(deps);
            var fn;
            var getResult = ()=>currentDeps.map((d)=>{
                    if (d[webpackError]) throw d[webpackError];
                    return d[webpackExports];
                });
            var promise = new Promise((resolve)=>{
                fn = ()=>resolve(getResult);
                fn.r = 0;
                var fnQueue = (q)=>q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn)));
                currentDeps.map((dep)=>dep[webpackQueues](fnQueue));
            });
            return fn.r ? promise : getResult();
        }, (err)=>(err ? reject(promise[webpackError] = err) : outerResolve(exports), resolveQueue(queue)));
        queue && queue.d < 0 && (queue.d = 0);
    };
})();
(()=>{
    __webpack_require__.d = (exports, definition)=>{
        for(var key in definition)if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) Object.defineProperty(exports, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __webpack_require__.r = (exports)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports, '__esModule', {
            value: true
        });
    };
})();
__webpack_require__("./src/cli.ts?__rslib_entry__");
