goog.declareModuleId('plugin.geopackage.GeoPackagePlugin');

import exportManager from 'opensphere/src/os/ui/file/uiexportmanager.js';
import ImportManager from 'opensphere/src/os/ui/im/importmanager.js';
import {ID} from './geopackage.js';
import {Exporter} from './geopackageexporter.js';
import {GeoPackageImportUI} from './geopackageimportui.js';
import {GeoPackageProvider} from './geopackageprovider.js';
import {RequestHandler} from './geopackagerequesthandler.js';
import {TileLayerConfig} from './geopackagetilelayerconfig.js';
import {VectorLayerConfig} from './geopackagevectorlayerconfig.js';
import {TYPE} from './mime.js';

const DataManager = goog.require('os.data.DataManager');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const {isLocal} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const RequestHandlerFactory = goog.require('os.net.RequestHandlerFactory');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const PluginManager = goog.require('os.plugin.PluginManager');


/**
 * Provides support for GeoPackage vector files
 */
export class GeoPackagePlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    // register geopackage provider type
    const dm = DataManager.getInstance();
    dm.registerProviderType(new ProviderEntry(
        ID,
        GeoPackageProvider,
        'GeoPackage File',
        'Provides raster and vector data in a single file format'));

    const lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(ID + '-tile', TileLayerConfig);
    lcm.registerLayerConfig(ID + '-vector', VectorLayerConfig);

    RequestHandlerFactory.addHandler(RequestHandler);

    // register the GeoPackage exporter
    exportManager.registerExportMethod(new Exporter());

    const im = ImportManager.getInstance();
    im.registerImportDetails('GeoPackage', true);
    im.registerImportUI(TYPE, new GeoPackageImportUI);

    dm.listen(DataProviderEventType.REMOVE_PROVIDER, this.onProviderRemove_, false, this);
  }

  /**
   * @param {os.data.DataProviderEvent} evt
   * @private
   */
  onProviderRemove_(evt) {
    if (evt.dataProvider instanceof GeoPackageProvider && isLocal(evt.dataProvider.getUrl())) {
      const fs = FileStorage.getInstance();
      if (fs.fileExists(evt.dataProvider.getUrl())) {
        fs.deleteFile(evt.dataProvider.getUrl());
      }
    }
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new GeoPackagePlugin());
