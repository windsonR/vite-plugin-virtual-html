export type HistoryRewrites = {
  from: RegExp,
  to: string,
}

export type HistoryApiOptions = {
  /**
   * option to connect-history-api-fallback's rewrites
   */
  rewrites?: Array<HistoryRewrites>
}