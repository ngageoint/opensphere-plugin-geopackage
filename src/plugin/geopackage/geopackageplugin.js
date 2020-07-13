goog.module('plugin.geopackage.GeoPackagePlugin');

const DataManager = goog.require('os.data.DataManager');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const {isLocal} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const RequestHandlerFactory = goog.require('os.net.RequestHandlerFactory');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const PluginManager = goog.require('os.plugin.PluginManager');
const ImportManager = goog.require('os.ui.im.ImportManager');
const exportManager = goog.require('os.ui.exportManager');
const geopackage = goog.require('plugin.geopackage');
const Exporter = goog.require('plugin.geopackage.Exporter');
const GeoPackageImportUI = goog.require('plugin.geopackage.GeoPackageImportUI');
const GeoPackageProvider = goog.require('plugin.geopackage.GeoPackageProvider');
const RequestHandler = goog.require('plugin.geopackage.RequestHandler');
const TileLayerConfig = goog.require('plugin.geopackage.TileLayerConfig');
const VectorLayerConfig = goog.require('plugin.geopackage.VectorLayerConfig');
const mime = goog.require('plugin.geopackage.mime');


/**
 * Provides support for GeoPackage vector files
 */
class GeoPackagePlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = geopackage.ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    // register geopackage provider type
    const dm = DataManager.getInstance();
    dm.registerProviderType(new ProviderEntry(
        geopackage.ID,
        GeoPackageProvider,
        'GeoPackage File',
        'Provides raster and vector data in a single file format'));

    const lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(geopackage.ID + '-tile', TileLayerConfig);
    lcm.registerLayerConfig(geopackage.ID + '-vector', VectorLayerConfig);

    RequestHandlerFactory.addHandler(RequestHandler);

    // register the GeoPackage exporter
    exportManager.registerExportMethod(new Exporter());

    const im = ImportManager.getInstance();
    im.registerImportDetails('GeoPackage', true);
    im.registerImportUI(mime.TYPE, new GeoPackageImportUI);

    os.dataManager.listen(DataProviderEventType.REMOVE_PROVIDER, this.onProviderRemove_, false, this);
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

exports = GeoPackagePlugin;
