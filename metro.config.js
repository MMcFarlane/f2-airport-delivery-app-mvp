const { ServerResponse } = require('node:http');
const { getDefaultConfig } = require('expo/metro-config');

// Expo serves the web document before Metro middleware, so those responses
// never see enhanceMiddleware. SQLite on web needs these headers on the document.
const setHeader = ServerResponse.prototype.setHeader;
ServerResponse.prototype.setHeader = function (name, value) {
  if (!this.headersSent && !this.coopHeadersSet) {
    this.coopHeadersSet = true;
    setHeader.call(this, 'Cross-Origin-Embedder-Policy', 'credentialless');
    setHeader.call(this, 'Cross-Origin-Opener-Policy', 'same-origin');
  }
  return setHeader.call(this, name, value);
};

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhancedMiddleware = enhanceMiddleware ? enhanceMiddleware(middleware, metroServer) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
