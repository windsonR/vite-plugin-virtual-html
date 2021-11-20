import {cwd, VirtualHtmlPage} from './types'

/**
 * use pages' key as html name
 * @param pages
 */
export function extractHtmlPath(pages: { [p: string]: VirtualHtmlPage }) {
  const newPages: { [key: string]: string } = {}
  Object.keys(pages).forEach(key => {
    newPages[key]=`/${key}.html`
  })
  return newPages
}

/**
 * get html file's name
 * @param id
 */
export function getHtmlName(id:string){
  return id.replace(cwd, '').substring(1,id.replace(cwd, '').length-5)
}
