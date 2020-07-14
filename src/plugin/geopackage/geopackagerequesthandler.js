goog.module('plugin.geopackage.RequestHandler');

const EventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const NetEventType = goog.require('goog.net.EventType');
const {getWorker, MsgType, ID} = goog.require('plugin.geopackage');

const Logger = goog.requireType('goog.log.Logger');
const IRequestHandler = goog.requireType('os.net.IRequestHandler');


/**
 * Logger
 * @type {Logger}
 */
const LOGGER = log.getLogger('plugin.geopackage.RequestHandler');


/**
 * @implements {IRequestHandler}
 */
class RequestHandler extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.log = LOGGER;

    /**
     * @type {number}
     * @protected
     */
    this.statusCode = -1;

    /**
     * @type {Array<string>}
     * @protected
     */
    this.errors = [];

    /**
     * @type {Array<Object>}
     * @protected
     */
    this.features = null;

    /**
     * @private
     */
    this.workerHandler_ = this.onMessage.bind(this);

    /**
     * @type {string}
     * @protected
     */
    this.lastId = '';

    /**
     * @type {string}
     * @protected
     */
    this.lastTableName = '';
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    const worker = getWorker();
    worker.removeEventListener(GoogEventType.MESSAGE, this.workerHandler_);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return 100;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    return uri.getScheme() === 'gpkg';
  }

  /**
   * @inheritDoc
   */
  getResponse() {
    return this.features;
  }

  /**
   * @inheritDoc
   */
  getResponseHeaders() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getTimeout() {
    return 0;
  }

  /**
   * @inheritDoc
   */
  setTimeout(value) {
    // not supported
  }

  /**
   * @inheritDoc
   */
  getErrors() {
    return this.errors.length ? this.errors : null;
  }

  /**
   * @inheritDoc
   */
  getStatusCode() {
    return this.statusCode;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return ID;
  }

  /**
   * @inheritDoc
   */
  isHandled() {
    return true;
  }

  /**
   * @inheritDoc
   */
  buildRequest() {}


  /**
   * @inheritDoc
   */
  abort() {}

  /**
   * @inheritDoc
   */
  execute(method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {
    const worker = getWorker();
    worker.addEventListener(GoogEventType.MESSAGE, this.workerHandler_);

    this.lastId = uri.getDomain();
    this.lastTableName = uri.getPath().substring(1);

    worker.postMessage(/** @type {GeoPackageWorkerMessage} */ ({
      id: this.lastId,
      type: MsgType.GET_FEATURES,
      tableName: this.lastTableName
    }));
  }

  /**
   * @param {Event|GeoPackageWorkerResponse} e
   * @protected
   */
  onMessage(e) {
    const msg = /** @type {GeoPackageWorkerResponse} */ (e instanceof window.Event ? e.data : e);

    if (msg.message.id === this.lastId && msg.message.tableName === this.lastTableName) {
      const worker = getWorker();

      if (msg.type === MsgType.SUCCESS) {
        if (msg.data === 0) {
          // finished
          worker.removeEventListener(GoogEventType.MESSAGE, this.workerHandler_);
          this.dispatchEvent(NetEventType.SUCCESS);
        } else if (msg.data) {
          if ('geometry' in msg.data['properties']) {
            // this will really screw up the resulting feature
            delete msg.data['properties']['geometry'];
          }

          if (!this.features) {
            this.features = [];
          }

          this.features.push(msg.data);
        }
      } else {
        worker.removeEventListener(GoogEventType.MESSAGE, this.workerHandler_);
        this.errors.push(String(msg.reason));
        this.statusCode = 500;
        this.dispatchEvent(NetEventType.ERROR);
      }
    }
  }
}


exports = RequestHandler;
