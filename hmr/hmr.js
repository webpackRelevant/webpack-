class EventEmitter {
  constructor() {
    this.events = {}
  }

  on(eventName, fn) {
    this.events[eventName] = fn
  }

  emit(eventName, ...args) {
    this.events[eventName](...args)
  }
}

let hotEmitter = new EventEmitter()
let currentHash
let lastHash
;(function (modules) {
  // 存放模块的缓存
  const installedModules = {}

  // 下载hotManifest文件，并根据其内容下载updateChunk内容
  function hotCheck() {
    debugger
    console.log('hotCheck')
    // {"h": "dfe8f2596a66fff7c3a6","c": {"main": true}}
    hotDownloadManifest()
      .then((update) => {
        let chunkIds = Object.keys(update.c)
        chunkIds.forEach((chunkId) => {
          hotDownloadUpdateChunk(chunkId)
        })
        lastHash = currentHash
      })
      .catch(() => {
        window.location.reload()
      })
  }
  
  // 加载代码更新后的chunk内容
  function hotDownloadUpdateChunk(chunkId) {
    console.log('chunkId', chunkId)
    let script = document.createElement('script')
    script.src = `${__webpack_require__.p}${chunkId}.${lastHash}.hot-update.js`
    document.head.appendChild(script)
  }

  window.webpackHotUpdate = function webpackHotUpdate(chunkId, moreModules) {
    debugger
    hotAddUpdateChunk(chunkId, moreModules)
  }

  let hotUpdate = {}
  // 更新modules中对应你moduleId的模块内容
  // {'main': function() { eval()}}
  function hotAddUpdateChunk(chunkId, moreModules) {
    for (let moduleId in moreModules) {
      // 使用新模块内容替换modules中的旧模块内容，使用hotUpdate记录需要更新的模块
      modules[moduleId] = hotUpdate[moduleId] = moreModules[moduleId]
    }
    hotApply()
  }

  function hotApply() {
    for (let moduleId in hotUpdate) {
      let oldModule = installedModules[moduleId] // 老模块
      delete installedModules[moduleId] // 把老模块从模块缓存中删掉
      // 循环它所有的父模块
      oldModule.parents.forEach((parentModule) => {
        // 取出父模块上的回调，如果有就执行
        let cb = parentModule.hot._acceptedDependencies[moduleId]
        // 执行module.hot.accept的回调
        // cd = render
        typeof cb === 'function' && cb()
      })
    }
  }

  // 下载更新描述文件
  function hotDownloadManifest() {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest()
      let url = `${__webpack_require__.p}${lastHash}.hot-update.json`
      xhr.open('get', url)
      xhr.responseType = 'json'
      xhr.onload = function () {
        resolve(xhr.response)
      }
      xhr.send()
    })
  }

  // 创建module.hot对象
  function hotCreateModule() {
    let hot = {
      _acceptedDependencies: {}, // 每个模块私有的
      accept(deps, callback) {
        if (typeof deps === 'string') {
          deps = [deps]
        }
        // hot._acceptedDependencies['./title'] = render
        deps.forEach((dep) => (hot._acceptedDependencies[dep] = callback))
      },
      check: hotCheck,
    }

    return hot
  }

  // parentModuleId父模块ID
  function hotCreateRequire(parentModuleId) {
    // ../src/main.js
    // 如果缓存里没有此父模块对象，说明这是一个顶级模块，没有父亲
    if (!parentModuleId) return __webpack_require__
    // 因为要加载子模块的时候，父模块肯定加载过了，可以从缓存中通过父模块的ID拿到父模块的对象
    let parentModule = installedModules[parentModuleId]

    let hotRequire = function (childModuleId) {
      // src/title.js
      parentModule.children.push(childModuleId) // 把此模块ID添加到父模块对象的children里
      __webpack_require__(childModuleId) // 如果require过了，会把子模块对象放到缓存
      let childModule = installedModules[childModuleId] // 取出子模块对象
      childModule.parents.push(parentModule)
      return childModule.exports
    }

    return hotRequire
  }

  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId]
    }
    let module = (installedModules[moduleId] = {
      // 创建一个新的模块对象并且放入缓存中
      i: moduleId, // 模块ID 也就是模块标识符
      l: false, // loaded 是否已经加载
      exports: {}, // 导出对象
      parents: [], // 当前模块的父模块数组
      children: [], // 当前模块的子模块数组
      hot: hotCreateModule(),
    })

    // 执行模块代码给module.exports赋值
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      hotCreateRequire(moduleId),
    )
    module.l = true
    return module.exports
  }

  __webpack_require__.c = installedModules

  __webpack_require__.p = '../dist/';

  return hotCreateRequire()('./src/main.js')
})({
  'webpack-dev-server/client/index.js': function (module, exports, require) {
    // 1.连接websocket服务器
    const socket = window.io('/')
    socket.on('hash', (hash) => {
      currentHash = hash
    })

    socket.on('ok', () => {
      console.log('ok')
      reloadApp()
    })

    function reloadApp() {
      hotEmitter.emit('webpackHotUpdate')
    }
  },
  'webpack/hot/dev-server.js': function (module, exports) {
    hotEmitter.on('webpackHotUpdate', () => {
      if (!lastHash) {
        // 如果没有lastHash 说明没有上一次的编译结果，说明是第一次编译
        lastHash = currentHash
        return
      }
      // 调用hot.check方法想服务器检查更新并且拉取最新的代码
      module.hot.check()
    })
  },
  './src/main.js': function (module, exports, require) {
    // 监听webpackHotUpdate事件
    require('webpack/hot/dev-server.js')
    // 连接websocket服务器，如果服务器发给我hash 我就保存到currentHash里
    require('webpack-dev-server/client/index.js')

    let input = document.createElement('input')
    document.body.appendChild(input)

    let div = document.createElement('div')
    document.body.appendChild(div)

    function render() {
      let name = require('./src/name.js')
      let title = require('./src/title.js')
      const app = `${name}_${title}`
      div.innerHTML = app
    }

    render()

    if (module && module.hot) {
      module.hot.accept(['./src/title.js', './src/name.js'], render)
    }
  },
  './src/name.js': function (module, exports, require) {
    const name = 'name'

    const btn = document.getElementById('btn')
    btn.addEventListener('click', () => {
      alert(8)
    })

    module.exports = name
  },
  './src/title.js': function (module, exports, require) {
    const title = 'title'

    module.exports = title
  },
})
