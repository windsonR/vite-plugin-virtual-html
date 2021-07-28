# vite-plugin-virtual-html

## 简介

`vite`的[多页面应用](https://vitejs.dev/guide/build.html#multi-page-app) 与`@vue/cli`不同，`@vue/cli`有`pages`配置来配置多页面应用

`@vue/cli`可以将html页面放置到项目的任意位置，然后通过`pages`配置将html页面直接生成到编译后的`dist`目录，在`vite`中要实现相同的访问方式（指 `http://localhost:8080/index.html` 此类），需要将html页面放置到项目的根目录

然后，如果你将html文件放置到其他目录，你就需要在访问时添加多余的中间目录（比如 `http://localhost:3000/nested/nested.html` ）

同时，在打包之后，访问这些html文件也需要添加多余的中间目录，这就与`@vue/cli`有极大的不同。

所以，我写了这么一个插件，用于实现在`@vue/cli`时的多页面应用的行为：

这个插件使用了`vite`的以下钩子：
  + `configureServer`: 拦截和响应html请求
  + `config`: 注入`build.rollupOptions.input`配置
  + `closeBundle`: 执行`build`时的`html文件`复制及删除
  + `transform`: 对`html文件`的处理

## 功能

+ 允许你将`html`文件放置到项目的任意位置（与`@vue/cli`的`pages`配置相同）
    + 当`dev`开发时，拦截`html`请求，然后将配置的相应的`html`文件内容返回给浏览器
    + 当`build`项目时，将配置的`html`文件复制到`dist`目录下，同时删除其他`html`文件及其目录
+ 自动配置`build.rollupOptions.input`
+ 如果你的`html`文件没有配置入口文件，则将会在`html`文件附近寻找与`html`文件同名的`js/ts`文件，并将其添加到`html`的文件内容中

## 使用方法

`yarn add vite-plugin-virtual-html --dev # npm install vite-plugin-virtual-html -D`

在`vite.config.js`配置文件中添加以下内容

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

## 配置

### pages
配置你的项目所有可用的html文件的路径，
这个配置需要传入一个json对象，这个json对象可以通过任何方式进行获得，可以直接写固定的配置，也可以通过`glob`等方式进行获取

这个配置将在以下地方使用:
+ dev模式，在浏览器请求html文件时，将会返回这里配置的html文件的内容
+ build模式，注入配置到 `build.rollupOptions.input`
+ build模式，在最终生成编译后文件后，将会复制dist目录下相应子目录中的html文件到dist目录下，然后将子目录删除.
```
{ 
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}
```

### indexPage

配置浏览器访问`index.html`时应该返回哪个html文件，默认值为`index`

例如，让你打开`http://localhost:3000`时，你的项目根目录如果没有`index.html`，那么浏览器会显示`404`

通过此配置，插件将会拦截`/`请求，然后返回你在这里配置的页面。

比如：
当你将 `indexPage` 设置为 `login`时,你在浏览器中访问 `http://localhost:3000` 将会显示 `/login.html` 页面的内容.

就相当于你访问了 `http://localhost:3000/login.html`.
