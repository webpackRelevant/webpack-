
let input = document.createElement('input')
document.body.appendChild(input)

let div = document.createElement('div')
document.body.appendChild(div)

function render() {
  let name = require('./name.js')
  let title = require('./title.js')
  const app = `${name}_${title}`
  div.innerHTML = app
}

render()

if(module && module.hot) {
  module.hot.accept(['./title.js', './name.js'], render)
}