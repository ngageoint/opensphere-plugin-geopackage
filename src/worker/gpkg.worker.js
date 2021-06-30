/**
 * Worker to provide GPKG access to avoid blocking the main thread during database interactions
 */
'use strict';

var GeoPackage;


/**
 * This corresponds to plugin.geopackage.MsgType
 * @enum {string}
 */
var MsgType = {
  SUCCESS: 'success',
  ERROR: 'error'
};


/**
 * @type {boolean}
 */
var isNode = false;

/**
 * placeholder for library
 */
var GeoPackage = null;


/**
 * @return {boolean} Whether or not the OS is Windows
 */
var isWin = function() {
  return isNode ? process.platform === 'win32' :
    /Windows/.test(self.navigator.userAgent);
};


/**
 * @param {Error|string} reason
 * @param {GeoPackageWorkerMessage} originalMsg
 */
var handleError = function(reason, originalMsg) {
  if (reason instanceof Error) {
    reason = reason.toString();
  }

  // don't send anything potentially large back in the error message
  delete originalMsg.data;

  postMessage({type: MsgType.ERROR, reason: reason, message: originalMsg});
};


/**
 * @param {GeoPackageWorkerMessage} originalMsg
 * @param {*=} opt_data
 */
var success = function(originalMsg, opt_data) {
  var msg = {
    message: originalMsg,
    type: MsgType.SUCCESS
  };

  var transferables;

  if (opt_data != null) {
    msg.data = opt_data;

    if (!isNode) {
      if (msg.data instanceof ArrayBuffer) {
        transferables = [msg.data];
      } else if (ArrayBuffer.isView(msg.data)) {
        msg.data = msg.data.buffer;
        transferables = [msg.data];
      }
    }
  }

  postMessage(msg, transferables);
};


/**
 * Map of Geopackages to their IDs.
 * @type {Object<string, Geopackage>}
 */
var gpkgById = {};


/**
 * Map of tableNames to TileScaling objects.
 * @type {Object<string, Geopackage>}
 */
var tileScalingByTableName = {};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var openGpkg = function(msg) {
  if (!msg.url && !msg.data) {
    handleError('url or data property must exist', msg);
    return;
  }

  if (!msg.id) {
    handleError('id property must exist', msg);
    return;
  }

  if (msg.data) {
    var data = msg.data;
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }

    if (!(data instanceof Uint8Array)) {
      handleError('data must be ArrayBuffer or Uint8Array', msg);
      return;
    }
  } else if (msg.url) {
    if (msg.url.startsWith('file://')) {
      data = decodeURIComponent(msg.url.substring(isWin() ? 8 : 7));
    }
  }

  if (!data) {
    handleError('data or url property must exist', msg);
    return;
  }

  GeoPackage.GeoPackageAPI.open(data)
      .then(function(gpkg) {
        gpkgById[msg.id] = gpkg;
        success(msg);
      })
      .catch(function(err) {
        handleError(err, msg);
      });
};


/**
 * @param {GeoPackageWorkerMessage} msg
 * @return {Geopackage|undefined}
 */
var getGpkg = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var id = msg.id;
  if (!(id in gpkgById)) {
    handleError('No open GeoPackage exists for the given ID', msg);
    return;
  }

  return gpkgById[id];
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var closeGpkg = function(msg) {
  // we get it this way so it does not error if it does not exist
  var gpkg = gpkgById[msg.id];

  if (gpkg) {
    gpkg.close();
    delete gpkgById[msg.id];
  }
};


/**
 * @param {Object} info
 * @return {function(?GeoPackage.TileMatrix):?number}
 */
var getTileMatrixToResolutionMapper = function(info) {
  return (
    /**
     * @param {?GeoPackage.TileMatrix} tileMatrix
     * @return {?number} resolution
     */
    function(tileMatrix) {
      if (tileMatrix) {
        if (tileMatrix.pixel_x_size) {
          return tileMatrix.pixel_x_size;
        } else {
          // compute the pixel_x_size from other values
          return (info.tileMatrixSet.maxX - info.tileMatrixSet.minX) /
              (tileMatrix.matrix_width * tileMatrix.tile_width);
        }
      }

      return null;
    });
};


