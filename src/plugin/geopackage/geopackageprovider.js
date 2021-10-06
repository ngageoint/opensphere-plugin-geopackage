goog.declareModuleId('plugin.geopackage.GeoPackageProvider');

import AlertEventSeverity from 'opensphere/src/os/alert/alerteventseverity.js';
import AlertManager from 'opensphere/src/os/alert/alertmanager.js';
import ConfigDescriptor from 'opensphere/src/os/data/configdescriptor.js';
import DataManager from 'opensphere/src/os/data/datamanager.js';
import {isFileSystem} from 'opensphere/src/os/file/index.js';
import LayerType from 'opensphere/src/os/layer/layertype.js';
import {MAX_ZOOM, MIN_ZOOM} from 'opensphere/src/os/map/map.js';
import Request from 'opensphere/src/os/net/request.js';
import BaseProvider from 'opensphere/src/os/ui/data/baseprovider.js';
import DescriptorNode from 'opensphere/src/os/ui/data/descriptornode.js';
import {directiveTag} from 'opensphere/src/os/ui/data/layercheckbox.js';
import Icons from 'opensphere/src/os/ui/icons.js';
import AbstractLoadingServer from 'opensphere/src/os/ui/server/abstractloadingserver.js';
import {ID, MsgType, fixResolutions, getWorker, isElectron} from './geopackage.js';

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const {makeSafe, intAwareCompare} = goog.require('goog.string');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * The logger.
 * @type {log.Logger}
 */
const LOGGER = log.getLogger('plugin.geopackage.GeoPackageProvider');


/**
 * @param {ITreeNode} a The first node
 * @param {ITreeNode} b The second node
 * @return {number} per typical compare functions
 */
const labelSort = (a, b) => intAwareCompare(a.getLabel() || '', b.getLabel() || '');


/**
 * GeoPackage provider
 */
export class GeoPackageProvider extends AbstractLoadingServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = LOGGER;

    /**
     * @private
     */
    this.workerHandler_ = this.onWorkerMessage_.bind(this);

    const w = getWorker();
    w.addEventListener(GoogEventType.MESSAGE, this.workerHandler_);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // close any previously-opened versions
    const worker = getWorker();
    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.getId(),
      type: MsgType.CLOSE
    }));

    worker.removeEventListener(GoogEventType.MESSAGE, this.workerHandler_);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setUrl(/** @type {string} */ (config['url']));
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    super.load(opt_ping);
    this.setLoading(true);

    const url = this.getUrl();

    if (isElectron() && isFileSystem(url)) {
      const worker = getWorker();

      // close any previously-opened versions
      worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        id: this.getId(),
        type: MsgType.CLOSE
      }));

      // open the DB
      worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        id: this.getId(),
        type: MsgType.OPEN,
        url: url
      }));
    } else {
      const request = new Request(this.getUrl());
      request.setHeader('Accept', '*/*');
      request.listen(NetEventType.SUCCESS, this.onUrl_, false, this);
      request.listen(NetEventType.ERROR, this.onUrlError_, false, this);
      request.setResponseType(ResponseType.ARRAY_BUFFER);
      request.load();
    }
  }

  /**
   * @param {Event|GeoPackageWorkerMessage} e
   */
  onWorkerMessage_(e) {
    const msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof Event ? e.data : e);
    const worker = getWorker();

    if (msg.message.id === this.getId()) {
      if (msg.type === MsgType.SUCCESS) {
        if (msg.message.type === MsgType.OPEN) {
          worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
            id: this.getId(),
            type: MsgType.LIST_DESCRIPTORS
          }));
        } else if (msg.message.type === MsgType.LIST_DESCRIPTORS) {
          const configs = /** @type {Array<Object<string, *>>} */ (msg.data);
          configs.forEach(this.addDescriptor_, this);
          this.finish();
        }
      } else {
        this.logError(msg.message.id + ' ' + msg.message.type + ' failed! ' + msg.reason);
      }
    }
  }

  /**
   * @inheritDoc
   */
  finish() {
    const children = this.getChildren();
    if (children) {
      children.sort(labelSort);
    }

    super.finish();
  }

  /**
   * @inheritDoc
   */
  getCheckboxDisabled() {
    return false;
  }

  /**
   * @inheritDoc
   */
  formatCheckbox() {
    return `<${directiveTag}></${directiveTag}>`;
  }

  /**
   * @param {GoogEvent} event The event
   * @private
   */
  onUrl_(event) {
    const req = /** @type {Request} */ (event.target);
    const response = req.getResponse();
    goog.dispose(req);

    if (response instanceof ArrayBuffer) {
      const worker = getWorker();

      // close any previously-opened versions
      worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        id: this.getId(),
        type: MsgType.CLOSE
      }));

      // open the DB
      worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
        id: this.getId(),
        type: MsgType.OPEN,
        data: response
      }), [response]);
    }
  }

  /**
   * @param {GoogEvent} event The event
   * @private
   */
  onUrlError_(event) {
    const req = /** @type {Request} */ (event.target);
    const errors = req.getErrors();
    const uri = req.getUri();
    goog.dispose(req);

    const href = uri.toString();
    let msg = 'Request failed for <a target="_blank" href="' + href + '">GeoPackage</a> ';

    if (errors) {
      msg += errors.join(' ');
    }

    this.logError(msg);
  }

  /**
   * @param {*} msg The error message.
   * @protected
   */
  logError(msg) {
    msg = makeSafe(msg);

    if (!this.getError()) {
      const errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

      if (!this.getPing()) {
        AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
      }

      log.error(this.log, errorMsg);

      this.setErrorMessage(errorMsg);
      this.setLoading(false);
    }
  }

  /**
   * @param {Object<string, *>} config The layer config
   * @private
   */
  addDescriptor_(config) {
    const id = this.getId() + BaseProvider.ID_DELIMITER + config['tableName'];
    config['id'] = id;
    config['delayUpdateActive'] = true;
    config['provider'] = this.getLabel();

    if (Array.isArray(config['resolutions'])) {
      // Clean up the resolutions array to ensure OpenLayers doesn't have issues.
      fixResolutions(/** @type {!Array<?number>} */ (config['resolutions']));
    }

    if (config['type'] === ID + '-tile') {
      config['layerType'] = LayerType.TILES;
      config['icons'] = Icons.TILES;

      // we want the tiles to support the full zoom range, so set them regardless of what the file has configured
      config['minZoom'] = MIN_ZOOM;
      config['maxZoom'] = MAX_ZOOM;
    } else if (config['type'] === ID + '-vector') {
      const animate = config['dbColumns'].some((col) => col['type'] === 'datetime');

      config['layerType'] = LayerType.FEATURES;
      config['icons'] = Icons.FEATURES + (animate ? Icons.TIME : '');
      config['url'] = 'gpkg://' + this.getId() + '/' + config['title'];
      config['animate'] = animate;
    }

    if (id) {
      const dataManager = DataManager.getInstance();

      let descriptor = /** @type {ConfigDescriptor} */ (dataManager.getDescriptor(id));
      if (!descriptor) {
        descriptor = new ConfigDescriptor();
      }

      descriptor.setBaseConfig(config);
      dataManager.addDescriptor(descriptor);
      descriptor.updateActiveFromTemp();

      const node = new DescriptorNode();
      node.setDescriptor(descriptor);

      this.addChild(node);
    }
  }
}
