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
export function getHtmlName(id:string, root?:string){
  const _id = id.replace(cwd, '');
  return _id.substring(1,_id.length-5).replace(root ?? '', '');
}
