goog.module('plugin.geopackage.Exporter');

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const GeoJSON = goog.require('ol.format.GeoJSON');
const AlertManager = goog.require('os.alert.AlertManager');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const DataManager = goog.require('os.data.DataManager');
const RecordField = goog.require('os.data.RecordField');
const OSEventType = goog.require('os.events.EventType');
const AbstractExporter = goog.require('os.ex.AbstractExporter');
const osMap = goog.require('os.map');
const {getMapContainer} = goog.require('os.map.instance');
const {EPSG4326} = goog.require('os.proj');
const ThreadProgressEvent = goog.require('os.thread.ThreadProgressEvent');
const {getElectron, getWorker, ExportCommands, MsgType} = goog.require('plugin.geopackage');

const Feature = goog.requireType('ol.Feature');
const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const ILayer = goog.requireType('os.layer.ILayer');
const VectorSource = goog.requireType('os.source.Vector');


/**
 * @type {number}
 */
let exporterId = 0;


/**
 * @type {string}
 */
const RECORD_TIME_START_FIELD = 'TIME_START';


/**
 * @type {string}
 */
const RECORD_TIME_STOP_FIELD = 'TIME_STOP';


/**
 * Logger
 * @type {log.Logger}
 */
const LOGGER = log.getLogger('plugin.geopackage.Exporter');


/**
 * Maps a column definition to an exportable column object.
 * @param {ColumnDefinition} colDef
 * @return {{field: string, type: string}}
 */
const mapColumnDefToColumn = (colDef) => {
  return {
    'field': colDef['field'],
    'type': colDef['type']
  };
};


/**
 * The GeoPackage exporter.
 * @extends {AbstractExporter<Feature>}
 */
