import {HtmlPluginOptions} from "./types"
import type {ConfigEnv, Plugin, UserConfig, ViteDevServer} from 'vite'
import {HistoryApiOptions} from "../history-api/types"

export default class VirtualHtmlPlugin implements Plugin {
  name = 'vite-plugin-virtual-html'

  _htmlOptions: HtmlPluginOptions

  _config!: UserConfig

  load?: OmitThisParameter<(id: string) => Promise<string | null>>

  configureServer?: OmitThisParameter<(server: ViteDevServer) => () => void>

  transform?: OmitThisParameter<(code: string, id: string) => Promise<string | null>>

  closeBundle?: OmitThisParameter<() => Promise<void>>

  constructor(virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions) {
    this._htmlOptions = virtualHtmlOptions
    this.config = this.config.bind(this)
  }

  async config(config: UserConfig, {command}: ConfigEnv) {
    this._config = config
    if (command === 'serve') {
      await import('./Serve').then(({Serve}) => {
        const serve = new Serve(this._htmlOptions)
        this.configureServer = serve._configureServer.bind(serve)
        this.load = serve._load.bind(serve)
        this.transform = serve._transform.bind(serve)
      })
    }
    if (command === 'build') {
      await import('./Build').then(async ({ Build }) => {
        const build = new Build(this._htmlOptions)
        await build._buildConfig.call(build, config)
        this.load = build._load.bind(build)
        this.transform = build._transform.bind(build)
        this.closeBundle = build._closeBundle.bind(build)
      })
    }
  }
}
