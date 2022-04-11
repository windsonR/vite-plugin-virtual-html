import glob from 'fast-glob'
import {Pages,} from './types'
const DEFAULT_GLOB_PATTERN = [
  '**/*.html',
  '!node_modules/**/*.html',
  '!.**/*.html'
]

/**
 * find all html file in project and return it as Pages
 */
export function findAllHtmlInProject(extraGlobPattern:Array<string> = []): Pages {
  const pages:Pages = {}
  let realPattern = extraGlobPattern
  if (extraGlobPattern.length === 0) {
    realPattern = DEFAULT_GLOB_PATTERN
  }
  const files = glob.sync(realPattern)
  files.forEach(file=>{
    const filePathArr = file.split('/')
    pages[filePathArr[filePathArr.length-1].replace('.html', '')] = `/${file}`
  })
  return pages
}