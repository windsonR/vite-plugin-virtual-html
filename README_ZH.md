# vite-plugin-virtual-html

## 简介

`Vite`的[多页面应用](https://cn.vitejs.dev/guide/build.html#multi-page-app)需要将`html`文件放到项目根目录或通过从根目录起的路径访问。

这会导致在开发和构建过程的`html`文件访问不一致.例如在开发时,你需要访问`/nested/a.html`,但是在构建后,你需要访问的时`/a.html`

所以,为了解决这个问题,需要在开发时对`html`请求进行拦截并返回相应的`html`内容

这个插件使用了以下的钩子:

- 开发过程
  - `config`: 将下面的3个钩子注入到插件中
  - `configureServer`: 拦截并响应`html`请求, 处理`connect-history-api-fallback`的请求
  - `load`: 加载并处理`html`代码
  - `transform`: 在`html`文件中注入一些可配置的代码等
- 构建过程
  - `config`: 将下面的3个钩子注入到插件中,并将`html`文件复制到项目根目录
  - `load`: 加载并处理`html`代码
  - `transform`: 在`html`文件中注入一些可配置的代码等
  - `closeBundle`: 移除在`config`中复制的`html`文件

## 更新信息


## 功能
+ 允许你将`html`文件放置到项目的任意位置（与`@vue/cli`的`pages`配置相同）
    + 当`dev`开发时，拦截`html`请求，然后将配置的相应的`html`文件内容返回给浏览器
    + 当`build`项目时，将配置的`html`文件复制到`dist`目录下，同时删除其他`html`文件及其目录
+ 自动配置`build.rollupOptions.input`
+ 如果你的`html`文件没有配置入口文件，则将会在`html`文件附近寻找与`html`文件同名的`js/ts`文件，并将其添加到`html`的文件内容中

## 使用方法

`pnpm install vite-plugin-virtual-html -D`

在`vite.config.ts`中配置插件

``` typescript
// vite.config.ts
const virtualHtml from 'vite-plugin-virtual-html'

const pages = {
    index: '/src/index/index.html',
    login: '/src/login/login.html',
}

module.exports = {
  plugins: [
    virtualHtml({
      pages,
    })
  ],
}
```

**插件使用事项:**

- 一定不要再编译库时使用这个插件!!!

## 配置

### pages

配置项目的html文件路径

`pages`可配置为[Pages](./src/html/types.ts#33)对象或`true`

当配置为`true`时,会根据`extraGlobPattern`的配置自动读取项目中的`html`文件路径并生成`pages`对象

**注意:**

- `entry`与`template`目前不能同时使用


### extraGlobPattern

仅`pages`为`true`时可用,默认值为
```
  '**/*.html',
  '!node_modules/**/*.html',
  '!.**/*.html'
```

### indexPage

指定当访问`index`或`/`页面时应当返回`pages`中的哪一个`html`文件的内容

### render, data

自定义全局模版渲染函数及渲染时使用的数据

**注意:**

- 目前我只测试了`ejs`,其他模版系统应该也可以正常工作

### injectCode

将配置的`replacement`放到`find`前面或后面

### rewrites

处理`connect-history-api-fallback`的重写请求

### urlTransformer

完全由开发者自定义处理`dev-server`拦截到的url,传入的参数为(`resolvedUrl`,`req`)

其中,第一个参数是插件初步处理的`url`字符串, 第二个参数是一个`req`对象(`http.IncomingMessage`)

返回值为一个新的`url`字符串