/**
 * @param {?GeoPackage.TileMatrix} tileMatrix
 * @return {?(number|ol.Size)} The tile size
 */
var tileMatrixToTileSize = function(tileMatrix) {
  if (!tileMatrix) {
    return null;
  }

  var h = tileMatrix.tile_height;
  var w = tileMatrix.tile_width;
  return w === h ? w : [w, h];
};


/**
 * OpenLayers does not permit resolution arrays with null/undefined values.
 * We'll invent some numbers. The minZoom will save the invented numbers from
 * actually being accessed in any real sense.
 * @param {Array<?number>} resolutions
 * @return {Array<!number>} resolutions
 */
var fixResolutions = function(resolutions) {
  var first = -1;
  var second = -1;

  for (var i = 0, n = resolutions.length; i < n; i++) {
    if (resolutions[i] != null) {
      first = resolutions[i];
      break;
    }
  }

  if (resolutions.length - i > 1) {
    second = resolutions[i + 1];
  }

  if (first > -1) {
    var zoomFactor = second > -1 ? first / second : 2;

    while (i--) {
      resolutions[i] = resolutions[i + 1] * zoomFactor;
    }
  }

  return resolutions;
};


/**
 * Cesium must have a full tile pyramid (ugh), and so we let it have one and then
 * feed it blank tiles. Due to the full pyramid, we can't have empty sizes on the
 * front of the tile array. Since these are just gonna result in blanks, just use
 * the same as the first defined value.
 * @param {Array<?(number|ol.Size)>} sizes
 * @return {Array<!(number|ol.Size)>} sizes
 */
