// noinspection DuplicatedCode

import { expect, test } from 'vitest'
import VirtualHtml from '../src/plugin'
import { createServer, } from 'vite'
import {page} from '../vitestSetup'

test('template_ejs', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: {
            template: '/test/demo/template/demo1.html',
            data: {
              users: ['a', 'b', 'c']
            }
          },
          demo2: {
            template: '/test/demo/template/demo2.html',
            data: {
              users: ['a', 'b', 'c']
            }
          },
          demo3: {
            template: '/test/demo/template/demo3.html',
            data: {
              script: '<script type="module" src="/test/demo/demo1/demo1.ts"></script>'
            }
          },
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo2.html`)
  expect(await page.content()).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo3.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})
