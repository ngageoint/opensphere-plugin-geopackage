goog.require('plugin.geopackage.GeoPackagePlugin');
goog.require('plugin.geopackage.mock');

describe('plugin.geopackage.GeoPackagePlugin', function() {
  const {GeoPackagePlugin} = goog.module.get('plugin.geopackage.GeoPackagePlugin');

  it('should have the proper ID', function() {
    expect(new GeoPackagePlugin().id).toBe('geopackage');
  });

  it('should not throw an error', function() {
    const fn = function() {
      const p = new GeoPackagePlugin();
      p.init();
    };

    expect(fn).not.toThrow();
  });
});
