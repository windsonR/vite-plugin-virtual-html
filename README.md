# vite-plugin-virtual-html

[中文文档](./README_ZH.md)

## Motivation

vite's [MPA](https://vitejs.dev/guide/build.html#multi-page-app) unlike `@vue/cli`'s `pages` option have a configuration
in dev mode.

vite's html file need to place in project's root to have same behavior in dev and production mode, it makes your
project's root dir looks chaotic.

And if you follow vite's MPA, put other file in other directory, unlike `index.html`, you need useless middle directory(
Ex. from vite's MPA doc `http://localhost:3000/nested/nested.html`) to located it.

so, i write this plugin to make vite's MPA more configurable and in dev mode or production has same behavior.

this plugin use vite's `configureServer` Hook to intercept html request and response the html content requested from
browser.

## update

1. `1.1.9` add `urlTransformer`function to support developer edit url
1. `1.0.2` add `connect-history-api-fallback` support
1. `0.4.0` add a new option to `pages`,just need an js file,plugin will auto generate a html file which include the
   entry js
1. `0.3.0` change the behavior of `defaultRender`, if in project, it has `ejs` as dependency, it will return html code
   which rendered by `ejs`, otherwise it will return html code directly as old version do
1. `0.2.9` add a new option `injectCode` to add some code before/after tag in html file
2. `0.2.8` add a new option `extraGlobPattern` to customize `fast-glob`'s pattern. Default pattern
   is `['**/*.html', '!node_modules/**/*.html', '!.**/*.html']`, attention: if your config has problems, such as you
   didn't ignore `dist`, when build,it will occur
   error: `new Error('[vite]: Rollup failed to resolve import "${id}" from "${importer}".\n'`
3. `0.2.6` `pages` now correctly identify multi-level directories
4. `0.2.3` `pages` options now can set to true to allow all html in project.
5. `0.2.1` now works fine with `@vitejs/plugin-react`.
6. `0.2.0` has reworked, so config have a little change
    1. plugin does not require your html exists, but you must provide a template file(as html)
    2. `page`'s config renamed to `template`
    3. each `page` can have a independent `render` function
    4. add a global config `data`, its' config will be covered by `page`'s `data`
    5. all you `pages`' will be treat as template file

## features

+ allow you put your html file anywhere in your project(like `@vue/cli`'s `pages`)
    + when you run in dev,it will intercept html requests,and response with the html content which you set in `pages`.
    + when you run build, it will copy files(reading config from `pages` options) under dist's sub-folder to dist
      folder, and then delete the rest html file.
+ auto config `build.rollupOptions.input` from pages
+ if your html do not have a module script import. plugin will try to add a js/ts script import using the html file's
  name.

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

config your project's all html/template file's path

it will be used for:

+ dev mode, it will intercept your html request, and response with html file in this config
+ build mode, inject into `build.rollupOptions.input`
+ when you build, plugin will copy all your config pages to project ROOT, and when build finished, the copied HTML file
  will auto remove from project ROOT.
+ if you want to use template system,you can send a object which contains `template` and `data` to render it. By
  default, it will return the html content in your HTML/template file, when you define a render function, it(html
  template) will rendered by your custom render function.

```
// all config 
{ 
    // 1. directly input html/template path
    login1: '/src/index/index.html', 
    // 2. a object with template
    login2: {
      template: '/src/login/login.html', // if there is no data prop, the login.html must only contain HTML content
    },
    // 3. a object with template and data, maybe with render
    login3: {
      template: '/src/login1/login1.html',
      data: {
        users: ['a', 'b', 'c']
      },
      // each page can have independent render function
      // render(template, data){
      //   return template
      // }
    },
    // 4. config a js file path to auto-generate a html file
    login4: {
      entry: '/src/login/login.js', // MUST
      title: 'login4',// optional, default: ''
      body: '<div id="app"></div>' // optional, default: '<div id="app"></div>'
    }
}
```

**notice:**

1. if your html page contains any template content(such as `<$= users.join(" | "); $>`), you **must** contain `template`
   and `data`.
2. The `pages` options' `key` is the real HTML file after build
3. The `pages` options' `key` and `value`/ `template` file's name can different.
4. for example 1, you can access `login1.html` when `dev` mode, and it will generate a `login1.html` when build.
5. when `pages` set to `true`, the `template.html` will only generate **ONLY ONE** `html` file
6. when use `entry` config, plugin will auto generate a html file like this project's `demo4.html`, according
   your `entry`/`title`/`body` config, it will has a little difference

### indexPage

config the index page

Ex. when you open `http://localhost:3000`, your project's root dir has no  `index.html` file, then browser will
show `404`.

now, if you set this, plugin will intercept `/` request, and response with page you set.

Like this:
when you set `indexPage` to `login`,then you access `http://localhost:3000` in browser, it will show the `/login.html`
page.

it equals to access `http://localhost:3000/login.html`.

### render

from `0.1.0` , you can use `render` function to render html template.
i have just test in `ejs`, but i think other template system will(maybe) work correctly.

**notice:**

1. `0.3.0` or later,if your html code/template use `ejs` template, you **MUST** install `ejs`

### extraGlobPattern

Customize `fast-glob`'s pattern
When set this options, it will replace default `fast-glob` pattern, it's default value
is `['**/*.html', '!node_modules/**/*.html', '!.**/*.html']`

### injectCode

[options](./src/html/types.ts#28)

In html file, put `replacement`before/after `find`

### urlTransformer

Allow plugin's user to fully customize the `url`, this is a function which has two param:(`resolvedUrl`,`req`)

First param: `resolvedUrl` is a `string`, it means the plugin handles from `req` param.

Second param : `req`, is a `http.IncommingMessage`

This function must return a `string`

## NOTICE

1. if you use same `template` file for multiple page, please make sure the page's key is different.
2. please DO NOT use this plugin when you build a library(you can use this in dev NOT in build)

## Thanks

![JetBrains Logo (Main) logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)
