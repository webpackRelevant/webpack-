const express = require('express')
const http = require('http')
const mime = require('mime')
const path = require('path')
// const MemoryFs = require('memory-fs')
const fs = require('fs-extra')
fs.join = path.join

const socketIO = require('socket.io')
const updateCompiler = require('../updateCompiler')

class Server {
  constructor(compiler) {
    // 保存编译器对象
    this.compiler = compiler
    this.currentHash // 当前的hash值，每次编译都会产生一个hash值
    this.clientSocketList = [] // 存放着所有的通过websocket连接到服务器的客户端

    updateCompiler(compiler) // 向打包入口文件列表中注入webpack/dev-server.js文件和client/index.js文件
    this.setupHooks() // 建立钩子,编译完成后向客户端发送hash和ok事件
    this.setupApp() // 创建app应用 并赋值给this.app
    this.setupDevMiddleware() // 以watch模式启动编译，并实现一个中间件赋值给this.middleware 该中间件用来响应客户端对于产出文件的请求
    this.routes() // 通过this.app和this.middleware中间件来配置路由 
    this.createServer() // 创建http服务器
    this.createSocketServer() // 创建socket服务器 webpack重新编译后用来向客户端发送hash和ok事件
  }

  createSocketServer() {
    // websocket协议握手需要依赖http服务器
    const io = socketIO(this.server);
    io.on('connection', (socket) => {
      console.log('一个新的客户端已经连接上了');
      this.clientSocketList.push(socket) // 收集客户端的socket
      socket.emit('hash', this.currentHash)
      socket.emit('ok')
      // 如果此客户端断开连接，要把这个客户端删掉
      io.on('disconnect', () => {
        const index = this.clientSocketList.findIndex(cocket)
        this.clientSocketList.splice(index, 1)
        console.log('一个客户端断开连接了');
      })
    })
  }

  routes() {
    let { compiler } = this
    // let config = compiler.options
    // const path = config.output.path
    const staticPath = path.resolve(__dirname, '../../')
    this.app.use(this.middleware(staticPath))
  }

  setupDevMiddleware() {
    // this.middleware是一个中间件函数
    this.middleware = this.webpackDevMiddleware() // 返回一个express中间件

  }

  webpackDevMiddleware() {
    const { compiler } = this
    // 以监听模式启动编译，如果以后文件发生变更了，会重新编译
    compiler.watch({
      ignored: [
        'dist',
        'node_modules',
        'hmr',
        'webpack',
        'webpack-dev-server',
        'webpack-dev-serrver_node_modules'
      ]
    }, () => {
      console.log('监听模式的编译成功')
    })
    // let fs = new MemoryFs() // 内存文件实例
    // 以后打包后文件写入内存文件系统，读的时候也从内存文件系统中读取
    this.fs = compiler.outputFileSystem = fs

    // 返回一个中间件，用来响应客户端对于产出文件的请求 index.html main.js .json .js
    return (staticDir) => {
      return (req, res, next) => {
        let {url} = req // 得到请求路径
        if (url === '/favicon.ico') {
          return res.sendStatus(404)
        }
        url === '/' ? url = '/index.html' : null
        let filePath = path.join(staticDir, url) // 得到要访问的静态路径 /index.html /main.js
        try {
          // 返回此路径上的文件的描述对象
          let statObj = this.fs.statSync(filePath)
          if (statObj.isFile()) {
            let content = this.fs.readFileSync(filePath) // 读取文件内容
            res.setHeader('Content-Type', mime.getType(filePath)) // 设置响应头 告诉此浏览器此文件内容是什么
            res.send(content) // 把内容发送给浏览器
          }
        } catch (error) {
          return res.sendStatus(404)
        }
      }
    }
  }

  setupHooks() {
    const {compiler} = this
    // 监听编译完成事件，当编译完成之后，会调用此钩子函数
    compiler.hooks.done.tap('webpack-dev-server', (stats) => {
      // stats是一个描述对象，里面放着打包后的结果hash chunkHash contentHash
      console.log('hash', stats.hash)
      this.currentHash = stats.hash
      // 会向所有的客户端进行广播， 告诉客户端我已经编译成功了，新的模块代码已经产生，快来拉我的新代码
      this.clientSocketList.forEach(socket => {
        socket.emit('hash', this.currentHash) // 把最新的hash值  发给客户端
        socket.emit('ok') // 给客户端发送一个ok
      })
    })
  }

  setupApp() {
    this.app = express(); // 执行express函数得到this.app 代表http应用对象
  }

  createServer() {
    // 通过http模块，创建一个普通的http服务器
    this.server = http.createServer(this.app)
  }

  listen(port, host, callback) {
    this.server.listen(port, host, callback)
  }
}

module.exports = Server