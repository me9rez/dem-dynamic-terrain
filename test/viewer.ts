import TileLayer from 'ol/layer/Tile'
import Map from 'ol/Map'
import { useGeographic } from 'ol/proj'
import ImageTile from 'ol/source/ImageTile'
import View from 'ol/View'

import 'ol/ol.css'

useGeographic()

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new ImageTile({
        url: './terrain/{z}/{x}/{y}.png',
        // url: './dom/{z}/{x}/{y}.png',
      }),
    }),
  ],
  view: new View({
    center: [115.9140014648437500, 40.2099609375000000],
    // center: [-11584184.5107000004500151,5635549.2214099988341331],
    // center: [108.1206497787500069, 34.3597102474359986],
    zoom: 14,
  }),
})
