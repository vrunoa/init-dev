#!/usr/bin/env node
const argv = require('minimist')(process.argv.slice(2))
const Init = require('./index.js').Init
const cli = new Init()
if (argv.info) {
  cli.showConfig()
} else if (argv.config) {
  cli.createConfig()
} else {
  cli.install()
}
