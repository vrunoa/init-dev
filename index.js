const osHomedir = require('os-homedir')
const fs = require('fs')
const path = require('path')
const semafor = require('semafor')
const inquirer = require('inquirer')
const request = require('request')
const pkgDir = require('pkg-dir')
const childProcess = require('child_process')
const spawn = childProcess.spawn

class Init {
  constructor () {
    this.home = osHomedir()
    this.logger = semafor()
    this.homeEnv = pkgDir.sync(process.cwd())
    this.pkgEnv = path.join(this.homeEnv, 'package.json')
    this.pkgHome = path.join(pkgDir.sync(__dirname), 'package.json')
  }
  showVersion () {
    let json = require(this.pkgHome)
    this.logger.log(json['version'])
  }
  getHome () {
    return this.home
  }
  getPackageHome (cwd) {
    return this.pkgEnv
  }
  getConfigPath () {
    return path.join(this.getHome(), '.dev.package.json')
  }
  createConfig () {
    if (this.configExists() === true) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'override',
        message: 'A .dev.package.json already exists. Do you want to override it?',
        default: false
      }]).then((answers) => {
        if (answers.override === false) {
          this.logger.warn('You can see your .dev.package.json info using: initDev --info')
        } else {
          this.askPath()
        }
      })
      return
    } else {
      this.askPath()
    }
  }
  askPath (configRemotePath) {
    if (configRemotePath === undefined) {
      inquirer.prompt([{
        type: 'input',
        name: 'path',
        message: 'Set the path to your .dev.package.json: '
      }]).then((answers) => {
        configRemotePath = answers['path']
        if (configRemotePath.trim() === '') {
          return this.err('Please set the path to your .dev.package.json!')
        }
        this.askPath(configRemotePath)
      })
      return
    }
    if (configRemotePath.indexOf('http') === 0) {
      this.downloadConfig(configRemotePath)
    } else {
      this.readLocalConfig(configRemotePath)
    }
  }
  readLocalConfig (localUri) {
    try {
      let stat = fs.statSync(localUri)
      if (stat.isFile() === false) {
        return this.err(`Error reading local file ${localUri}`)
      }
      fs.readFile(localUri, (err, data) => {
        if (err) {
          return this.err(err)
        }
        try {
          let config = JSON.parse(data + '')
          this.createConfigFile(localUri, config)
        } catch (e) {
          this.logger.warn(data + '')
          return this.err('Error parsing .dev file, make sure your file is a valid json array')
        }
      })
    } catch (e) {
      return this.err(`Error reading local file ${localUri}`)
    }
  }
  downloadConfig (remoteUri) {
    request.get(remoteUri, (err, response, body) => {
      if (err) {
        return this.err(err)
      }
      if (response.statusCode !== 200) {
        return this.err(`Error downloading .dev.package.json file ${remoteUri}`)
      }
      this.createConfigFile(remoteUri, JSON.parse(body))
    })
  }
  createConfigFile (configRemote, modules) {
    let configPath = this.getConfigPath()
    let config = {
      'config_path': configRemote,
      'modules': modules
    }
    fs.writeFile(configPath, JSON.stringify(config), (err) => {
      if (err) {
        return this.err(err)
      }
      this.logger.ok(`Config file created: ${configPath}. You can run initDev --install on your new projects`)
      this.showConfig()
    })
  }
  showConfig () {
    if (this.configExists() === false) {
      this.err('You havent config your .dev.package.json yet! Run initDev --config')
    }
    fs.readFile(this.getConfigPath(), (err, data) => {
      if (err) {
        return this.err(err)
      }
      let config = JSON.parse(data + '')
      this.logger.log(`Remote: ${config.config_path}`)
      this.logger.log(`\nModules:`)
      const spaces = '  '
      for (let i in config.modules) {
        let module = config.modules[i]
        this.logger.log(`└─ ${module.module}`)
        if (module.tasks !== undefined) {
          this.logger.log(`${spaces}${spaces}└─ Tasks:`)
          for (let t in module.tasks) {
            let task = module.tasks[t]
            this.logger.log(`${spaces}${spaces}${spaces}└─ ${t} - ${task}`)
          }
        }
        if (module.extend !== undefined) {
          this.logger.log(`${spaces}${spaces}└─ Extend:`)
          let extendString = JSON.stringify(module.extend)
          this.logger.log(`${spaces}${spaces}${spaces}${extendString}`)
        }
        this.logger.log(`\n`)
      }
    })
  }
  configExists () {
    try {
      let stat = fs.statSync(this.getConfigPath())
      return stat.isFile()
    } catch (e) {
      return false
    }
  }
  install () {
    if (this.configExists() === false) {
      return this.err('You havent config your .dev.package.json yet! Run initDev --config')
    }
    fs.readFile(this.getConfigPath(), (err, data) => {
      if (err) {
        return this.err(err)
      }
      let config = JSON.parse(data)
      this.logger.log('Installing dev modules, this may take a while!')
      this.installModule(config.modules, this.clone(config.modules))
    })
  }
  clone (obj) {
    return JSON.parse(JSON.stringify(obj))
  }
  addExtras (modules) {
    if (modules.length === 0) {
      this.logger.ok('Done!')
      process.exit(0)
    }
    let module = modules.shift()
    let tasks = module.tasks
    let pkgEnv = this.getPackageHome()
    let extend = module.extend
    if (tasks !== undefined) {
      let json = require(pkgEnv)
      json = this.addTasks(json, tasks)
      this.writePackage(json, pkgEnv)
    }
    if (extend !== undefined) {
      let json = require(pkgEnv)
      json = this.extend(json, extend)
      this.writePackage(json, pkgEnv)
    }
    this.addExtras(modules)
  }
  installModule (all, modules) {
    if (modules.length === 0) {
      this.logger.ok('Dev modules installed')
      this.logger.ok('Adding tasks & extend to package.json')
      this.addExtras(all)
      return
    }
    let module = modules.shift()
    this.logger.log(`Installing module: ${module.module}`)
    let child = spawn('npm', ['install', '--prefix', this.homeEnv, '--save-dev', module.module])
    let obj = this
    child.stdout.on('data', function (data) {
      obj.logger.log(' ' + data)
    })
    child.stderr.on('data', function (data) {
      obj.logger.warn('' + data)
    })
    child.on('close', function (code) {
      obj.installModule(all, modules)
    })
  }
  writePackage (json, pkgEnv) {
    let jsonString = JSON.stringify(json, null, '  ')
    console.log(jsonString)
    fs.writeFileSync(pkgEnv, jsonString)
  }
  extend (json, extend) {
    return Object.assign(json, extend)
  }
  addTasks (json, tasks) {
    json['scripts'] = json['scripts'] || {}
    for (let key in tasks) {
      if (json['scripts'][key] === undefined) {
        json['scripts'][key] = tasks[key]
      } else {
        json['scripts'][key] = json['scripts'][key] + ' && ' + tasks[key]
      }
    }
    return json
  }
  err (msg) {
    this.logger.fail(msg)
    process.exit(0)
  }
  help () {
    this.logger.log('Usage: initDev [--config | --info | --install | --version]')
  }
}

module.exports = { Init }
