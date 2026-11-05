import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version: versao } = require('../../package.json');

export { versao };