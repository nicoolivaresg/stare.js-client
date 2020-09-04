/**
 * Test have been written for jest.
 * Docs here: https://jestjs.io/docs/en/getting-started
 */

const stare = require('../lib');

describe('Testing main import function', () => {
  test(`Should fail to get library`, () => {
    expect(() => {
      stare(null, null);
    }).toThrow();
  });

  test(`Should fail to get visualization`, () => {
    expect(() => {
      stare('d3', null);
    }).toThrow();
  });
});

require('./d3.test');
require('./three.test');
