
热更新流程：
服务器
1、向入口文件中注入两个文件 webpack-dev-server/client/index.js文件webpack/hot/dev-server.js文件，这两个文件用来监听服务端发送的websocket事件
2、添加钩子 监听编译完成done事件，每次编译完成后，会向所有客户端发送hash和ok事件
3、以watch模式启动编译
4、创建http服务器，用来响应http请求
5、创建websocket服务器，当有新的客户端连接时，将客户端socket收集起来
6、调用listen方法监听端口


客户端
1、创建websocket客户端，监听服务器发送的hash和ok事件
2、监听到ok事件后，会下载[hash].hot-update.json文件，获取有哪些模块发生了改变
3、得知发生改变的模块信息后，会下载[chunkId].[hash].hot-update.js文件，获取变更后的模块内容,并将js文件添加head标签中
4、hot-update.js文件实际上是一个webpackHotUpdate的函数调用
5、调用webpackHotUpdate函数，通过chunkId找到其父模块，调用父模块中调accept方法中收集到的回调函数,实现页面更新
