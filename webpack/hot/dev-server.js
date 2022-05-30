
hotEmitter.on('webpackHotUpdate', () => {
  if (!lastHash) {
    // 如果没有lastHash 说明没有上一次的编译结果，说明是第一次编译
    lastHash = currentHash
    return
  }
  // 调用hot.check方法想服务器检查更新并且拉取最新的代码
  module.hot.check()
})