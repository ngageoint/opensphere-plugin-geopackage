goog.module('plugin.geopackage.mime');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');


/**
 * @type {string}
 * @const
 */
exports.TYPE = 'application/vnd.opengeospatial.geopackage+sqlite3';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
exports.detect = (buffer, file, opt_context) => {
  let retVal = false;

  const str = 'SQLite format 3';
  if (file && file.getFileName() && /\.gpkg$/.test(file.getFileName()) &&
    buffer && buffer.byteLength > str.length && String.fromCharCode(
      ...new Uint8Array(buffer).slice(0, str.length)) === str) {
    retVal = true;
  }

  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(retVal));
};


mime.register(exports.TYPE, exports.detect);
