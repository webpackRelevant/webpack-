const webpack = require('webpack')

// 配置对象
const config = require('../webpack.config')
const Server = require('./server/Server')

// 编译器对象
const compiler = webpack(config)
// 服务器端的核心逻辑在Server中
const server = new Server(compiler)

const { port = 9090, host = 'localhost' } = config.devServer || {}
server.listen(port, host, () => {
  console.log('服务已经在9090端口上使用！')
})
