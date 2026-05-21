import type { UserConfig } from 'vite';
import { Build, type Meta } from './Build.js';
import type { HtmlPluginOptions } from './types.js';

export class Bundle extends Build {
  constructor(virtualHtmlOptions: HtmlPluginOptions, meta: Meta) {
    super(virtualHtmlOptions, meta);
  }
  async bindInput(config: UserConfig) {
    await super._buildConfig(config);
    // config.build = {
    //   ...config.build??{},
    //   rolldownOptions:{
    //     ...config.build?.rolldownOptions??{},
    //   }
    // }
  }
}
