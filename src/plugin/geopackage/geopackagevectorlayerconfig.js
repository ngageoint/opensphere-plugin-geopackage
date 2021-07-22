goog.module('plugin.geopackage.VectorLayerConfig');

const AltMapping = goog.require('os.im.mapping.AltMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const TimeFormat = goog.require('os.im.mapping.TimeFormat');
const TimeType = goog.require('os.im.mapping.TimeType');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const FeatureType = goog.require('os.ogc.wfs.FeatureType');
const GeoJSONLayerConfig = goog.require('plugin.file.geojson.GeoJSONLayerConfig');

const Importer = goog.requireType('os.im.Importer');
const VectorLayer = goog.requireType('os.layer.Vector');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const IFeatureType = goog.requireType('os.ogc.IFeatureType');
const Request = goog.requireType('os.source.Request');


/**
 */
class VectorLayerConfig extends GeoJSONLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getLayer(source, options) {
    const layer = super.getLayer(source, options);

    const id = /** @type {string} */ (options['id']);
    const columns = /** @type {Array<!FeatureTypeColumn>} */ (options['dbColumns'].slice());
    const featureType = new FeatureType(id, columns);

    if (columns.find((col) => col['name'] == 'geometry')) {
      // GPKG treats the geometry column as a special field that contains geometry blobs, but we can't show them.
      // Set the geometry column name to filter that column out in the fixFeatureTypeColumns call below.
      featureType.setGeometryColumnName('geometry');
    }

    this.fixFeatureTypeColumns(layer, options, featureType);
    this.addMappings(layer, options, featureType);

    return layer;
  }

  /**
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @param {IFeatureType} featureType
   */
  addMappings(layer, options, featureType) {
    const animate = options['animate'] != null ? options['animate'] : false;
    const source = /** @type {Request} */ (layer.getSource());
    const importer = /** @type {Importer} */ (source.getImporter());

    const execMappings = [];
    const startField = featureType.getStartDateColumnName();
    const endField = featureType.getEndDateColumnName();

    if (animate && startField) {
      if (startField != endField) {
        // add a start/end datetime mapping
        // this mapping does not remove the original fields since it's mapping two fields to one, and the original
        // fields may be wanted when exporting data
        const startMapping = new DateTimeMapping(TimeType.START);
        startMapping.field = startField;
        startMapping.setFormat(TimeFormat.ISO);
        execMappings.push(startMapping);

        const endMapping = new DateTimeMapping(TimeType.END);
        endMapping.field = endField;
        endMapping.setFormat(TimeFormat.ISO);
        execMappings.push(endMapping);
      } else {
        // add a datetime mapping
        // this mapping removes the original field since we're replacing the original with our own
        const timeMapping = new DateTimeMapping(TimeType.INSTANT);
        timeMapping.field = startField;
        timeMapping.setFormat(TimeFormat.ISO);
        execMappings.push(timeMapping);
      }
    }

    if (execMappings && execMappings.length > 0) {
      importer.setExecMappings(execMappings);
    }

    // tell the importer we want to run a different set of autodetection mappers
    importer.selectAutoMappings([
      AltMapping.ID,
      RadiusMapping.ID,
      SemiMajorMapping.ID,
      SemiMinorMapping.ID
    ]);
  }
}

exports = VectorLayerConfig;