var fixSizes = function(sizes) {
  var first;
  for (var i = 0, n = sizes.length; i < n; i++) {
    if (sizes[i]) {
      first = sizes[i];
      break;
    }
  }

  while (i--) {
    sizes[i] = first;
  }

  return sizes;
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var listDescriptors = function(msg) {
  var gpkg = getGpkg(msg);

  if (gpkg) {
    try {
      var tileTables = gpkg.getTileTables();
      var tileScaling;

      var tilePromises = tileTables.map(async function(tableName) {
        var tileDao = gpkg.getTileDao(tableName);
        var info = gpkg.getInfoForTable(tileDao);

        if (info) {
          var tileMatrices = tileDao.zoomLevelToTileMatrix;
          var config = {
            type: 'geopackage-tile',
            title: info.tableName,
            tableName: info.tableName,
            gpkgMinZoom: Math.round(info.minZoom),
            gpkgMaxZoom: Math.round(info.maxZoom),
            resolutions: fixResolutions(tileMatrices.map(getTileMatrixToResolutionMapper(info))),
            tileSizes: fixSizes(tileMatrices.map(tileMatrixToTileSize))
          };

          // Create and store a TileScaling for each tile layer that allows requesting tiles at +4 to -25 zoom levels.
          // This allows tile to show at all zoom levels above where the file defines, but only up to +4 zoom levels
          // higher. Tiles tend to become too blurred once upscaled much more than that.
          tileScaling = new GeoPackage.TileScaling();
          /* eslint-disable google-camelcase/google-camelcase */
          tileScaling.scaling_type = GeoPackage.TileScalingType.IN_OUT;
          tileScaling.zoom_in = 25;
          tileScaling.zoom_out = 4;
          /* eslint-enable google-camelcase/google-camelcase */

          const tileScalingExtension = gpkg.getTileScalingExtension(tableName);
          await tileScalingExtension.getOrCreateExtension();
          tileScalingExtension.createOrUpdate(tileScaling);
          tileScalingByTableName[tableName] = tileScaling;

          if (info.contents) {
            config.title = info.contents.identifier || config.title;
            config.description = info.contents.description || config.description;
          }

          if (info.srs) {
            config.projection = info.srs.organization.toUpperCase() + ':' +
                (info.srs.organization_coordsys_id || info.srs.id);
          }

          if (info.tileMatrixSet) {
            config.extent = [
              info.tileMatrixSet.minX,
              info.tileMatrixSet.minY,
              info.tileMatrixSet.maxX,
              info.tileMatrixSet.maxY];

            config.extentProjection = config.projection || 'EPSG:' + info.tileMatrixSet.srsId;
          }

          return config;
        }
      });

      var featureConfigs = gpkg.getFeatureTables().map(function(tableName) {
        var featureDao = gpkg.getFeatureDao(tableName);
        var info = gpkg.getInfoForTable(featureDao);

        if (info) {
          var cols = info.columns.map(function(col) {
            var dataType = GeoPackage.GeoPackageDataType[col.dataType] || '';
            return /** @type {os.ogc.FeatureTypeColumn} */ ({
              type: dataType.toLowerCase(),
              name: col.name
            });
          });

          var config = {
            type: 'geopackage-vector',
            title: info.tableName,
            tableName: info.tableName,
            dbColumns: cols
          };

          if (info.contents) {
            config.title = info.contents.identifier || config.title;
            config.description = info.contents.description || config.description;
          }

          return config;
        }
      });

      // once all the tile layer promises resolve, then call the success callback with the full set of configs
      Promise.all(tilePromises).then((tileConfigs) => {
        success(msg, tileConfigs.concat(featureConfigs));
      }, (error) => {
        handleError(error, msg);
      });
    } catch (e) {
      handleError(e, msg);
      return;
    }
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var getTile = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (msg.zoom == null) {
    handleError('zoom property must be set', msg);
    return;
  }

  if (!msg.projection) {
    handleError('projection property must be set', msg);
    return;
  }

  if (!msg.width) {
    handleError('width property must be set', msg);
    return;
  }

  if (!msg.height) {
    handleError('height property must be set', msg);
    return;
  }

  if (!msg.extent) {
    handleError('extent (ol.Extent in EPSG:4326) property must be set', msg);
    return;
  }

  try {
    var tileDao = gpkg.getTileDao(msg.tableName);
    var bbox = new GeoPackage.BoundingBox(msg.extent[0], msg.extent[2], msg.extent[1], msg.extent[3]);
    var ret = new GeoPackage.GeoPackageTileRetriever(tileDao, msg.width, msg.height);

    // set the scaling for the layer on the retriever to ensure tiles come back outside the default range
    var tileScaling = tileScalingByTableName[msg.tableName];
    if (tileScaling) {
      ret.setScaling(tileScaling);
    }

    ret.getTileWithWgs84BoundsInProjection(bbox, msg.zoom, msg.projection)
        .then(function(tile) {
          success(msg, tile);
        })
        .catch(function(err) {
          handleError(err, msg);
        });
  } catch (e) {
    handleError(e, msg);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var getFeatures = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  try {
    var itr = gpkg.iterateGeoJSONFeatures(msg.tableName);
    var record = itr.next();
    while (record) {
      success(msg, record.value);
      record = record.done ? null : itr.next();
    }

    success(msg, 0);
  } catch (e) {
    handleError(e, msg);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportCreate = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var url = msg.url || (isNode ? 'tmp.gpkg' : undefined);

  GeoPackage.GeoPackageAPI.create(url)
      .then(function(gpkg) {
        if (gpkg) {
          gpkgById[msg.id] = gpkg;
          success(msg);
        }
      })
      .catch(function(err) {
        handleError(err, msg);
      });
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportCreateTable = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (!msg.columns) {
    handleError('columns property must be set', msg);
    return;
  }

  var FeatureColumn = GeoPackage.FeatureColumn;
  var DataType = GeoPackage.GeoPackageDataType;
  var GeometryType = GeoPackage.GeometryType;

  // disable camelcase checks for external library that does not conform to the rule
  /* eslint-disable google-camelcase/google-camelcase */
  var geometryColumns = new GeoPackage.GeometryColumns();
  geometryColumns.table_name = msg.tableName;
  geometryColumns.column_name = 'geometry';
  geometryColumns.geometry_type_name = GeometryType.nameFromType(GeometryType.GEOMETRY);
  geometryColumns.z = 2;
  geometryColumns.m = 0;
  /* eslint-enable google-camelcase/google-camelcase */

  var columns = [];
  columns.push(FeatureColumn.createPrimaryKeyColumn(0, 'id'));
  columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', GeometryType.GEOMETRY, false, null));

  msg.columns.forEach(function(col) {
    if (col.field.toLowerCase() === 'id' || col.field.toLowerCase() === 'geometry' ||
        col.field === 'TIME_START' || col.field === 'TIME_STOP') {
      return;
    }

    if (col.field === 'recordTime') {
      columns.push(FeatureColumn.createColumn(columns.length, 'TIME_START', DataType.DATETIME, false, null));
      columns.push(FeatureColumn.createColumn(columns.length, 'TIME_STOP', DataType.DATETIME, false, null));
    } else {
      var type = DataType.TEXT;
      var defaultValue = '';
      var colType = col.type.toLowerCase();

      if (colType === 'decimal') {
        type = DataType.REAL;
        defaultValue = null;
      } else if (colType === 'integer') {
        type = DataType.INTEGER;
        defaultValue = null;
      } else if (colType === 'datetime') {
        type = DataType.TEXT;
        defaultValue = null;
      }

      columns.push(FeatureColumn.createColumn(columns.length, col.field, type, false, defaultValue));
    }
  });

  try {
    gpkg.createFeatureTable(msg.tableName, geometryColumns, columns);
    success(msg);
  } catch (e) {
    handleError(e, msg);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGeoJSON = function(msg) {
  var gpkg = getGpkg(msg);

  if (!msg.tableName) {
    handleError('tableName property must be set', msg);
    return;
  }

  if (!msg.data || typeof msg.data !== 'object') {
    handleError('GeoJSON feature not found on msg.data', msg);
    return;
  }

  try {
    var geojson = msg.data;
    var props = geojson.properties;

    // time start and stop are ISO8601 strings, and the new API needs dates
    if ('TIME_START' in props) {
      props.TIME_START = new Date(Date.parse(props.TIME_START));
    }

    if ('TIME_STOP' in props) {
      props.TIME_STOP = new Date(Date.parse(props.TIME_STOP));
    }

    gpkg.addGeoJSONFeatureToGeoPackage(geojson, msg.tableName);
    success(msg);
  } catch (e) {
    handleError(e, msg);
  }
};


/**
 * @type {Object<string, {data: Uint8Array, index: number}>}
 */
var exportsById = {};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportWrite = function(msg) {
  var gpkg = getGpkg(msg);

  gpkg.export().then((data) => {
    exportsById[msg.id] = {
      data: new Uint8Array(data),
      index: 0
    };

    success(msg);
  }, (err) => {
    handleError(err, msg);
  });
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGetChunk = function(msg) {
  if (!msg.id) {
    handleError('id property must be set', msg);
    return;
  }

  var ex = exportsById[msg.id];

  if (!ex) {
    handleError('an export for the id has not been started', msg);
    return;
  }

  var data = ex.data;

  if (isNode) {
    var limit = Math.min(ex.index + (1024 * 1024) + 1, ex.data.length);
    var data = Array.from(ex.data.subarray(ex.index, limit));
    ex.index = limit;
  }

  success(msg, data);
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportWriteFinish = function(msg) {
  closeGpkg(msg);
  delete exportsById[msg.id];
  success(msg);
};


var ExportCommands = {
  create: exportCreate,
  createTable: exportCreateTable,
  geojson: exportGeoJSON,
  write: exportWrite,
  getChunk: exportGetChunk,
  writeFinish: exportWriteFinish
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var exportGpkg = function(msg) {
  if (!msg.command) {
    handleError('command property must be set', msg);
    return;
  }

  if (msg.command in ExportCommands) {
    ExportCommands[msg.command](msg);
  } else {
    handleError('Unknown command type', msg);
  }
};


/**
 * @param {GeoPackageWorkerMessage} msg
 */
var openLibrary = function(msg) {
  if (!isNode) {
    // this allows the main application to detect where this is loaded
    importScripts(msg.url);
    GeoPackage = self.GeoPackage;
    setupLibrary(msg.url.replace('/geopackage.min.js', ''));
  }
};


/**
 * If the OffscreenCanvas API is supported.
 * @return {boolean}
 */
var supportsOffscreenCanvas = function() {
  if (typeof self === 'object' && self.OffscreenCanvas) {
    try {
      var canvas = new OffscreenCanvas(0, 0);
      var context = canvas.getContext('2d');
      return !!context;
    } catch (e) {}
  }

  return false;
};


/**
 * Set up the geopackage library
 * @param {string} distPath Path to the dist folder.
 * @param {string=} pathSep The path separator. Defaults to '/'.
 */
var setupLibrary = function(distPath, pathSep = '/') {
  GeoPackage.setSqljsWasmLocateFile((file) => [distPath, file].join(pathSep));
  GeoPackage.setCanvasKitWasmLocateFile((file) => [distPath, 'canvaskit', file].join(pathSep));

  // Prefer the OffscreenCanvas browser API if available, to avoid loading the CanvasKit library.
  var canvasAdapter = supportsOffscreenCanvas() ? GeoPackage.OffscreenCanvasAdapter : GeoPackage.CanvasKitCanvasAdapter;
  GeoPackage.Context.setupCustomContext(GeoPackage.SqljsAdapter, canvasAdapter);
};


var MsgCommands = {
  openLibrary: openLibrary,
  open: openGpkg,
  close: closeGpkg,
  listDescriptors: listDescriptors,
  getTile: getTile,
  getFeatures: getFeatures,
  export: exportGpkg
};

/**
 * @param {Event|GeoPackageWorkerMessage} evt The message
 * @this Worker
 */
var onMessage = function(evt) {
  var msg = /** @type {GeoPackageWorkerMessage} */ (isNode ? evt : evt.data);

  if (msg) {
    if (msg.type in MsgCommands) {
      MsgCommands[msg.type](msg);
    } else {
      handleError('Unknown message type', msg);
    }
  }
};


(function() {
  if (typeof self === 'object') {
    self.addEventListener('message', onMessage);
  } else {
    isNode = true;
    process.on('message', onMessage);

    /**
     * @param {GeoPackageWorkerResponse} msg
     */
    global.postMessage = function(msg) {
      process.send(msg);
    };

    // CLEVER HACK ALERT!
    // This script runs in either a Worker (web) or in a node child process (Electron).
    // The child process has a node-only environment by default, rather than an Electron
    // environment. However, electron-builder only packages the version built for the
    // Electron environment.
    //
    // Therefore, trick node-pre-gyp into thinking we're in Electron.
    // see associated env variable set in geopackage.js
    if (process.versions.electron == null && process.env.ELECTRON_VERSION) {
      process.versions.electron = process.env.ELECTRON_VERSION;
    }

    if (process.env.ELECTRON_EXTRA_PATH) {
      module.paths.unshift(process.env.ELECTRON_EXTRA_PATH);
    }

    GeoPackage = require('@ngageoint/geopackage');

    var path = require('path');
    var basePath = require.resolve('@ngageoint/geopackage');
    var distPath = path.dirname(basePath);
    setupLibrary(distPath, path.sep);
  }
})();
