// noinspection UnnecessaryLocalVariableJS
import {normalizePath, Plugin, UserConfig, ViteDevServer} from 'vite'
import {cwd, DEFAULT_INJECTCODE_ALL, Pages, PluginOptions} from './types'
import {generatePageOptions, generateUrl, readHtml} from './devUtils'
import {addTrailingSlash, extractHtmlPath, getHtmlName} from './buildUtils'
import path from 'path'
import fs, {promises as fsp} from 'fs'
import {findAllHtmlInProject, generateInjectCode} from './utils'

export default (virtualHtmlOptions: PluginOptions): Plugin => {
    const {
        pages: pagesObj,
        indexPage = 'index',
        render: globalRender = (template: string) => template,
        data: globalData = {},
        extraGlobPattern = [],
        injectCode = {}
    } = virtualHtmlOptions
    let pages: Pages
    if (pagesObj === true || pagesObj === undefined) {
        pages = findAllHtmlInProject(extraGlobPattern)
    } else {
        pages = pagesObj
    }
    let _config: UserConfig;
    let distDir: string
    const needRemove: Array<string> = []
    return {
        name: 'vite-plugin-virtual-html',
        configureServer(server: ViteDevServer) {
            // other html handled after vite's inner middlewares.
            return () => {
                server.middlewares.use('/', async (req, res, next) => {
                    let url = decodeURI(generateUrl(req.url))
                    // if request is not html , directly return next()
                    if (!url.endsWith('.html') && url !== '/') {
                        return next()
                    }
                    // if request / means it request indexPage htmlCode
                    // read indexPage config ,and response indexPage htmlCode
                    let htmlCode: string
                    if (url === '/' || url.indexOf('index.html') >= 0) {
                        url = `/${indexPage}.html`
                        // @ts-ignore
                        htmlCode = await this.load(normalizePath(url)) ?? ''
                    } else {
                        // @ts-ignore
                        htmlCode = await this.load(url) ?? ''
                    }
                    // @ts-ignore
                    res.end(await server.transformIndexHtml(url, await this.transform(htmlCode, url)))
                    next()
                })
            }
        },
        async transform(code: string, id: string): Promise<string> {
            if (id.indexOf('.html') >= 0) {
                const ids = id.split('/')
                const key = ids[ids.length - 1]
                if (key in injectCode) {
                    return generateInjectCode(injectCode[key], code)
                }
                if (DEFAULT_INJECTCODE_ALL in injectCode) {
                    return generateInjectCode(injectCode[DEFAULT_INJECTCODE_ALL], code)
                }
            }
            return code
        },
        async config(config, {command}) {
            _config = config;
            if (command === 'build') {
                const allPage = Object.entries(pages)
                // copy all html which is not under project root
                for (const [key, value] of allPage) {
                    const pageOption = await generatePageOptions(value, globalData, globalRender)
                    const vHtml = normalizePath(path.resolve(cwd, `./${config.root ? addTrailingSlash(config.root) : ''}${key}.html`))
                    if (!fs.existsSync(vHtml)) {
                        needRemove.push(vHtml)
                        await checkVirtualPath(vHtml, needRemove)
                        await fsp.copyFile(path.resolve(cwd, `.${pageOption.template}`), vHtml)
                    }
                }
                console.warn('NOTICE: This plugin cannot use in library mode!')
                // get custom distDir config,if it is undefined use default config 'dist'
                distDir = config.build?.outDir ?? 'dist'
                // inject build.rollupOptions.input from pages directly.
                config.build = {
                    ...config.build,
                    rollupOptions: {
                        ...config.build?.rollupOptions,
                        input: {
                            ...(config.build?.rollupOptions?.input as object),
                            ...extractHtmlPath(pages),
                        },
                    },
                }
            }
        },
        async load(id: string) {
            if (id.endsWith('html')) {
                const newId = getHtmlName(id, _config?.root)
                if (pages[newId] !== undefined) {
                    const page = await generatePageOptions(pages[newId], globalData, globalRender)
                    // generate html template
                    return await readHtml(page)
                }
            }
            return null
        },
        async closeBundle() {
            // remove files should not be under project root
            for (let vHtml of needRemove) {
                if (fs.existsSync(vHtml)) {
                    await fsp.rm(vHtml, {
                        recursive: true,
                    }).catch(() => {
                        // ignore this warning
                    })
                }
            }
        },
    }
}

/**
 * check html file's parent directory
 * @param html
 * @param needRemove
 */
async function checkVirtualPath(html: string, needRemove: Array<string>) {
    const pathArr = html.split('/')
    const fileName = pathArr[pathArr.length - 1]
    const middlePath = html.replace(fileName, '').replace(cwd, '')
    const firstPath = middlePath.split('/')[1]
    if (!fs.existsSync(middlePath)) {
        needRemove.push(normalizePath(path.resolve(cwd, `./${firstPath}`)))
        await fsp.mkdir(path.resolve(cwd, `./${middlePath}`), {
            recursive: true
        })
    }
}
