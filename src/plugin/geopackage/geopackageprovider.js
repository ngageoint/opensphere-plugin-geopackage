goog.module('plugin.geopackage.GeoPackageProvider');

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const {makeSafe, intAwareCompare} = goog.require('goog.string');

const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const DataManager = goog.require('os.data.DataManager');
const {isFileSystem} = goog.require('os.file');
const LayerType = goog.require('os.layer.LayerType');
const Request = goog.require('os.net.Request');
const Icons = goog.require('os.ui.Icons');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const DescriptorNode = goog.require('os.ui.data.DescriptorNode');
const {directiveTag} = goog.require('os.ui.data.LayerCheckboxUI');
const AbstractLoadingServer = goog.require('os.ui.server.AbstractLoadingServer');
const {getWorker, isElectron, MsgType, ID} = goog.require('plugin.geopackage');
const {MIN_ZOOM, MAX_ZOOM} = goog.require('os.map');

const GoogEvent = goog.requireType('goog.events.Event');
const ITreeNode = goog.requireType('os.structs.ITreeNode');


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
class GeoPackageProvider extends AbstractLoadingServer {
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

exports = GeoPackageProvider;
