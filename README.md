# 🗺️ dem-dynamic-terrain

> 使用GDAL制作地形瓦片，支持mapbox和terrarium两种编码输出格式，当前仅输出PNG图片格式。
> 此项目是[dem2terrain](https://github.com/FreeGIS/dem2terrain)的fork版本

[![npm version](https://img.shields.io/npm/v/@deepgis/dem-dynamic-terrain?color=red)](https://npmjs.com/package/@deepgis/dem-dynamic-terrain)
[![npm downloads](https://img.shields.io/npm/dm/@deepgis/dem-dynamic-terrain?color=yellow)](https://npm.chart.dev/@deepgis/dem-dynamic-terrain)

## 安装

```bash
pnpm add @deepgis/dem-dynamic-terrain -g
```

## 功能特点
- ⛰️ 支持将DEM数据转换为地形瓦片
- 🔄 支持多种重采样策略
- 🌐 支持不同坐标系(EPSG:3857, EPSG:4490, EPSG:4326)
- 🎨 支持两种瓦片编码格式: mapbox和terrarium
- 🔢 支持自定义瓦片等级范围
- 🖼️ 支持地形和DOM两种切片类型

## CLI工具参数

```bash
dem-dynamic-terrain [options]
```

### 必填参数
- 📌 `-i, --input <string>`: 输入tif格式的DEM文件路径，支持相对路径
- 📌 `-o, --output <string>`: 输出目录，支持相对路径
- 📌 `-t, --type <string>`: 切片类型，可选值: `terrain`(地形) 或 `dom`(正射影像)，默认为`terrain`

### 可选参数
- ⚙️ `-f, --configFile <File>`: 通过配置文件执行任务，输入绝对路径，可参考配置模板
- 🔄 `-r, --resampling <number>`: 构建影像金字塔或重投影时设置重采样策略，默认为`3`
  - `1`: AVERAGE (加权平均法)
  - `2`: BILINEAR (双线性内插法)
  - `3`: CUBIC (三次卷积内插法)
  - `4`: CUBICSPLINE (B样条卷积内插法)
  - `5`: LANCZOS (Lanczos窗口sinc卷积内插法)
  - `6`: MODE (最常出现值法)
  - `7`: NEAREST (最邻近法)
- 🌐 `-g, --epsg <number>`: Tile适用坐标系，可选值: `3857`、`4490`、`4326`，默认为`3857`
- 🧹 `-c, --clean`: 是否清空输出目录，默认为`false`
- 🔢 `-z, --zoom <number-number>`: 指定瓦片的等级生成范围，格式为`min-max`，例如`7-12`，默认为`5-14`
- 🎨 `-e, --encoding <string>`: 指定瓦片的数据编码规则，可选值: `mapbox` 或 `terrarium`，默认为`mapbox`
- 📏 `-b, --baseHeight <number>`: 基准高度，默认为`0`
- ℹ️ `-v, --version`: 显示当前版本
- ❓ `-h, --help`: 显示帮助信息

## 使用示例

### 基本使用
```bash
dem-dynamic-terrain -i ./dem.tif -o ./terrain
```

### 指定切片类型和编码格式
```bash
dem-dynamic-terrain -i ./dem.tif -o ./terrain -t terrain -e terrarium
```

### 指定瓦片等级范围和坐标系
```bash
dem-dynamic-terrain -i ./dem.tif -o ./terrain -z 8-16 -g 4326
```

### 使用配置文件
```bash
dem-dynamic-terrain -f ./config.json
```

### 清空输出目录并使用特定重采样策略
```bash
dem-dynamic-terrain -i ./dem.tif -o ./terrain -c -r 2
```

## 配置文件示例
```json
{
  "input": "./dem.tif",
  "output": "./terrain",
  "type": "terrain",
  "resampling": 3,
  "epsg": 3857,
  "clean": true,
  "zoom": "7-14",
  "encoding": "mapbox",
  "baseHeight": 0
}
```

## 注意事项
⚠️ 1. 暂不支持输出到mbtiles文件
⚠️ 2. 确保输入的DEM文件格式正确且可被GDAL识别
⚠️ 3. 对于大型DEM文件，切片过程可能需要较长时间，请耐心等待
⚠️ 4. 建议使用绝对路径以避免路径问题
