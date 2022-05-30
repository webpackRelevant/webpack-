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