// os.mock sets up a bunch of basic opensphere APIs, like settings, which are used in our plugin
goog.require('os.mock');
goog.require('plugin.geopackage.GeoPackagePlugin');

describe('plugin.geopackage.GeoPackagePlugin', function() {
  const GeoPackagePlugin = goog.module.get('plugin.geopackage.GeoPackagePlugin');

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
