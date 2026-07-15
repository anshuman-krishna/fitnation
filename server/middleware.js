const { decode } = require('./auth')

function decorate(req, res) {
  res.json = (status, data) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(data))
  }
}

async function body(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') return next()
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 1e6) return res.json(413, { error: 'payload too large' })
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString()
  try {
    req.body = raw ? JSON.parse(raw) : {}
  } catch {
    return res.json(400, { error: 'invalid json' })
  }
  next()
}

function logger(req, res, next) {
  const start = performance.now()
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1)
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`)
  })
  next()
}

const buckets = new Map()
function ratelimit(req, res, next) {
  const ip = req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const bucket = buckets.get(ip) || { count: 0, reset: now + 60000 }
  if (now > bucket.reset) {
    bucket.count = 0
    bucket.reset = now + 60000
  }
  bucket.count++
  buckets.set(ip, bucket)
  if (bucket.count > 300) return res.json(429, { error: 'too many requests' })
  next()
}

function authed(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const payload = decode(token)
  if (!payload) return res.json(401, { error: 'unauthorized' })
  req.user = payload
  next()
}

module.exports = { decorate, body, logger, ratelimit, authed }
