const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const router = require('./router')
const { decorate, body, logger, ratelimit } = require('./middleware')

const app = new router()
app.use(logger)
app.use(ratelimit)
app.use(body)

require('./routes/auth')(app)
require('./routes/workouts')(app)
require('./routes/exercises')(app)
require('./routes/nutrition')(app)
require('./routes/metrics')(app)
require('./routes/stats')(app)
require('./routes/templates')(app)
require('./routes/export')(app)
require('./routes/recipes')(app)
require('./routes/import')(app)

const publicdir = path.join(__dirname, '..', 'public')
const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.json': 'application/json',
}

function serve(req, res) {
  const url = new URL(req.url, 'http://x')
  let file = path.normalize(path.join(publicdir, url.pathname))
  if (file !== publicdir && !file.startsWith(publicdir + path.sep)) {
    res.writeHead(403)
    return res.end()
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(publicdir, 'index.html')
  }
  const ext = path.extname(file)
  res.writeHead(200, {
    'content-type': mime[ext] || 'application/octet-stream',
    'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  })
  fs.createReadStream(file).pipe(res)
}

const server = http.createServer(async (req, res) => {
  decorate(req, res)
  if (req.url.startsWith('/api/')) {
    const handled = await app.handle(req, res)
    if (!handled) res.json(404, { error: 'not found' })
  } else {
    serve(req, res)
  }
})

const port = process.env.port || 4600
server.listen(port, () => {
  console.log(`fitnation running at http://localhost:${port}`)
})
