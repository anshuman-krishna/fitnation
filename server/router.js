class router {
  constructor() {
    this.routes = []
    this.middlewares = []
  }

  use(fn) {
    this.middlewares.push(fn)
    return this
  }

  add(method, pattern, ...handlers) {
    const keys = []
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, m => {
      keys.push(m.slice(1))
      return '([^/]+)'
    }) + '/?$')
    this.routes.push({ method, regex, keys, handlers })
    return this
  }

  get(p, ...h) { return this.add('GET', p, ...h) }
  post(p, ...h) { return this.add('POST', p, ...h) }
  put(p, ...h) { return this.add('PUT', p, ...h) }
  patch(p, ...h) { return this.add('PATCH', p, ...h) }
  delete(p, ...h) { return this.add('DELETE', p, ...h) }

  async handle(req, res) {
    const url = new URL(req.url, 'http://x')
    req.path = url.pathname
    req.query = Object.fromEntries(url.searchParams)

    for (const route of this.routes) {
      if (route.method !== req.method) continue
      const match = route.regex.exec(req.path)
      if (!match) continue
      req.params = {}
      route.keys.forEach((k, i) => { req.params[k] = decodeURIComponent(match[i + 1]) })

      const chain = [...this.middlewares, ...route.handlers]
      let i = 0
      const next = async () => {
        const fn = chain[i++]
        if (fn) await fn(req, res, next)
      }
      try {
        await next()
      } catch (err) {
        console.error(err)
        if (!res.headersSent) res.json(500, { error: 'internal server error' })
      }
      return true
    }
    return false
  }
}

module.exports = router
