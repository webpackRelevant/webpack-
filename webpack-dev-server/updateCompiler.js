const path = require('path')
/**
 * 为了实现客户端与服务器端通信，需要往入口里多注入两个文件
 * (webpack)-dev-server/client/index.js
 * (webpack)/hot/dev-server.js
 * ./src/index.js
 * @param {*} compiler 
 */
function updateCompiler(compiler) {
  const config = compiler.options

  const injectEntry = [
    path.resolve(__dirname, './client/index.js'),
    path.resolve(__dirname, './hot/dev-server.js')
  ]

  oldEntry = Array.isArray(config.entry) ? config.entry : [config.entry]

  config.entry = {
    main: [...injectEntry, ...oldEntry]
  }
}

module.exports = updateCompiler