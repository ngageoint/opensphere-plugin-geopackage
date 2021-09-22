## [1.7.8](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.7...v1.7.8) (2021-09-22)


### Bug Fixes

* **import:** sort import statements ([6695306](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/66953065da113f4ffc6ec378a749d8825d4a658a))

## [1.7.7](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.6...v1.7.7) (2021-09-16)


### Bug Fixes

* **goog:** fix module paths ([de48c47](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/de48c47693dc249d9689605ae510ff0deb1bd734))

## [1.7.6](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.5...v1.7.6) (2021-08-25)


### Bug Fixes

* **export:** support bulk export from multiple sources ([4b7b66c](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/4b7b66cee03ae7828b0bbd84ea007a917b9571b3))

## [1.7.5](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.4...v1.7.5) (2021-08-18)


### Bug Fixes

* **import:** provide appropriate types to the compiler ([837d4e3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/837d4e3726a4c168b758a7e6d741e778baac6cde))

## [1.7.4](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.3...v1.7.4) (2021-07-29)


### Bug Fixes

* **tiles:** enables and fixes tile world wrapping ([dd2e6d6](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/dd2e6d637ce58bc15d3976d3be67fd34e3ea6dfb))

## [1.7.3](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.2...v1.7.3) (2021-07-26)


### Bug Fixes

* resolve compiler typing errors ([02c7f8c](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/02c7f8c01ef844503f45ecd27f8c2acb352afd02))

## [1.7.2](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.1...v1.7.2) (2021-07-22)


### Bug Fixes

* **columns:** filters out empty geometry column ([649b319](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/649b31978890b15323e95166b2b8544b9017696e))

## [1.7.1](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.7.0...v1.7.1) (2021-07-19)


### Bug Fixes

* **tile:** don't destructure default exports ([7579fd3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/7579fd373e4d20991e1ae406b375ee5b56113af7))

# [1.7.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.6.2...v1.7.0) (2021-07-13)


### Features

* **deps:** upgrade better-sqlite to support electron 13 prebuilt binaries ([ab9cb35](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/ab9cb3542310b764b6b4bae154d777d82a00fe8e))

## [1.6.2](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.6.1...v1.6.2) (2021-07-08)


### Bug Fixes

* **columns:** create source columns with the same name used by features ([9be0b94](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/9be0b94992da7f71e4ab0c2e0b13afc183ad39a7))

## [1.6.1](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.6.0...v1.6.1) (2021-07-06)


### Bug Fixes

* **tiles:** only zoom to +4 zoom levels ([b7177c1](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/b7177c1a5a257568552e8b6b5debf78164f307ca))
* **tiles:** use tile scaling to support gpkg tiles at all zooms ([b7097cb](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/b7097cb8cdce2c73cf5107b86319c61b7faccfd8))

# [1.6.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.5.3...v1.6.0) (2021-07-02)


### Features

* replace global refs and trigger release ([338cc29](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/338cc29e69392ce5a83b397d3625be6db541002b))

## [1.5.3](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.5.2...v1.5.3) (2021-05-27)


### Bug Fixes

* **worker:** fix path separators in windows electron builds ([d2db7b9](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/d2db7b9c7a749b390f328c213da851206220a922))

## [1.5.2](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.5.1...v1.5.2) (2021-05-26)


### Bug Fixes

* **export:** update export APIs for geopackage-js 4.x ([c52f2de](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/c52f2defdeedf477db7e0c3fc6f042dda6eb686e))

## [1.5.1](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.5.0...v1.5.1) (2021-05-26)


### Bug Fixes

* **sqlite:** downgrade better-sqlite3 to 7.1.2 to fix glibc incompatibility ([3b0a2e3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/3b0a2e34d7ce574993a5e12de3b925d05774ea67))

# [1.5.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.4.0...v1.5.0) (2021-05-25)


### Features

* **tile:** support tile canvas rendering in workers ([5a60501](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/5a6050125eb01a37b0cbf794dbf3fda9c9085802))
* **tiles:** use reprojection/stitching to pull tiles ([d5dc78f](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/d5dc78f46c6cb3764832c70e4753af1faf93bc6d))

