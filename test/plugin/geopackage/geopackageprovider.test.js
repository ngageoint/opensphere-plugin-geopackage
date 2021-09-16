goog.require('os.data.DataProviderEventType');
goog.require('os.layer.LayerType');
goog.require('os.ui.Icons');
goog.require('os.ui.data.BaseProvider');
goog.require('plugin.geopackage.GeoPackageProvider');


describe('plugin.geopackage.GeoPackageProvider', function() {
  const DataProviderEventType = goog.module.get('os.data.DataProviderEventType');
  const LayerType = goog.module.get('os.layer.LayerType');
  const Icons = goog.module.get('os.ui.Icons');
  const BaseProvider = goog.module.get('os.ui.data.BaseProvider');
  const {GeoPackageProvider} = goog.module.get('plugin.geopackage.GeoPackageProvider');

  const baseUrl = '/base/test/resources/geopackage/';

  it('should configure properly', function() {
    const p = new GeoPackageProvider();

    const conf = {
      type: 'geopackage',
      label: 'Test Label',
      url: '/path/to/something.gpkg'
    };

    p.configure(conf);

    expect(p.getLabel()).toBe(conf.label);
    expect(p.getUrl()).toBe(conf.url);
  });

  it('should parse geopackages properly', function() {
    const p = new GeoPackageProvider();
    p.setUrl(baseUrl + 'gdal_sample_v1.2_no_extensions.gpkg');

    let count = 0;
    const listener = function(e) {
      count++;
    };

    p.listen(DataProviderEventType.LOADED, listener);

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return count > 0;
    }, 'GeoPackage to load', 5000);

    runs(function() {
      const children = p.getChildren();
      const prefix = p.getId() + BaseProvider.ID_DELIMITER;

      const expected = [{
        id: prefix + 'byte_jpeg',
        title: 'byte_jpeg',
        layerType: LayerType.TILES,
        icons: Icons.TILES,
        gpkgMinZoom: 0,
        gpkgMaxZoom: 0,
        projection: 'EPSG:26711',
        extentProjection: 'EPSG:26711',
        extent: [440720, 3735960, 456080, 3751320]
      }, {
        id: prefix + 'byte_png',
        title: 'byte_png',
        layerType: LayerType.TILES,
        icons: Icons.TILES,
        gpkgMinZoom: 0,
        gpkgMaxZoom: 0,
        projection: 'EPSG:26711',
        extentProjection: 'EPSG:26711',
        extent: [440720, 3735960, 456080, 3751320]
      }, {
        id: prefix + 'geomcollection2d',
        title: 'geomcollection2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'geomcollection3d',
        title: 'geomcollection3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'geometry2d',
        title: 'geometry2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'geometry3d',
        title: 'geometry3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'linestring2d',
        title: 'linestring2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'linestring3d',
        title: 'linestring3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multilinestring2d',
        title: 'multilinestring2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multilinestring3d',
        title: 'multilinestring3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multipoint2d',
        title: 'multipoint2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multipoint3d',
        title: 'multipoint3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multipolygon2d',
        title: 'multipolygon2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'multipolygon3d',
        title: 'multipolygon3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'point2d',
        title: 'point2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES + Icons.TIME
      }, {
        id: prefix + 'point3d',
        title: 'point3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'polygon2d',
        title: 'polygon2d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }, {
        id: prefix + 'polygon3d',
        title: 'polygon3d',
        layerType: LayerType.FEATURES,
        icons: Icons.FEATURES
      }];

      expect(children.length).toBe(expected.length);
      for (var i = 0, n = children.length; i < n; i++) {
        const config = children[i].getDescriptor().getBaseConfig();

        expect(config.provider).toBe(p.getLabel());
        expect(config.delayUpdateActive).toBe(true);

        for (var key in expected[i]) {
          expect(config[key]).toEqual(expected[i][key], `${key}`);
        }
      }
    });
  });

  it('should log errors of all types', function() {
    const p = new GeoPackageProvider();
    const fns = [
      function() {
        p.logError(undefined);
      }, function() {
        p.logError(null);
      }, function() {
        p.logError(new Error('This is only a test error'));
      }, function() {
        p.logError(1234);
      }, function() {
        p.logError('This is only a test message');
      }];

    fns.forEach(function(fn) {
      expect(fn).not.toThrow();
      expect(p.getErrorMessage()).toBeTruthy();
      expect(p.getError()).toBe(true);

      // reset for next
      p.setError(false);
    });
  });

  it('should handle request errors', function() {
    const p = new GeoPackageProvider();
    p.setUrl(baseUrl + 'doesnotexist.gpkg');

    runs(function() {
      p.load();
    });

    waitsFor(function() {
      return !p.isLoading();
    }, 'GeoPackage to load/error', 5000);

    runs(function() {
      expect(p.getError()).toBe(true);
      expect(p.getErrorMessage()).toContain('Request failed');
    });
  });
});