class Exporter extends AbstractExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = LOGGER;
    this.format = new GeoJSON();

    /**
     * @type {number}
     */
    this.index_ = 0;

    /**
     * @type {!Object<string, null>}
     * @private
     */
    this.tables_ = {};

    /**
     * @type {!Object<string, string>}
     * @private
     */
    this.idsToTables_ = {};

    /**
     * @type {string}
     * @protected
     */
    this.lastId = '';

    this.workerHandler_ = this.onMessage.bind(this);
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'GeoPackage';
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return 'gpkg';
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return 'application/vnd.opengeospatial.geopackage+sqlite3';
  }

  /**
   * @inheritDoc
   */
  isAsync() {
    return true;
  }

  /**
   * @inheritDoc
   */
  supportsMultiple() {
    return true;
  }

  /**
   * @inheritDoc
   */
  supportsProgress() {
    return true;
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();

    this.tables_ = {};
    this.idsToTables_ = {};
    exporterId++;

    const worker = getWorker();
    worker.removeEventListener(GoogEventType.MESSAGE, this.workerHandler_);
  }

  /**
   * @param {!string} errorMsg
   * @private
   */
  reportError_(errorMsg) {
    const msg = 'Error creating ' + this.getLabel() + ' file: ' + errorMsg;
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, this.log);

    this.dispatchEvent(OSEventType.ERROR);
  }

  /**
   * @inheritDoc
   */
  process() {
    const worker = getWorker();
    worker.addEventListener(GoogEventType.MESSAGE, this.workerHandler_);

    this.lastId = 'export' + exporterId;
    this.exportCommand(ExportCommands.CREATE);
  }

  /**
   * @param {Event|GeoPackageWorkerResponse} e
   * @protected
   */
  onMessage(e) {
    const msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof window.Event ? e.data : e);

    if (msg && msg.message.id === this.lastId && msg.message.type === MsgType.EXPORT) {
      if (msg.type === MsgType.SUCCESS) {
        if (msg.message.command === ExportCommands.CREATE) {
          this.index_ = 0;
        } else if (msg.message.command === ExportCommands.CREATE_TABLE) {
          this.tables_[/** @type {!string} */ (msg.message.tableName)] = null;
        }

        if (msg.message.command === ExportCommands.GEOJSON) {
          // the worker is done adding GeoJSON features to the geopackage
          this.exportCommand(ExportCommands.WRITE);
        } else if (msg.message.command === ExportCommands.PROGRESS) {
          // fire a notification event of the current progress
          const event = new ThreadProgressEvent(msg.message.count || 0, this.items.length);
          this.dispatchEvent(event);
        } else if (msg.message.command === ExportCommands.WRITE) {
          // initiate getting file chunks from the worker
          this.output = [];
          this.exportCommand(ExportCommands.GET_CHUNK);
        } else if (msg.message.command === ExportCommands.GET_CHUNK) {
          if (msg.data instanceof ArrayBuffer) {
            // we have the full ArrayBuffer, so finish the write
            this.output = msg.data;
            this.exportCommand(ExportCommands.WRITE_FINISH);
          } else if (msg.data && msg.data.length) {
            // add the chunk and request the next chunk.
            this.output = this.output.concat(msg.data);
            this.exportCommand(ExportCommands.GET_CHUNK);
          } else {
            // assume we're done
            this.exportCommand(ExportCommands.WRITE_FINISH);
          }
        } else if (msg.message.command === ExportCommands.WRITE_FINISH) {
          // finish the write and fire off the complete event
          if (!(this.output instanceof ArrayBuffer)) {
            this.output = Uint8Array.from(/** @type {!Array<!number>} */ (this.output)).buffer;
          }

          // remove the temporary file used in Electron
          const electron = getElectron();
          if (electron) {
            electron.unlinkFile('tmp.gpkg', (err) => {
              if (err) {
                log.error(LOGGER, 'Could not delete tmp.gpkg!');
              } else {
                log.info(LOGGER, 'Removed tmp.gpkg');
              }
            });
          }

          this.dispatchEvent(OSEventType.COMPLETE);
        } else {
          this.parseNext_();
        }
      } else {
        this.reportError_(`GeoPackage creation failed! ${msg.reason}`);
      }
    }
  }

  /**
   * @param {ExportCommands} cmd
   * @protected
   */
  exportCommand(cmd) {
    const worker = getWorker();
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.lastId,
      type: MsgType.EXPORT,
      command: cmd
    }));
  }

  /**
   * @private
   */
  parseNext_() {
    const worker = getWorker();
    const features = this.items;
    const feature = features[0];
    const source = this.getSource_(feature);
    if (!source) {
      this.reportError_(`Could not determine source for ${feature.getId()}`);
      return;
    }

    const id = source.getId();
    let tableName;

    if (id in this.idsToTables_) {
      tableName = this.idsToTables_[id];
    } else {
      tableName = /** @type {!ILayer} */ (getMapContainer().getLayer(id)).getTitle();
      this.idsToTables_[id] = tableName;
    }

    if (!tableName) {
      this.reportError_(`Could not determine table name for ${feature.getId()}`);
      return;
    }

    if (!(tableName in this.tables_)) {
      worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        id: this.lastId,
        type: MsgType.EXPORT,
        command: ExportCommands.CREATE_TABLE,
        columns: source.getColumns().map(mapColumnDefToColumn),
        tableName: tableName
      }));
      return;
    }

    const geojson = this.format.writeFeaturesObject(features, {
      featureProjection: osMap.PROJECTION,
      dataProjection: EPSG4326,
      fields: this.fields
    });

    const geojsonFeatures = geojson.features;
    geojsonFeatures.forEach((geojsonFeature, i) => {
      const props = geojsonFeature['properties'];
      const feature = features[i];
      const itime = feature.get(RecordField.TIME);
      if (itime) {
        props[RECORD_TIME_START_FIELD] = new Date(itime.getStart()).toISOString();

        if (itime instanceof os.time.TimeRange) {
          props[RECORD_TIME_STOP_FIELD] = new Date(itime.getEnd()).toISOString();
        }
      }
    });

    const event = new ThreadProgressEvent(0.1 * this.items.length, this.items.length);
    this.dispatchEvent(event);

    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.lastId,
      type: MsgType.EXPORT,
      command: ExportCommands.GEOJSON,
      tableName: tableName,
      data: geojson
    }));
  }

  /**
   * @param {Feature} feature The feature
   * @return {?VectorSource}
   * @private
   */
  getSource_(feature) {
    if (feature) {
      const sourceId = feature.get(RecordField.SOURCE_ID);
      if (typeof sourceId === 'string') {
        return /** @type {VectorSource} */ (DataManager.getInstance().getSource(sourceId));
      }
    }

    return null;
  }
}


exports = Exporter;
