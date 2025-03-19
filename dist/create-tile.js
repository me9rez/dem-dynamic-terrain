import * as __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__ from "node:path";
import * as __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__ from "gdal-async";
function mapboxEncode(height) {
    const value = Math.floor((height + 10000) * 10);
    const r = value >> 16;
    const g = value >> 8 & 0x0000FF;
    const b = 0x0000FF & value;
    return [
        r,
        g,
        b
    ];
}
function terrariumEncode(height) {
    height += 32768;
    const r = Math.floor(height / 256.0);
    const g = Math.floor(height % 256);
    const b = Math.floor((height - Math.floor(height)) * 256.0);
    return [
        r,
        g,
        b
    ];
}
function getDriverByName(driverName) {
    const length = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].drivers.count();
    const nameNormal = driverName.toUpperCase();
    for(let i = 0; i < length; i++){
        const driver = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].drivers.get(i);
        if (driver.description === nameNormal) return driver;
    }
    throw new Error(`当前gdal中不存在输入的驱动名称${nameNormal}`);
}
let dataset;
let noData;
let memDriver;
let pngDriver;
let outTileSize1;
const invalidColor = [
    1,
    134,
    160
];
function forEachHeightBuffer(heightBuffer, encode) {
    const channelLength = heightBuffer.length;
    const rBuffer = new Uint8Array(channelLength);
    const gBuffer = new Uint8Array(channelLength);
    const bBuffer = new Uint8Array(channelLength);
    const aBuffer = new Uint8Array(channelLength);
    for(let i = 0; i < channelLength; i++){
        const heightVal = heightBuffer[i];
        let color;
        color = heightVal === noData ? invalidColor : encode(heightVal);
        rBuffer[i] = color[0];
        gBuffer[i] = color[1];
        bBuffer[i] = color[2];
        aBuffer[i] = 255;
    }
    return [
        rBuffer,
        gBuffer,
        bBuffer,
        aBuffer
    ];
}
function writeTerrainTile(overviewInfo, readinfo, writeinfo, encoding) {
    let readband;
    readband = void 0 === overviewInfo.index ? readinfo.ds.bands.get(1) : readinfo.ds.bands.get(1).overviews.get(overviewInfo.index);
    const dataType = readband.dataType;
    let heightBuffer;
    if (dataType === __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GDT_Int16) heightBuffer = new Int16Array(writeinfo.wxsize * writeinfo.wysize);
    else if (dataType === __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].GDT_Float32) heightBuffer = new Float32Array(writeinfo.wxsize * writeinfo.wysize);
    readband.pixels.read(readinfo.rx, readinfo.ry, readinfo.rxsize, readinfo.rysize, heightBuffer, {
        buffer_width: writeinfo.wxsize,
        buffer_height: writeinfo.wysize,
        data_type: dataType
    });
    let encodeBuffers;
    if ('mapbox' === encoding) encodeBuffers = forEachHeightBuffer(heightBuffer, mapboxEncode);
    else if ('terrarium' === encoding) encodeBuffers = forEachHeightBuffer(heightBuffer, terrariumEncode);
    const _length = outTileSize1 * outTileSize1;
    const r = new Uint8Array(_length);
    const g = new Uint8Array(_length);
    const b = new Uint8Array(_length);
    const a = new Uint8Array(_length);
    for(let i = 0; i < _length; i++){
        r[i] = invalidColor[0];
        g[i] = invalidColor[1];
        b[i] = invalidColor[2];
        a[i] = 255;
    }
    const defaultBuffers = [
        r,
        g,
        b,
        a
    ];
    [
        1,
        2,
        3,
        4
    ].forEach((index)=>{
        const writeband = writeinfo.ds.bands.get(index);
        writeband.pixels.write(0, 0, outTileSize1, outTileSize1, defaultBuffers[index - 1]);
        writeband.pixels.write(writeinfo.wx, writeinfo.wy, writeinfo.wxsize, writeinfo.wysize, encodeBuffers[index - 1]);
    });
}
function createTile(createInfo) {
    const { outTileSize, overviewInfo, rb, wb, encoding, dsPath, x, y, z, outputTile } = createInfo;
    outTileSize1 = outTileSize;
    if (!dataset) {
        dataset = __WEBPACK_EXTERNAL_MODULE_gdal_async_691d88a0__["default"].open(dsPath, 'r');
        noData = dataset.bands.get(1).noDataValue;
    }
    if (!memDriver) memDriver = getDriverByName('mem');
    const msmDS = memDriver.create('', outTileSize, outTileSize, 4);
    rb.ds = dataset;
    wb.ds = msmDS;
    writeTerrainTile(overviewInfo, rb, wb, encoding);
    const pngPath = __WEBPACK_EXTERNAL_MODULE_node_path_c5b9b54f__["default"].join(outputTile, z.toString(), x.toString(), `${y}.png`);
    if (!pngDriver) pngDriver = getDriverByName('png');
    const pngDs = pngDriver.createCopy(pngPath, msmDS);
    msmDS.flush();
    msmDS.close();
    pngDs.close();
}
const create_tile_rslib_entry_ = createTile;
export { create_tile_rslib_entry_ as default };
