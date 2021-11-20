// noinspection UnnecessaryLocalVariableJS

import {
  cwd,
  defaultRender,
  PageObject,
  VirtualHtmlPage,
  VirtualHtmlTemplateData,
  VirtualHtmlTemplateRender,
} from './types'
import * as path from 'path'
import * as fs from 'fs'

const fsp = fs.promises

/**
 * generate URL
 * @param url
 */
export function generateUrl(url?: string): string {
  if (!url) {
    return '/'
  }
  // url with parameters
  if (url.indexOf('?') > 0) {
    return url.split('?')[0]
  }
  return url
}

/**
 * read HTML file from disk and generate code from template system(with render function)
 * @param template
 * @param data
 * @param render
 */
export async function readHtml({template = '', data = {}, render = defaultRender}: PageObject) {
  const templatePath = path.resolve(cwd, `.${template}`)
  const templatePathExists = fs.existsSync(templatePath)
  if (!templatePathExists) {
    console.error('template must exist!')
    return ''
  }
  const htmlCode = await renderTemplate(templatePath, render, data)
  return htmlCode
}

/**
 * render template
 * @param templatePath
 * @param render
 * @param data
 */
export async function renderTemplate(templatePath: string, render: VirtualHtmlTemplateRender, data: VirtualHtmlTemplateData) {
  return await readTemplate(templatePath).then(code => {
    const result = render(code, data)
    return result
  })
}

/**
 * read html file's content to render with render function
 * @param templatePath
 */
export async function readTemplate(templatePath: string): Promise<string> {
  const result = await fsp.readFile(templatePath)
  return result.toString()
}

/**
 * generate page option from string/object to object
 * @param page
 * @param globalData
 * @param globalRender
 */
export async function generatePageOptions(page: VirtualHtmlPage, globalData: Record<string, unknown>, globalRender: VirtualHtmlTemplateRender): Promise<PageObject> {
  if (typeof page === 'string') {
    return {
      template: page,
      data: {
        ...globalData,
      },
      render: globalRender,
    }
  }
  const {data = {}, render, template} = page
  return {
    template: template,
    data: {
      ...globalData,
      ...data,
    },
    render: render ?? globalRender ?? defaultRender,
  }
}
