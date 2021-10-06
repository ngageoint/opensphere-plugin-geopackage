goog.require('plugin.geopackage');

describe('plugin.geopackage', () => {
  const {fixResolutions} = goog.module.get('plugin.geopackage');

  it('fixes resolutions arrays for OpenLayers', () => {
    // Fills in values using a default zoom factor if only one value is defined.
    const onlyFirst = [null, undefined, 250, undefined, null];
    const onlyFirstExpected = [1000, 500, 250, 125, 62.5];
    fixResolutions(onlyFirst);

    expect(onlyFirst.length).toBe(5);
    onlyFirst.forEach((value, idx, arr) => {
      expect(value).toBe(onlyFirstExpected[idx]);
    });

    // Fills in values using a computed zoom factor if multiple values are defined.
    const firstAndSecond = [null, 2700, undefined, 300, null];
    const firstAndSecondExpected = [8100, 2700, 900, 300, 100];
    fixResolutions(firstAndSecond);

    expect(firstAndSecond.length).toBe(5);
    firstAndSecond.forEach((value, idx, arr) => {
      expect(value).toBe(firstAndSecondExpected[idx]);
    });
  });
});
