goog.module('plugin.geopackage.TileLayerConfig');

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const ImageTile = goog.require('ol.ImageTile');
const TileState = goog.require('ol.TileState');
const TileImage = goog.require('ol.source.TileImage');
const TileGrid = goog.require('ol.tilegrid.TileGrid');
const AbstractTileLayerConfig = goog.require('os.layer.config.AbstractTileLayerConfig');
const {MsgType, getWorker} = goog.require('plugin.geopackage');
const Tile = goog.require('plugin.geopackage.Tile');


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
class TileLayerConfig extends AbstractTileLayerConfig {
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
    const parts = options['id'].split(os.ui.data.BaseProvider.ID_DELIMITER);

    const source = new TileImage(/** @type {olx.source.TileImageOptions} */ ({
      'projection': this.projection,
      'tileLoadFunction': getTileLoadFunction(parts[0]),
      'tileUrlFunction': getTileUrlFunction(parts[1]),
      'tileGrid': new TileGrid(/** @type {olx.tilegrid.TileGridOptions} */ ({
        'extent': options.extent,
        'minZoom': Math.max(0, Math.round(options['minZoom'])),
        'resolutions': options['resolutions'],
        'tileSizes': options['tileSizes']
      })),
      'wrapX': this.projection.isGlobal()
    }));

    addTileListener();
    return source;
  }
}


/**
 * @param {string} providerId
 * @return {!ol.TileLoadFunctionType}
 */
const getTileLoadFunction = (providerId) => (
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
      const msg = /** @type {GeoPackageWorkerMessage} */ ({
        id: providerId,
        type: MsgType.GET_TILE,
        tableName: layerName,
        tileCoord: imageTile.getTileCoord()
      });

      const key = msg.id + '#' + msg.type + '#' + msg.tableName + '#' + msg.tileCoord.join(',');
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
      msg.message.tileCoord.join(',')
    ].join('#');

    const imageTile = tiles[key];

    if (imageTile) {
      delete tiles[key];

      if (msg.type === MsgType.SUCCESS) {
        if (msg.data) {
          let url = null;

          if (typeof msg.data === 'string') {
            // Web Worker path
            url = msg.data;
          } else if (Array.isArray(msg.data)) {
            // node process path
            const i32arr = Int32Array.from(/** @type {!Array<!number>} */ (msg.data));
            const i8arr = new Uint8Array(i32arr);
            const blob = new Blob([i8arr]);
            url = URL.createObjectURL(blob);
          }

          if (url) {
            imageTile.getImage().src = url;
          }
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
   * @param {ol.proj.Projection} projection The projection
   * @return {string|undefined} Tile URL
   */
  (tileCoord, pixelRatio, projection) => layerName
);

exports = TileLayerConfig;
