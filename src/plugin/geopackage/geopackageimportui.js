goog.declareModuleId('plugin.geopackage.GeoPackageImportUI');

import AlertEventSeverity from 'opensphere/src/os/alert/alerteventseverity.js';
import AlertManager from 'opensphere/src/os/alert/alertmanager.js';
import Settings from 'opensphere/src/os/config/settings.js';
import DataManager from 'opensphere/src/os/data/datamanager.js';
import DataProviderEventType from 'opensphere/src/os/data/dataprovidereventtype.js';
import FileStorage from 'opensphere/src/os/file/filestorage.js';
import {isLocal, isFileUrlEnabled} from 'opensphere/src/os/file/index.js';
import AbstractImportUI from 'opensphere/src/os/ui/im/abstractimportui.js';
import * as windows from 'opensphere/src/os/ui/menu/windowsmenu.js';
import {ID} from './geopackage.js';
import {GeoPackageProvider} from './geopackageprovider.js';

const {default: DataProviderEvent} = goog.requireType('os.data.DataProviderEvent');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: DescriptorNode} = goog.requireType('os.ui.data.DescriptorNode');


/**
 */
export class GeoPackageImportUI extends AbstractImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.requiresStorage = !isFileUrlEnabled();

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
      const list = /** @type {!Array<!GeoPackageProvider>} */ (DataManager.getInstance().getProviderRoot().getChildren()
          .filter((provider) => provider instanceof GeoPackageProvider && provider.getUrl() === url));

      if (list.length) {
        list.forEach((provider) => {
          provider.load();
        });

        AlertManager.getInstance().sendAlert(`${file.getFileName()} GeoPackage refreshed`, AlertEventSeverity.INFO);
      } else if (isLocal(file)) {
        FileStorage.getInstance().storeFile(file, true)
            .addCallbacks(this.onFileReady.bind(this, opt_config), this.onFileError, this);
      } else {
        this.onFileReady();
      }
    }
  }

  /**
   * Handler for file readiness.
   * @param {Object<string, *>=} opt_config
   * @protected
   */
  onFileReady(opt_config) {
    const file = this.file;
    const conf = {
      'type': ID,
      'label': file.getFileName(),
      'url': file.getUrl()
    };

    const provider = new GeoPackageProvider();
    provider.configure(conf);
    provider.setId(goog.string.getRandomString());
    provider.setEnabled(true);
    provider.setEditable(true);
    provider.load();

    Settings.getInstance().set(['userProviders', provider.getId()], conf);
    DataManager.getInstance().addProvider(provider);

    AlertManager.getInstance().sendAlert(`${file.getFileName()} GeoPackage added!`, AlertEventSeverity.INFO);

    if (opt_config && opt_config['defaultImport']) {
      provider.listenOnce(DataProviderEventType.LOADED, this.onProviderLoaded, false, this);
    } else {
      windows.openWindow('addData');
    }

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

  /**
   * Handler for provider load. Activates the underlying descriptors to display the layers on the map.
   * @param {DataProviderEvent} event The loading event.
   */
  onProviderLoaded(event) {
    const provider = /** @type {GeoPackageProvider} */ (event.target);
    const children = /** @type {Array<DescriptorNode>} */ (provider.getChildren());

    if (children && children.length) {
      children.forEach((descriptorNode) => {
        descriptorNode.getDescriptor().setActive(true);
      });
    }
  }
}
