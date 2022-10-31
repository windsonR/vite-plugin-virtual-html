# vite-plugin-virtual-html

## 简介

`vite`的[多页面应用](https://vitejs.dev/guide/build.html#multi-page-app) 与`@vue/cli`不同，`@vue/cli`有`pages`配置来配置多页面应用

`@vue/cli`可以将html页面放置到项目的任意位置，然后通过`pages`配置将`html`页面直接生成到编译后的`dist`目录，在`vite`中要实现相同的访问方式（指 `http://localhost:8080/index.html` 此类），需要将html页面放置到项目的根目录

然后，如果你将html文件放置到其他目录，你就需要在访问时添加多余的中间目录（比如 `http://localhost:3000/nested/nested.html` ）

与此同时，在打包之后，访问这些`html`文件也需要添加多余的中间目录

所以,为了方便管理不同页面的`html`文件,就有了这么一个插件

这个插件使用了`vite`的以下钩子：
  + `configureServer`: 拦截和响应html请求
  + `config`: 注入`build.rollupOptions.input`配置,同时根据插件的`pages`配置,将`html`文件复制到项目的根目录
  + `closeBundle`: 删除`config`阶段复制的`html`文件及中间目录
  + `load`: 对`html文件`的处理,包括模板文件的渲染

## 更新信息
1. `0.4.0`现在支持不添加指定任何`html`文件,即可生成相应的`html`页面
1. `0.3.0` 对于默认的`render`,现在会检查项目中是否安装了`ejs`,如果有,则将会调用`ejs`的render进行处理,否则直接返回`html`代码
1. `0.2.9` 添加了一个新的配置 `injectCode` ,用于直接在`html`文件中的一些标签前后插入一些代码
2. `0.2.8` 添加了一个新的配置`extraGlobPattern` 用于替换默认的`fast-glob`匹配项,其默认值为:  `['**/*.html', '!node_modules/**/*.html', '!.**/*.html']`,需要注意的是,如果你的配置有问题,会导致编译生产环境代码时报错: `new Error('[vite]: Rollup failed to resolve import "${id}" from "${importer}".\n'`
3. `0.2.6` `pages`选项现在可以使用多级的目录
4. `0.2.3` `pages`选项现在可以设置为`true`,设置为`true`后,会获取项目中的所有`html`文件并自动生成`pages`配置
5. `0.2.1`版本，现在会在插件获取到html代码后将html代码交给`ViteDevServer`进行处理，以便使插件的html代码与`Vite`处理的html代码相同（仅作用于dev时期）（参考信息：[@vite-js/plugin-react](https://github.com/vitejs/vite/tree/main/packages/plugin-react#middleware-mode)
6. 0.2.0版本对插件的大部分代码进行了重构，配置发生了一点小小的变化
   1. 插件不再要求你的html文件必须存在，但是要求你必须配置一个template文件（html）
   2. 属性名称变更：`pages[key].html`=>`page[key].template`
   3. page配置新增了一个单独的render函数
   4. 新增了一个全局的data配置，其中的配置可以在单个html配置中进行覆盖
   5. 与之前版本不同的是，你配置在`pages`中的所有html都会被视为模板文件进行操作

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

配置你的项目所有可用的html文件的路径

这个配置需要传入一个json对象，这个json对象可以通过任何方式进行获得，可以直接写固定的配置，也可以通过`glob`等方式进行获取

json对象的每个值,可以是字符串(指向某个html/template文件),也可以是一个包含`template`值(指向某个html/template文件)的对象,如果有需要(需要使用模板时),也可以传入`data`值(任意类型)

这个配置将在以下地方使用:
+ dev模式，在浏览器请求html文件时，将会返回这里配置的html文件的内容
+ build模式，注入配置到 `build.rollupOptions.input`
+ build模式，在编译前，插件会将你配置的所有HTML文件复制到项目根目录（如果HTML文件本来就在项目根目录下，那么将会忽略此步），同时会在编译完成（没报错）时删除他们
+ 如果你希望使用HTML模板(比如`ejs`等),那么,你需要将原本的html路径修改为如下示例中的`login1`,即,同时传入一个包含`template`和`data`的对象,并且需要自定义渲染函数(`render`)
```
// 一个较为复杂的配置示例，其中演示了插件所有支持的配置方式
{ 
// 1. 直接传入一个html文件，
    login1: '/src/index/index.html', 
    // 2. 传入一个包含template的对象
    login2: {
      template: '/src/login/login.html', // 如果没有data参数时,html文件不能包含任何模板内容
    },
    // 3. 传入包含template和data属性的对象
    login3: {
      template: '/src/login1/login1.html',
      data: {
        users: ['a', 'b', 'c']
      },
      // 每一个page配置都可以有单独的render，如果存在这个render函数，那么将会忽略全局的render函数
      // render(template, data){
      //   return template
      // }
    },
    // 4. 通过传入入口文件路径即可自动生成一个html文件.
    login4: {
      entry: '/src/login/login.js', // 必需
      title: 'login4',// 可选, 默认值: ''
      body: '<div id="app"></div>' //可选, 默认值: '<div id="app"></div>'
    }
}
```
**注意:**
1. 如果 html文件包含任何模板内容(比如`<$= users.join(" | "); $>`),那么配置时,**必须**同时包含`template` 和 `data`配置
2. `pages`配置的`key`会作为编译后的html文件的名字
3. `pages`配置的`key`和配置的`value`/ `template`html文件的名字可以不一样
4. 示例1中，`dev`时可访问`login1.html`，`build`后，会生成`login1.html`而不是`index.html`,同理，其他示例也会产生以key为名字的html文件
5. 当 `pages` 设置为 `true`, `template.html` 最终只会生成**一个**`html`文件
6. 当使用`entry`传入入口文件时,最终生成的代码会与这个项目根目录的`demo4.html`类似,根据你传入的`entry`/`title`/`body`而有所不同

### indexPage

配置浏览器访问`index.html`时应该返回哪个html文件，默认值为`index`

例如，让你打开`http://localhost:3000`时，你的项目根目录如果没有`index.html`，那么浏览器会显示`404`

通过此配置，插件将会拦截`/`请求，然后返回你在这里配置的页面。

比如：
当你将 `indexPage` 设置为 `login`时,你在浏览器中访问 `http://localhost:3000` 将会显示 `/login.html` 页面的内容.

就相当于你访问了 `http://localhost:3000/login.html`.

### render

从`0.1.0`版本开始,你可以使用`render`函数来自定义模板渲染方式.

**注意:**
1. `0.3.0`版本或更新,如果HTML代码/模板中使用了`ejs`的模板语法,那么必须要安装`ejs`

### extraGlobPattern

自定义的`fast-glob`匹配选项

**注意:**

设置了此项之后,将会完全替换默认的`fast-glob` 匹配选项, 这个值的默认值为`['**/*.html', '!node_modules/**/*.html', '!.**/*.html']`

### injectCode

[配置](./src/types.ts#51)

在html文件中, 将`replacement` 放到 `find` 前面或后面

目前我只测试了`ejs`,但是我猜其他的模板系统应该都能正常工作.

## 注意
1. 如果你在多个页面使用同一个`template` 文件，那么请一定要确保pages配置的key不同（一句正确的废话）
2. 请一定不要在编译库的时候使用这个插件,这可能导致`rollup`编译问题
