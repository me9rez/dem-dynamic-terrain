/**
 * MapboxGL 编码
 */
function mapboxEncode(height: number): [number, number, number] {
    const value = Math.floor((height + 10000) * 10);
    const r = value >> 16;
    const g = value >> 8 & 0x0000FF;
    const b = value & 0x0000FF;
    return [r, g, b];
}

/**
 * MapboxGL 解码
 * @param color 
 * @returns 高程值
 */
function mapboxDecode(color: [number, number, number]) {
    return -10000 + ((color[0] * 256 * 256 + color[1] * 256 + color[2]) * 0.1);
}

/**
 * Terrarium 编码
 * @param height 高程值
 * @returns
 */
function terrariumEncode(height: number): [number, number, number] {
    height += 32768;
    const r = Math.floor(height / 256.0);
    const g = Math.floor(height % 256);
    const b = Math.floor((height - Math.floor(height)) * 256.0);
    return [r, g, b];
}

/**
 * Terrarium 解码
 * @param color 
 * @returns 高程值
 */
function terrariumDecode(color: [number, number, number]) {
    return (color[0] * 256 + color[1] + color[2] / 256.0) - 32768;
}

/**
 * Cesium 编码
 * @param height 高程值
 * @returns 编码值，Int16
 */
function cesiumEncode(height: number) {
    return Math.floor((height + 1000) / 0.2);
}

/**
* Cesium 解码
* @param pixel 编码值，Int16
* @returns 高程值
*/
function cesiumDecode(pixel: number) {
    return (pixel * 0.2) - 1000;
}

const mapboxDem = {
    encode: mapboxEncode,
    tileSchema: 'xyz',
    tileSize: 512,
    extension: 'png'
}
const terrariumDem = {
    encode: terrariumEncode,
    tileSchema: 'xyz',
    tileSize: 512,
    extension: 'png'
}
const cesiumDem = {
    encode: cesiumEncode,
    tileSchema: 'tms',
    tileSize: 65,
    extension: 'terrain'
}

export {
    //mapboxDem, terrariumDem, cesiumDem
    mapboxEncode, terrariumEncode
}