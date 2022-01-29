import {Pages} from './types'
import glob from 'glob'
const HTML_GLOB = '**/*.html'
const HTML_EXCLUDE_GLOB = [
  'node_modules/**/*.html',
  '.**/*.html'
]

/**
 * find all html file in project and return it as Pages
 */
export function findAllHtmlInProject(): Pages {
  const pages:Pages = {}
  const files = glob.sync(HTML_GLOB,{
    ignore: HTML_EXCLUDE_GLOB
  })
  files.forEach(file=>{
    const filePathArr = file.split('/')
    pages[filePathArr[filePathArr.length-1].replace('.html', '')] = `/${file}`
  })
  return pages
}