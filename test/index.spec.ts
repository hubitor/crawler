import MockServer from 'mock-http-server'
import Crawler from '../src'

const server = new MockServer({ host: 'localhost', port: 9000 }, null)

const createPage = (id: string) => {
  server.on({
    method: 'GET',
    path: `/${id}`,
    reply: {
      status: 200,
      headers: { 'content-type': 'text/html' },
      body: `<div id="node">${id}</div>`
    }
  })
  return `http://localhost:9000/${id}`
}

beforeEach(done => {
  server.start(done)
})

afterEach(done => {
  server.stop(done)
})

describe('Crawler', () => {
  it('new', async () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })

    expect(crawler).toBeInstanceOf(Crawler)
  })
})

describe('launch and close', () => {
  it('launch and close', async () => {
    const pageNames = ['test', 'demo']
    const urls = pageNames.map(createPage)
    const crawler = new Crawler({
      parallel: 1,
      pageEvaluate: () => {
        return document.querySelector('#node').innerHTML
      }
    })
    crawler.queue(urls)
    await crawler.launch()
    const result = await crawler.start()
    await crawler.close()
    result.map(({ url, result }) => {
      expect(url.includes(result)).toBeTruthy()
    })
  })
})

describe('queue', () => {
  it('queue url', () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        return location.href
      }
    })
    crawler.queue('https://baidu.com')
    expect(crawler.urls.length).toBe(1)
    expect(crawler.urls[0]).toBe('https://baidu.com')
  })

  it('queue invalid url', () => {
    const crawler = new Crawler({
      pageEvaluate: () => {
        console.log(location.href)
      }
    })
    crawler.queue('baidu.com')
    expect(crawler.urls.length).toBe(0)
  })
})

describe('next', () => {
  it('next', async () => {
    const pageNames = ['test', 'demo']
    const urls = pageNames.map(createPage)
    const crawler = new Crawler({
      parallel: 2,
      next: (result, page) => {
        if (!pageNames.includes('xxx')) {
          pageNames.push('xxx')
          crawler.queue(createPage('xxx'))
        }
      },
      pageEvaluate: () => {
        return document.querySelector('#node').innerHTML
      }
    })
    crawler.queue(urls)
    await crawler.launch()
    const result = await crawler.start()
    await crawler.close()
    expect(result.length).toBe(3)
  })
})
