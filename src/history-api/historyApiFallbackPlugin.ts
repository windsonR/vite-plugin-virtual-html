import type {Connect, Plugin, ViteDevServer} from "vite"
import history from "connect-history-api-fallback"
import type {HistoryApiOptions, HistoryRewrites} from "./types"

// noinspection JSUnusedGlobalSymbols
export const historyApiFallbackPlugin = (historyApiOptions: HistoryApiOptions): Plugin => {
  const {rewrites} = historyApiOptions
  return {
    name: 'vite-plugin-virtual-html:history',
    configureServer(server: ViteDevServer) {
      if (rewrites) {
        buildHistoryApiFallback(server, rewrites)
      }
    },
  }
}

/**
 * build a server
 * @param server
 * @param rewrites
 */
export function buildHistoryApiFallback(server: ViteDevServer, rewrites: Array<HistoryRewrites>) {
  server.middlewares.use(history({
    disableDotRule: undefined,
    htmlAcceptHeaders: [
      'text/html',
      'application/xhtml+xml'
    ],
    rewrites: rewrites,
  }) as Connect.NextHandleFunction)
}