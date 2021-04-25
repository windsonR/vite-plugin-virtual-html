# vite-plugin-virtual-html

## Why

this plugin use `configureServer` Hook to intercept html request.

## features 

+ allow you put your html file anywhere in your project(like Webpack's plugin `html-webpack-plugin`)
  + when you run in dev,it will intercept html requests,and response with the configuration you set.
  + when you run build, it will simply copy all the html file under dist's sub-folder to dist.
+ auto config `build.rollupOptions.input` from pages

## Usage

`yarn add vite-plugin-virtual-html --dev # npm install vite-plugin-virtual-html -D`

Add it to `vite.config.js`

``` js
// vite.config.js
const virtualHtml = require('vite-plugin-virtual-html')

const pages = {
    index: '/src/index/index.html'
}

module.exports = {
  plugins: [virtualHtml(pages,'index')],
}
```

## Configuration

### pages
config your project's all html file's path

it will be used for:
+ dev mode, it will intercept your html request, and response with html file in this config
+ build mode, inject into `build.rollupOptions.input`
+ build mode, it will copy html file from you set in this config under dist,and delete the useless folder which store html file.
```
{ 
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}
```

### indexPage

config the index page

Ex. when you open `http://localhost:3000`, your project's root dir has no  `index.html` file, then browser will show `404`.

now, if you set this, plugin will intercept `/` request, and response with page you set.

Like this: 
when you set `indexPage` to `demo1.html`,then you access `http://localhost:3000` in browser, it will show the `/demo1.html` page. 

it equals to access `http://localhost:3000/demo1.html`.
