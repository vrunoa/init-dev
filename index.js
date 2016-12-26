const osHomedir = require('os-homedir')
const fs = require('fs')
const path = require('path')
const semafor = require('semafor')
const inquirer = require('inquirer')
const request = require('request')

class Init {
  constructor () {
    this.home = osHomedir()
    this.logger = semafor()
  }
  getHome () {
    return this.home
  }
  getConfigPath () {
    return path.join(this.getHome(), '.dev.package.json')
  }
  createConfig (path) {
    if (path === undefined) {
      inquirer.prompt([{
        type: 'input',
        name: 'path',
        message: 'Set the path to your .dev.package.json: '
      }]).then((answers) => {
        let configRemotePath = answers['path']
        if (configRemotePath.trim() === '') {
          return this.err('Please set the path to your .dev.package.json!')
        }
        this.createConfig(configRemotePath)
      })
      return
    }
    if(path.indexOf('http') !== -1) {
      downloadConfig(path)
    }
  }
  downloadConfig () {

  }
  showConfig () {
    if (this.configExists() === false) {
      this.err('You havent config your .dev.package.json yet! Run initDev --config')
    }
    this.readConfig()
  }
  readConfig () {

  }
  configExists () {
    try {
      let stat = fs.statSync(this.getConfigPath())
      console.log(stat)
    } catch (e) {
      return false
    }
  }
  runConfig () {

  }
  install () {
    if (this.configExists() === false) {
      this.createConfig()
    }
  }
  err (msg) {
    this.logger.fail(msg)
    process.exit(1)
  }
}

module.exports = { Init }