# [1.4.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.3.0...v1.4.0) (2021-05-14)


### Bug Fixes

* **provider:** use directiveTag import ([fb12ace](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/fb12ace77215f54274248ac091d0dd3e8a1a9707))


### Features

* **provider:** updates provider to support turning on full gpkg file ([ba93ff3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/ba93ff3988f77cea84380ce491fb0f5a3ee47944))

# [1.3.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.2.0...v1.3.0) (2021-05-05)


### Features

* **export:** adds support for exporting features to a new layer ([f9ba3f2](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/f9ba3f21231c721431eb5c6939c170689fe0e29b))

# [1.2.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.1.3...v1.2.0) (2021-04-22)


### Features

* **gcc:** update compiler and use webpack in tests ([2c68070](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/2c6807077072e686701c775b5fcaad0e5d3eb6fb))

## [1.1.3](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.1.2...v1.1.3) (2021-04-13)


### Bug Fixes

* **map:** don't destructure PROJECTION as it may change ([b9f04e3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/b9f04e3849052437e492ab7a315c0b74914c7e77))

## [1.1.2](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.1.1...v1.1.2) (2021-02-16)


### Bug Fixes

* **goog:** fix logger typing ([ac3f5d6](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/ac3f5d67799d4525f12b3233290d706c7235dca3))

## [1.1.1](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.1.0...v1.1.1) (2020-07-20)


### Bug Fixes

* **electron:** fix native build of canvas by electron-builder ([d0864f8](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/d0864f842ff5ff0894bedfaf96552eb9d602720b))

# [1.1.0](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.0.0...v1.1.0) (2020-07-16)


### Bug Fixes

* **ci:** update docs to trigger build ([db7987d](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/db7987dad9f421a913561e057e0605c87748011e))
* **deps:** roll back semantic-release versions to support older node ([69819ae](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/69819aebe1fabdbf3bef39ed17f4845c58e9c3d6))
* **deps:** roll back semantic-release versions to support older node ([2c7aa8f](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/2c7aa8f5ab6734cf9c9bfc8886d786c18372242e))


### Features

* **deps:** no-op change to trigger release ([6451927](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/6451927359c72832ec44d7202a9243a57f3267d1))

## [1.0.1](https://github.com/ngageoint/opensphere-plugin-geopackage/compare/v1.0.0...v1.0.1) (2020-07-16)


### Bug Fixes

* **deps:** roll back semantic-release versions to support older node ([69819ae](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/69819aebe1fabdbf3bef39ed17f4845c58e9c3d6))
* **deps:** roll back semantic-release versions to support older node ([2c7aa8f](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/2c7aa8f5ab6734cf9c9bfc8886d786c18372242e))

# 1.0.0 (2020-07-16)


### Bug Fixes

