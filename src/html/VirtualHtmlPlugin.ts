import { Bundle } from './Bundle.js';
import type { HtmlPluginOptions } from "./types.js";
import type { ConfigEnv, Plugin, UserConfig } from "vite";
import type { HistoryApiOptions } from "../history-api/types.js";
import { Serve } from "./Serve.js";
import { Build } from "./Build.js";

export const VirtualHtmlPlugin = (
  virtualHtmlOptions: HtmlPluginOptions & HistoryApiOptions
): Plugin => {
  let _htmlOptions = virtualHtmlOptions;
  let _config: UserConfig;
  let _instance: Serve | Build | null = null;
  return {
    name: "vite-plugin-virtual-html",
    async config(config: UserConfig, { command }: ConfigEnv) {
      _config = config;
      if (command === "serve") {
        if (_htmlOptions.useCustom??true) {
          config.appType = "custom";
        }
        if (config.experimental?.bundledDev) {
          config.appType = undefined
          _instance = new Bundle(_htmlOptions,this.meta)
          await _instance.bindInput.call(_instance,config)
          return
        }
        _instance = new Serve(_htmlOptions);
      } else if (command === "build") {
        _instance = new Build(_htmlOptions,this.meta);
        await _instance._buildConfig.call(_instance, config);
      }
    },
    configureServer(server) {
      if ((_instance as Serve)._configureServer) {
        return (_instance as Serve)._configureServer(server);
      }
    },
    async load(...args) {
      if (_instance?._load) {
        return await _instance._load(...args);
      }
    },
    async transform(...args) {
      if (_instance?._transform) {
        return await _instance._transform(...args);
      }
    },
    closeBundle() {
      if ((_instance as Build)._closeBundle) {
        return (_instance as Build)._closeBundle();
      }
    },
  };
};
