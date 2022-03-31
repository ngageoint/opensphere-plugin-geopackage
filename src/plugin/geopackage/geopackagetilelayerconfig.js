goog.declareModuleId('plugin.geopackage.TileLayerConfig');

import ImageTile from 'ol/src/ImageTile.js';
import {transformExtent} from 'ol/src/proj.js';
import TileImage from 'ol/src/source/TileImage.js';
import {createForProjection} from 'ol/src/tilegrid.js';
import {DEFAULT_MAX_ZOOM} from 'ol/src/tilegrid/common.js';
import TileGrid from 'ol/src/tilegrid/TileGrid.js';
import TileState from 'ol/src/TileState.js';

import AbstractTileLayerConfig from 'opensphere/src/os/layer/config/abstracttilelayerconfig.js';
import {PROJECTION} from 'opensphere/src/os/map/map.js';
import {EPSG4326} from 'opensphere/src/os/proj/proj.js';
import BaseProvider from 'opensphere/src/os/ui/data/baseprovider.js';
import {MsgType, getWorker} from './geopackage.js';
import {Tile} from './geopackagetile.js';

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');


/**
 * The logger.
 * @type {log.Logger}
 */
const LOGGER = log.getLogger('plugin.geopackage.TileLayerConfig');


/**
 * @type {boolean}
 */
let tileListenerSet = false;


/**
 * @type {!Object<string, !ImageTile>}
 */
const tiles = {};


/**
 * Creates a tile layer from a GeoPackage.
 */
export class TileLayerConfig extends AbstractTileLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.tileClass = Tile;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    // If a zoomOffset isn't already defined, set it to 0 to avoid auto detection. Geopackages should not need to set
    // this to anything other than 0.
    if (options['zoomOffset'] == null) {
      options['zoomOffset'] = 0;
    }

    super.initializeConfig(options);
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    const parts = options['id'].split(BaseProvider.ID_DELIMITER);

    const resolutions = /** @type {Array<number>|undefined} */ (options['resolutions']);

    const gpkgTileGrid = new TileGrid(/** @type {olx.tilegrid.TileGridOptions} */ ({
      'extent': options.extent,
      'minZoom': Math.max(0, Math.round(options['gpkgMinZoom'])),
      'resolutions': resolutions,
      'tileSizes': options['tileSizes']
    }));

    const layerTileGrid = createForProjection(PROJECTION, DEFAULT_MAX_ZOOM, [256, 256]);

    const source = new TileImage(/** @type {olx.source.TileImageOptions} */ ({
      'projection': this.projection,
      'tileLoadFunction': getTileLoadFunction(parts[0], gpkgTileGrid, layerTileGrid),
      'tileUrlFunction': getTileUrlFunction(parts[1]),
      'tileGrid': layerTileGrid,
      'wrapX': true
    }));

    source.setExtent(options.extent);
    addTileListener();
    return source;
  }
}


/**
 * @param {string} providerId
 * @param {ol.tilegrid.TileGrid} gpkgTileGrid
 * @param {ol.tilegrid.TileGrid} tileGrid
 * @return {!ol.TileLoadFunctionType}
 */
const getTileLoadFunction = (providerId, gpkgTileGrid, tileGrid) => (
  /**
   * @param {ol.Tile} tile The image tile
   * @param {string} layerName The layer name
   */
  (tile, layerName) => {
    const imageTile = /** @type {ImageTile} */ (tile);
    const prevSrc = imageTile.getImage().src;
    if (prevSrc) {
      // recycle it
      URL.revokeObjectURL(prevSrc);
    }

    if (layerName) {
      const tileCoord = imageTile.getTileCoord();
      let extent = tileGrid.getTileCoordExtent(tileCoord);
      extent = transformExtent(extent, PROJECTION, EPSG4326);
      const layerResolution = tileGrid.getResolution(tileCoord[0]);
      const gpkgZoom = gpkgTileGrid.getZForResolution(layerResolution);
      const size = tileGrid.getTileSize(tileCoord[0]);

      const msg = /** @type {GeoPackageWorkerMessage} */ ({
        id: providerId,
        type: MsgType.GET_TILE,
        tableName: layerName,
        projection: PROJECTION.getCode(),
        extent: extent,
        zoom: gpkgZoom,
        width: size[0],
        height: size[1]
      });

      const key = msg.id + '#' + msg.type + '#' + msg.tableName + '#' + msg.extent.join(',');
      tiles[key] = imageTile;
      getWorker().postMessage(msg);
    }
  }
);


/**
 */
const addTileListener = () => {
  if (!tileListenerSet) {
    getWorker().addEventListener(GoogEventType.MESSAGE, tileListener);
    tileListenerSet = true;
  }
};


/**
 * @param {Event|GeoPackageWorkerResponse} evt
 * @suppress {accessControls}
 */
const tileListener = (evt) => {
  const msg = /** @type {GeoPackageWorkerResponse} */ (evt instanceof Event ? evt.data : evt);

  if (msg.message.type === MsgType.GET_TILE) {
    const key = [
      msg.message.id,
      msg.message.type,
      msg.message.tableName,
      (msg.message.tileCoord || msg.message.extent).join(',')
    ].join('#');

    const imageTile = tiles[key];

    if (imageTile) {
      delete tiles[key];

      if (msg.type === MsgType.SUCCESS) {
        // A data URL should be returned. If not, assume the tile is not available.
        if (msg.data && typeof msg.data === 'string') {
          imageTile.getImage().src = msg.data;
        } else {
          // Tile is emtpy, so display a blank image. Note that TileState.EMPTY is NOT WHAT WE WANT.
          // Empty causes OpenLayers to keep displaying the parent tile for coverage. We want a blank
          // tile.
          imageTile.image_ = ImageTile.getBlankImage();
          imageTile.state = TileState.LOADED;
          imageTile.changed();
        }
      } else {
        imageTile.handleImageError_();
        log.error(LOGGER, 'Error querying tile from GeoPackage:' + msg.reason);
      }
    }
  }
};


/**
 * @param {string} layerName The table name for the layer
 * @return {ol.TileUrlFunctionType}
 * @private
 */
const getTileUrlFunction = (layerName) => (
  /**
   * @param {ol.TileCoord} tileCoord The tile coordinate
   * @param {number} pixelRatio The tile pixel ratio
   * @param {Projection} projection The projection
   * @return {string|undefined} Tile URL
   */
  (tileCoord, pixelRatio, projection) => layerName
);
