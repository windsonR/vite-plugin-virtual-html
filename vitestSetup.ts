import {beforeAll} from 'vitest'
import { chromium, Page } from 'playwright-chromium'

export let page: Page = undefined!
beforeAll(async ()=>{
  const browser = await chromium.launch()
  const context = await browser.newContext()
  page = await context.newPage()
  page.once('load', () => console.log('Page loaded!'));
})
