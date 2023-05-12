// noinspection DuplicatedCode

import {expect, test} from 'vitest'
import VirtualHtml, { POS } from '../src'
import {createServer,} from 'vite'
import {page} from '../vitestSetup'

test('index', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: '/test/demo/demo1/demo1.html',
        },
        indexPage: 'demo1',
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/`)
  const index = await page.content()
  expect(index).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  const demo1 = await page.content()
  expect(demo1).toMatchSnapshot()
  expect(index).toBe(demo1)
  await server.close()
})

test('index_with_sub_folder1', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          // should access with localhost/demo1/ or localhost/demo1/index.html
          'demo1/index': '/test/demo/demo1/demo1.html',
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1/`)
  const index = await page.content()
  expect(index).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo1/index.html`)
  const demo1 = await page.content()
  expect(demo1).toMatchSnapshot()
  expect(index).toBe(demo1)
  await server.close()
})

test('index_with_sub_folder2', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          // should access with localhost/demo1/ or localhost/demo1/index.html
          'demo1/': '/test/demo/demo1/demo1.html',
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1/`)
  const index = await page.content()
  expect(index).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo1/index.html`)
  const demo1 = await page.content()
  expect(demo1).toMatchSnapshot()
  expect(index).toBe(demo1)
  await server.close()
})

test('html_with_template_config1', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: '/test/demo/demo1/demo1.html',
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})

test('html_with_template_config2', async () => {
  const server = await createServer({
    configFile: false,
    // root: path.resolve(__dirname, './'),
    plugins: [
      VirtualHtml({
        pages: {
          demo1: {
            template: '/test/demo/demo1/demo1.html'
          },
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})

test('html_with_entry_config', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: {
            entry: '/test/demo/demo1/demo1.ts'
          },
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})

test('html_with_entry_and_template_config', async () => {

  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: {
            entry: '/test/demo/demo1/demo1.ts'
          },
          demo2: {
            template: '/test/demo/demo1/demo1.html',
          }
        },
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo2.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})

test('html_with_inject_code_demo1', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: '/test/demo/demo1/demo1.html',
        },
        injectCode: {
          'demo1.html': {
            pos: POS.before,
            find: '</head>',
            replacement: '<script>window.dd = "dd";</script>',
          }
        }
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})

test('html_with_inject_code_all_page', async () => {
  const server = await createServer({
    configFile: false,
    plugins: [
      VirtualHtml({
        pages: {
          demo1: '/test/demo/demo1/demo1.html',
          demo2: {
            template: '/test/demo/demo1/demo1.html',
          }
        },
        injectCode: {
          '*': {
            pos: POS.before,
            find: '</head>',
            replacement: '<script>window.dd = "dd";</script>',
          }
        }
      })
    ]
  })
  await server.listen()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await page.goto(`http://localhost:${server.config.server.port}/demo1.html`)
  expect(await page.content()).toMatchSnapshot()
  await server.close()
})
