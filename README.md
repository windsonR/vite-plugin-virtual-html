# vite-plugin-virtual-html

## Usage

- run `yarn add vite-plugin-virtual-html --dev`
- add the plugin into `vite.config.js`
``` js
// vite.config.js
const virtualHtml = require('vite-plugin-virtual-html')

module.exports = {
  plugins: [virtualHtml({})],
}
```

## 功能

在dev时,拦截html请求,并将配置的pages中对应的html返回给浏览器.
在build时,将dist/src目录下的所有html文件直接复制到dist目录.

## 传入virtualHtml的参数pages,形式如下:
```
{ 
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}
```
