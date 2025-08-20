const { TestEnvironment } = require('jest-environment-jsdom').default || require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

class CustomJSDOMEnvironment extends TestEnvironment {
  constructor(...args) {
    // Set up polyfills before calling super
    if (typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = TextEncoder;
      global.TextDecoder = TextDecoder;
    }
    
    super(...args);
    
    // Additional setup after JSDOM is created
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    
    // Add other necessary polyfills
    if (typeof this.global.structuredClone === 'undefined') {
      this.global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
    }
    
    if (typeof this.global.performance === 'undefined') {
      this.global.performance = require('perf_hooks').performance;
    }
  }
}

module.exports = CustomJSDOMEnvironment;