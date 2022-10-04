import glob from 'fast-glob'
import { InjectCode, Pages, POS, VirtualPage, VirtualPageOptions, } from './types'

export const VIRTUAL_HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>#TITLE#</title>
    <script src="#ENTRY#" type="module"></script>
</head>
<body>
#BODY#
</body>
</html>
`

const DEFAULT_GLOB_PATTERN = [
    '**/*.html',
    '!node_modules/**/*.html',
    '!.**/*.html'
]

/**
 * find all html file in project and return it as Pages
 */
export function findAllHtmlInProject(extraGlobPattern: Array<string> = []): Pages {
    const pages: Pages = {}
    let realPattern = extraGlobPattern
    if (extraGlobPattern.length === 0) {
        realPattern = DEFAULT_GLOB_PATTERN
    }
    const files = glob.sync(realPattern)
    files.forEach(file => {
        const filePathArr = file.split('/')
        pages[filePathArr[filePathArr.length - 1].replace('.html', '')] = `/${file}`
    })
    return pages
}

/**
 * directly use find\replacement / replacement\find to replace find
 * @param {pos, find, replacement}
 * @param code
 */
export function generateInjectCode({pos, find, replacement}: InjectCode, code: string): string {
    if (pos === POS.after) {
        return code.replace(find, `${find}\n${replacement}`)
    }
    if (pos === POS.before) {
        return code.replace(find, `\n${replacement}\n${find}`)
    }
    return code
}

/**
 * generate page from virtual page
 * @param vPages
 */
export async function generateVirtualPage(vPages: VirtualPageOptions): Promise<string> {
    const {
        entry,
      title = '',
      body= '<div id="app"></div>'
    } = vPages
    return VIRTUAL_HTML_CONTENT.replace('#ENTRY#', entry).replace('#TITLE#', title).replace('#BODY#',body)
}
