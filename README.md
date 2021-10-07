# vite-plugin-virtual-html

[中文文档](./README_ZH.md)

## Motivation

Much like `@vue/cli`'s `pages` option, vite's [MPA](https://vitejs.dev/guide/build.html#multi-page-app) option can be configured in dev mode. However, there are some restrictions:

Vite's html files need to be placed in the project's root folder in order to have the same behavior in dev and production mode. This makes your project's root directory look chaotic.

And if you follow vite's documentation for creating a MPA and put a file in another directory, a (useless) middle directory is needed to locate it (see [Multi-Page App](http://localhost:3000/nested/nested.html)).

Therefore I wrote this plugin to make vite's MPA more configurable while conserving the same behavior in dev and production mode.

This plugin uses vite's `configureServer` hook to intercept html requests and eventually return a response with the html content requested from browser.

## Features 

+ Allows you to put your html files anywhere in your project (like `@vue/cli`'s `pages`)
  + when you run dev, it will intercept html requests and provide a response with the html content which you set in `pages`.
  + when you run build, it will copy the files configured in the `pages` options from the dist's sub-folder to dist folder, and then delete the html file.
+ This plugin wil automaticaly configure the `build.rollupOptions.input` from vite using the `pages` object
+ If the provided html files do not have a module script import, the plugin will try to add a js/ts script import using the html file's name.

## Usage

`yarn add vite-plugin-virtual-html --dev`

Or:

`npm install vite-plugin-virtual-html -D`

Add it to `vite.config.js`

``` js
// vite.config.js
const virtualHtml = require('vite-plugin-virtual-html')

const pages = {
  index: '/src/index/index.html',
  login: '/src/login/login.html',
}

module.exports = {
  plugins: [
    virtualHtml({
      pages,
      indexPage: 'login'
    })
  ],
}
```

## Configuration

### pages

Configure the paths to all of your project's html files.

It will be used for:

+ dev mode: It will intercept your html request and return a response with the content of the html file from this config.
+ build mode: inject into `build.rollupOptions.input`
+ build mode: It will copy the html file(s) set in this config to the `dist` folder and delete the (useless) folder(s) which store(s) the html file(s).
+ If you want to use a template system (like `ejs`), you can send an object to the `render` function, which contains `html` and `data` to render. By default the `render` function will simply return the html content of the html template. But if vite's `render` function returns a render function from a template system you include, then the html template will be generated according to the workings of the chosen template system (e.g. if you use partials, the path to those partials will be resolved and their content integrated into the html template). Please have a 

```
// Configure the `pages` object
pages: { 
  index: '/src/index/index.html',
  login: {
    html: '/src/login/login.html', // if there is no data param, html must not have any template content
  },
  login1: {
    html: '/src/login1/login1.html', 
    data: {
      users: ['a', 'b', 'c']
    }
  }
},

// Confgiure the `indexPage`option by assinging it a key of a page defined in `pages`:
indexPage: 'login1',

// Configure the render function to render the input according to the rules of a template system
// Here `ejs` is used. It must be imported on top of the file (`import ejs form `ejs`). The example
// shows how vite's `render` function return another `render` function, in this case `ejs.render()`
// If you intend to use any other template system like `handlebars`, don't forget to install it
// via npm!
render (template, data) {
  return ejs.render(template, data, {
    delimiter: '%',
    root: process.cwd()
  })
}
```

**Notice:**

If your html page contains any template content (such as `<$= users.join(" | "); $>`), you **must** configure `html` and `data` at the same time.

### Configure `indexPage`

Configure the index page. This can be any page that is configured in the `pages` option. This is very helpful, when your project structure does not provide an `index.html` file in your project's root folder.

For example: If you navigate to `http://localhost:3000` and there is not `index.html` file in your project's root directory, the browser will show a `404` page. However, if you configure `indexPage` and point ot to the key of one of your `pages` objects, then the plugin will instead intercept the `/` request and provide a response with the content of that very page you've defined.

Example:
Set `indexPage` to `login`, then browse to `http://localhost:3000`.
The `/login.html` page will be shown. 

This is equivalent to navigating to `http://localhost:3000/login.html`.

### The `render` function

Since version `0.1.0` you can use the `render` function to render html templates created with other templating systems (like ejs, handlebars, etc). Currently this is only tested with the `ejs` templating system, but it should work with any other template system as well.
