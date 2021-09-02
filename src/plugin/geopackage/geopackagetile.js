goog.declareModuleId('plugin.geopackage.Tile');

const ColorableTile = goog.require('os.tile.ColorableTile');


/**
 * Implementation of a tile that is colorable.
 */
export class Tile extends ColorableTile {
  /**
   * Constructor.
   * @param {ol.TileCoord} tileCoord Tile coordinate.
   * @param {ol.TileState} state State.
   * @param {string} src Image source URI.
   * @param {?string} crossOrigin Cross origin.
   * @param {ol.TileLoadFunctionType} tileLoadFunction Tile load function.
   */
  constructor(tileCoord, state, src, crossOrigin, tileLoadFunction) {
    super(tileCoord, state, src, crossOrigin, tileLoadFunction);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    const src = this.getImage().src;
    if (src) {
      URL.revokeObjectURL(src);
    }

    super.disposeInternal();
  }
}
