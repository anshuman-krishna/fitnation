const crypto = require('node:crypto')

const secret = process.env.fitnation_secret || 'fitnation-dev-secret-change-in-prod'

function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${key}`
}

function verify(password, stored) {
  const [salt, key] = stored.split(':')
  const candidate = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(candidate, 'hex'))
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

function decode(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function issue(user) {
  return sign({ id: user.id, email: user.email, exp: Date.now() + 30 * 24 * 3600 * 1000 })
}

module.exports = { hash, verify, issue, decode }
