goog.module('plugin.geopackage.GeoPackageImportUI');

const AlertManager = goog.require('os.alert.AlertManager');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const {isLocal, FILE_URL_ENABLED} = goog.require('os.file');
const FileStorage = goog.require('os.file.FileStorage');
const AbstractImportUI = goog.require('os.ui.im.AbstractImportUI');
const windows = goog.require('os.ui.menu.windows');
const geopackage = goog.require('plugin.geopackage');
const GeoPackageProvider = goog.require('plugin.geopackage.GeoPackageProvider');

const OSFile = goog.requireType('os.file.File');


/**
 */
class GeoPackageImportUI extends AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.requiresStorage = !FILE_URL_ENABLED;

    /**
     * @type {OSFile}
     * @protected
     */
    this.file = null;
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    if (file) {
      this.file = file;
      const url = file.getUrl();

      // see if there are any other geopackage providers for the same file
      const list = os.dataManager.getProviderRoot().getChildren()
          .filter((provider) => provider instanceof GeoPackageProvider && provider.getUrl() === url);

      if (list.length) {
        list.forEach((provider) => {
          provider.load();
        });

        AlertManager.getInstance().sendAlert(`${file.getFileName()} GeoPackage refreshed`, AlertEventSeverity.INFO);
      } else if (isLocal(file)) {
        FileStorage.getInstance().storeFile(file, true).addCallbacks(this.onFileReady, this.onFileError, this);
      } else {
        this.onFileReady();
      }
    }
  }

  /**
   * @protected
   */
  onFileReady() {
    const file = this.file;
    const conf = {
      'type': geopackage.ID,
      'label': file.getFileName(),
      'url': file.getUrl()
    };

    const provider = new GeoPackageProvider();
    provider.configure(conf);
    provider.setId(goog.string.getRandomString());
    provider.setEnabled(true);
    provider.setEditable(true);
    provider.load();

    os.settings.set(['userProviders', provider.getId()], conf);
    os.dataManager.addProvider(provider);

    AlertManager.getInstance().sendAlert(`${file.getFileName()} GeoPackage added!`, AlertEventSeverity.INFO);

    windows.openWindow('addData');
    this.file = null;
  }

  /**
   * @param {*=} opt_reason
   * @protected
   */
  onFileError(opt_reason) {
    AlertManager.getInstance().sendAlert(`Error adding GeoPackage. ${opt_reason}`);
    this.file = null;
  }
}

exports = GeoPackageImportUI;
