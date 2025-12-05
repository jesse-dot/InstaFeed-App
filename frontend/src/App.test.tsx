import React from 'react';

// Simple smoke tests
describe('Types', () => {
  it('should export types module', () => {
    const types = require('./types');
    expect(types).toBeDefined();
  });
});

describe('Basic React', () => {
  it('should import React', () => {
    expect(React).toBeDefined();
    expect(React.createElement).toBeDefined();
  });

  it('should have version', () => {
    expect(React.version).toBeDefined();
  });
});