* **electron:** Load URLs with spaces from the file system. ([201e470](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/201e4702160571350e69d2921185e1a41b686f8d))
* **export:** add command property to worker message extern ([fed7df2](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/fed7df29f87814213c43fa0870793e03da2cf58c))
* **gpkg:** Cesium needs tileSizes to be entirely defined ([b9822de](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/b9822dec1cbbd96b860798c38dff0615aeea4968))
* **gpkg:** clamp min/max zoom to sane values ([515b92a](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/515b92afb0b496a48d6d9ea241a7099f10853fbb))
* **gpkg:** compute pixel_x_size when not set ([be35cd9](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/be35cd976bbe844ddea7c9d8db5247efa2eb1796))
* **gpkg:** fix hitting EventEmitter cap by using a single tile listener ([540f099](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/540f0998c7b33c486f4ec8d6322a11f2991ec853))
* **gpkg:** fix script loading in electron node context ([7849597](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/784959789f6b7780d0ef480b2a067ccaeec6ca99))
* **gpkg:** fix undefined error ([a12e29e](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/a12e29e580ec5e46049afec3e0a6103552101e54))
* **gpkg:** read tileSizes config option properly ([9f1194d](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/9f1194dd6d17116aaeb87a907cb65f9fc8f61aa3))
* **gpkg:** remove tmp file on export ([2a92c67](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/2a92c67e1431dd3f970350c95c7819f1dd7d38ea))
* **gpkg:** Removed superfluous config-driven check ([5d5bfc7](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/5d5bfc7202c30346666ce4929ce23d2ae95ca489))
* **gpkg:** save gpkgs between sessions ([3289a18](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/3289a181b3a995939e71c3f528331edb41c8b8f4))
* **gpkg:** use blank images for empties ([bb1c497](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/bb1c49763da5081f1b7bc0c12417e32cf24e3246))
* **gpkg:** use undefined path in web version ([d074e54](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/d074e54035776f5043762cae55d53974f69754c7)), closes [#14](https://github.com/ngageoint/opensphere-plugin-geopackage/issues/14)
* **lint:** remove eslint-disable and fix errors ([7fd4fab](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/7fd4fabbe3e0e0fd14a645755cb39232763cc7f2))
* **package:** fix incorrect min.js location for web version ([8e41a55](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/8e41a55bd89897232c896b16ef8ae26fa00e13d9))
* **provider:** should use tableName in ID rather than title ([233340a](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/233340aa15a739afb923d7a1a692ffeb4a08831e))
* **tile:** avoid zoomOffset auto detection from abstract tile config ([f15ca0f](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/f15ca0fd7c7403c98bba54d28c6dbca3f796d6c2))
* **worker:** serialize errors so Electron context isolation doesn't sanitize them ([2186804](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/2186804808a9fc133810a3f7a8df4f583ba817a7))
* **worker:** unindexed date fields should be strings ([8e2e89d](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/8e2e89db0ed4e9263d72b80f8eda41a888647b9d))
* **worker:** update a couple of migrated method names ([5a5605d](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/5a5605d6762d03cf7b509de87b11b7a1e1e7f5e5))
* **worker:** Windows paths should start with drive letter and not the root slash ([c59254f](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/c59254f58f87e7252c3831fdc8cf19c71b1537e9))


### Features

* **electron:** Add Electron preload script to expose Node API's. ([4a9edc4](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/4a9edc4bc2d87fa77fd466076b6f0d8e17692a17))
* **electron:** add native sqlite3 library support ([3fb4d08](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/3fb4d0824cf60fab32ebbf675b66b70326788580))
* **electron:** use extra module path provided by electron ([58cfd68](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/58cfd68e86369bf395b83f27a8f7a9847f3739cd))
* **export:** upgrade to 2.0.0 API ([ee15a3e](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/ee15a3e3ad7419248f8f5f79a1a629e58306237b))
* **features:** upgrade vector features to 2.0.0 api ([a481eee](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/a481eee665e7cc6eb6f6fa982ea77bb27c964081))
* **gcc:** upgrade compiler and library ([115e23e](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/115e23ea1424f3ef5a0104e5aae00b448647b358))
* **gpkg:** add tile layer support ([00b5630](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/00b5630ba87f531a365c6b53fd9ae89dafbdc268))
* **gpkg:** Added feature import/export, improved tile support ([29c99a9](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/29c99a9964fbab92351f6a9747ac4312c028eec6))
* **gpkg:** Added file type detection and import handler ([e149062](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/e149062bca0adad2bcd1855cf572ac1b33dbddb5))
* **gpkg:** geopackage provider impl and tests ([ad5012c](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/ad5012cea0ef7afac53dcd1b66c5ae2d57b1b271))
* **gpkg:** moved gpkg processing to worker ([da855fb](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/da855fbd52f4b57b2ed7fb382665b7491dfa5e67))
* **gpkg:** open, list, tiles from geopackage-js 2.0 ([75135d3](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/75135d3efe3c858357e7173b2f0c46d49f91d8be))
* **gpkg:** support new timeout interface methods ([428f446](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/428f44643ee8203e12afa53e2eef1b7cfd3dc62a))
* **modernizr:** upgrade to latest to close potential security vulnerabilities ([4dacf93](https://github.com/ngageoint/opensphere-plugin-geopackage/commit/4dacf932f3d7e3a28f9d17d1c38a13cd2f025570))
