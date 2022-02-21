import {cwd, VirtualHtmlPage} from './types'
import { normalizePath } from 'vite'

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
  const _root = (root ?? '').replace(cwd, '');
  const _id = id.replace(cwd, '');
  const result = _id.substring(0, _id.length - '.html'.length).replace(_root !== '' ? addTrailingSlash(_root) : '', '');
  return result.startsWith('/') ? result.substring(1) : result;

}

/**
 * add trailing slash on path
 * @param {string} path
 * @returns {string}
 */
export function addTrailingSlash(path:string):string {
  const _path = normalizePath(path.replace(cwd, ''));
  return _path.endsWith('/') ? _path : `${_path}/`;
}