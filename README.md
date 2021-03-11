# vite-plugin-virtual-html

## Usage

- run `yarn add vite-plugin-virtual-html --dev`
- add the plugin into `vite.config.js`
``` js
// vite.config.js
const virtualHtml = require('vite-plugin-virtual-html')

module.exports = {
  plugins: [virtualHtml({pages,index})],
}
```

## 功能

在dev时,拦截html请求,并将配置的pages中对应的html返回给浏览器.
在build时,将dist/src目录下的所有html文件直接复制到dist目录.

## 参数
### pages
pages用于存放页面路径
```
{ 
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}
```
### index
配置index页面.
例如,在打开`http://localhost:3000/`时,若项目根目录没有`index.html`,浏览器则会出现404错误
即,这个配置是实现
`/` => `/index.html`
