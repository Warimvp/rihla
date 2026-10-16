import { geoMercator, geoPath, geoGraticule } from 'd3-geo'
import { feature } from 'topojson-client'
import terre50 from 'world-atlas/land-50m.json'
import terre110 from 'world-atlas/land-110m.json'

export const TERRE_50 = feature(terre50, terre50.objects.land)
export const TERRE_110 = feature(terre110, terre110.objects.land)

// Les destinations de la rihla : [longitude, latitude], dans l'ordre de la route (km croissants).
export const LIEUX = {
  tanger: [-5.81, 35.77],
  grenade: [-3.6, 37.18],
  lisbonne: [-9.14, 38.72],
  paris: [2.35, 48.86],
  venise: [12.33, 45.44],
  vienne: [16.37, 48.21],
  londres: [-0.13, 51.51],
  istanbul: [28.98, 41.01],
  caire: [31.24, 30.04],
  sarai: [46.0, 48.7],
  ispahan: [51.67, 32.65],
  mombasa: [39.67, -4.04],
  delhi: [77.21, 28.61],
  pekin: [116.4, 39.9],
  seoul: [126.98, 37.57],
  tokyo: [139.69, 35.69],
  oran: [-0.63, 35.7],
  alger: [3.06, 36.75],
  tunis: [10.18, 36.81],
  tripoli: [13.19, 32.89],
  alexandrie: [29.92, 31.2],
}

// Projection Mercator : `px` pixels par degré de longitude, `origine` = [lon, lat] posé en (x0, y0).
export const projeter = ({ px, origine, x0, y0, clip = [[-600, -600], [2200, 3000]] }) => {
  const R = (px * 180) / Math.PI
  const p = geoMercator().scale(R).translate([0, 0]).precision(0.3)
  const [ox, oy] = p(origine)
  p.translate([x0 - ox, y0 - oy]).clipExtent(clip)
  return p
}

export const cheminTerre = (projection, terre) => geoPath(projection)(terre)
export const cheminGrille = (projection, pas = 10) => geoPath(projection)(geoGraticule().step([pas, pas])())
