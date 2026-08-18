import type { Plugin, } from 'vite'
import type { HtmlPluginOptions, } from './html/types.js'
import { VirtualHtmlPlugin } from './html/VirtualHtmlPlugin.js'
import type { HistoryApiOptions } from './history-api/types.js'

export default (virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions): Plugin => {
  return VirtualHtmlPlugin(virtualHtmlOptions)
}

export {
  VirtualHtmlPlugin,
}

export * from './html/Build.js'

export * from './html/Serve.js'

export * from './history-api/historyApiFallbackPlugin.js'

export * from './html/types.js'

export * from './history-api/types.js'
