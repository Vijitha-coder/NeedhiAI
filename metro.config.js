const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix MIME type issues for web
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Force JavaScript MIME type for .js files
      if (req.url.endsWith('.js') || req.url.endsWith('.bundle')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      }
      return middleware(req, res, next);
    };
  },
};

module.exports = config;