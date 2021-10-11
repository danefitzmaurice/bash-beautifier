require('module-alias/register');

const isDevMode = atom.inDevMode();
const hasTranspiler = !!require.resolve('atom-ts-transpiler');

if (hasTranspiler) {
  module.exports = require('./lib/main.ts');
} else {
  module.exports = require('./dist/main.js');
}
