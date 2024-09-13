import type {Rewrite} from 'connect-history-api-fallback'
export type HistoryRewrites = Rewrite

export type HistoryApiOptions = {
  /**
   * option to connect-history-api-fallback's rewrites
   */
  rewrites?: Array<HistoryRewrites>
  usePreview?: boolean
}
