# vite-plugin-virtual-html

## Motivation

vite's [MPA](https://vitejs.dev/guide/build.html#multi-page-app) unlike `@vue/cli`'s `pages` option have a configuration in dev mode.

vite's html file need to place in project's root to have same behavior in dev and production mode, it makes your project's root dir looks chaotic.

And if you follow vite's MPA, put other file in other directory, unlike `index.html`, you need useless middle directory(Ex. from vite's MPA doc `http://localhost:3000/nested/nested.html`) to located it.

so, i write this plugin to make vite's MPA more configurable and in dev mode or production has same behavior.

this plugin use vite's `configureServer` Hook to intercept html request and response the html content requested from browser.

## features 

+ allow you put your html file anywhere in your project(like `@vue/cli`'s `pages`)
  + when you run in dev,it will intercept html requests,and response with the html content which you set in `pages`.
  + when you run build, it will copy files(reading config from `pages` options) under dist's sub-folder to dist folder, and then delete the rest html file.
+ auto config `build.rollupOptions.input` from pages
+ if your html do not have a module script import. plugin will try to add a js/ts script import using the html file's name.

## Usage

`yarn add vite-plugin-virtual-html --dev # npm install vite-plugin-virtual-html -D`

Add it to `vite.config.js`

``` js
// vite.config.js
const virtualHtml = require('vite-plugin-virtual-html')

const pages = {
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}

module.exports = {
  plugins: [virtualHtml({
  pages,
  indexPage: 'login'
  })],
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
when you set `indexPage` to `login`,then you access `http://localhost:3000` in browser, it will show the `/login.html` page. 

it equals to access `http://localhost:3000/login.html`.
