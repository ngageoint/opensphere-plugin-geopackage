goog.declareModuleId('plugin.geopackage.VectorLayerConfig');

import AltMapping from 'opensphere/src/os/im/mapping/altmapping.js';
import RadiusMapping from 'opensphere/src/os/im/mapping/radiusmapping.js';
import SemiMajorMapping from 'opensphere/src/os/im/mapping/semimajormapping.js';
import SemiMinorMapping from 'opensphere/src/os/im/mapping/semiminormapping.js';
import DateTimeMapping from 'opensphere/src/os/im/mapping/time/datetimemapping.js';
import TimeFormat from 'opensphere/src/os/im/mapping/timeformat.js';
import TimeType from 'opensphere/src/os/im/mapping/timetype.js';
import FeatureType from 'opensphere/src/os/ogc/wfs/featuretype.js';
import GeoJSONLayerConfig from 'opensphere/src/plugin/file/geojson/geojsonlayerconfig.js';

const {default: Importer} = goog.requireType('os.im.Importer');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');
const {default: FeatureTypeColumn} = goog.requireType('os.ogc.FeatureTypeColumn');
const {default: IFeatureType} = goog.requireType('os.ogc.IFeatureType');
const {default: Request} = goog.requireType('os.source.Request');


/**
 */
export class VectorLayerConfig extends GeoJSONLayerConfig {
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
    const startField = featureType.getStartDateColumnName() || undefined;
    const endField = featureType.getEndDateColumnName() || undefined;

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
