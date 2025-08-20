// Polyfills for jsdom compatibility
const { TextEncoder, TextDecoder } = require('util');

// Set up global polyfills before any modules load
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Request: global.Request || class Request {},
  Response: global.Response || class Response {},
  Headers: global.Headers || class Headers {},
});

// Additional Web API polyfills for jsdom
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// URL polyfill if needed
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
}

// Performance API
if (typeof global.performance === 'undefined') {
  global.performance = require('perf_hooks').performance;
}