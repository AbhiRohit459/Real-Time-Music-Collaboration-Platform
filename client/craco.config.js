const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove source-map-loader to avoid errors
      webpackConfig.module.rules = webpackConfig.module.rules.filter((rule) => {
        if (rule.use && Array.isArray(rule.use)) {
          return !rule.use.some((use) => 
            use.loader && use.loader.includes('source-map-loader')
          );
        }
        return true;
      });
      
      // Configure resolve to prefer CommonJS over ES modules
      webpackConfig.resolve.mainFields = ['browser', 'main'];
      
      // Don't use 'import' condition to avoid ES modules
      if (!webpackConfig.resolve.conditionNames) {
        webpackConfig.resolve.conditionNames = ['require', 'node', 'default'];
      } else {
        webpackConfig.resolve.conditionNames = webpackConfig.resolve.conditionNames.filter(
          name => name !== 'import'
        );
      }
      
      // Disable exports field resolution to avoid ES modules
      webpackConfig.resolve.exportsFields = [];
      
      // Use CommonJS build of socket.io-client instead of ES modules
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'socket.io-client': path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs/index.js'),
        // Redirect ALL ES module paths to CJS versions
        'socket.io-client/build/esm': path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs'),
        'socket.io-client/build/esm/index.js': path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs/index.js'),
        'socket.io-client/build/esm/manager.js': path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs/manager.js'),
        'socket.io-client/build/esm/url.js': path.resolve(__dirname, 'node_modules/socket.io-client/build/cjs/url.js'),
      };
      
      // Use NormalModuleReplacementPlugin to replace ES module files - must be early
      if (!webpackConfig.plugins) {
        webpackConfig.plugins = [];
      }
      // Add at the beginning to ensure it runs first
      webpackConfig.plugins.unshift(
        new webpack.NormalModuleReplacementPlugin(
          /socket\.io-client[\/\\]build[\/\\]esm/,
          (resource) => {
            resource.request = resource.request.replace(
              /socket\.io-client[\/\\]build[\/\\]esm/g,
              'socket.io-client/build/cjs'
            );
          }
        )
      );
      
      // Add a rule to completely ignore ES module files from socket.io-client
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
      if (oneOfRule) {
        // Add a rule at the very beginning to ignore ES module files - must be first
        // This must come before any babel-loader rules
        oneOfRule.oneOf.unshift({
          test: /\.(js|mjs)$/,
          include: [
            /node_modules[\/\\]socket\.io-client[\/\\]build[\/\\]esm/,
            path.resolve(__dirname, 'node_modules/socket.io-client/build/esm')
          ],
          use: {
            loader: 'ignore-loader'
          }
        });
        
        // Also modify the JS rule to exclude ES modules
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.test && rule.test.toString().includes('jsx?')) {
            const originalExclude = rule.exclude;
            rule.exclude = (modulePath) => {
              // Exclude socket.io-client ES module build directory
              if (modulePath && /node_modules[\\/]socket\.io-client[\\/]build[\\/]esm/.test(modulePath)) {
                return true;
              }
              if (typeof originalExclude === 'function') {
                return originalExclude(modulePath);
              }
              if (Array.isArray(originalExclude)) {
                return originalExclude.some(exp => {
                  if (exp instanceof RegExp) return exp.test(modulePath);
                  if (typeof exp === 'function') return exp(modulePath);
                  return false;
                });
              }
              return originalExclude;
            };
          }
        });
      }
      
      return webpackConfig;
    },
  },
};

