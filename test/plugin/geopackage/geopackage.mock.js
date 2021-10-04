goog.module('plugin.geopackage.mock');

const {default: Settings} = goog.require('os.config.Settings');
const {default: SettingsObjectStorage} = goog.require('os.config.storage.SettingsObjectStorage');
const {default: ExtDomainHandler} = goog.require('os.net.ExtDomainHandler');
const RequestHandlerFactory = goog.require('os.net.RequestHandlerFactory');
const {default: SameDomainHandler} = goog.require('os.net.SameDomainHandler');

const SettingsUtil = goog.require('test.os.config.SettingsUtil');


beforeEach(() => {
  // Initialize settings
  const settings = Settings.getInstance();
  if (!settings.isLoaded() || !settings.isInitialized()) {
    settings.getStorageRegistry().addStorage(new SettingsObjectStorage(['unit']));
    SettingsUtil.initAndLoad(settings);

    waitsFor(function() {
      return settings.isLoaded() && settings.isInitialized();
    });
  }

  // Register request handlers
  RequestHandlerFactory.addHandler(ExtDomainHandler);
  RequestHandlerFactory.addHandler(SameDomainHandler);
});
