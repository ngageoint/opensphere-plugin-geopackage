goog.declareModuleId('plugin.geopackage.mime');

const Promise = goog.require('goog.Promise');
const {register} = goog.require('os.file.mime');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'application/vnd.opengeospatial.geopackage+sqlite3';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detect = (buffer, file, opt_context) => {
  let retVal = false;

  const str = 'SQLite format 3';
  if (file && file.getFileName() && /\.gpkg$/.test(file.getFileName()) &&
    buffer && buffer.byteLength > str.length && String.fromCharCode(
      ...new Uint8Array(buffer).slice(0, str.length)) === str) {
    retVal = true;
  }

  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(retVal));
};

register(TYPE, detect);
