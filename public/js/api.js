const base = ''
const queuekey = 'fitnation_queue'
const queueable = [/^\/api\/water$/, /^\/api\/meals$/, /^\/api\/weights$/, /^\/api\/workouts\/\d+\/sets$/]

function token() {
  return localStorage.getItem('fitnation_token')
}

function enqueue(path, data) {
  const q = JSON.parse(localStorage.getItem(queuekey) || '[]')
  q.push({ path, data, at: Date.now() })
  localStorage.setItem(queuekey, JSON.stringify(q))
}

export function queued() {
  return JSON.parse(localStorage.getItem(queuekey) || '[]').length
}

export async function flushqueue() {
  const q = JSON.parse(localStorage.getItem(queuekey) || '[]')
  let synced = 0
  while (q.length) {
    try {
      await request('POST', q[0].path, q[0].data, false)
      q.shift()
      synced++
      localStorage.setItem(queuekey, JSON.stringify(q))
    } catch (err) {
      if (err.network) break
      q.shift()
      localStorage.setItem(queuekey, JSON.stringify(q))
    }
  }
  return synced
}

async function request(method, path, data, mayqueue = true) {
  const opts = {
    method,
    headers: { 'content-type': 'application/json' },
  }
  const t = token()
  if (t) opts.headers.authorization = `Bearer ${t}`
  if (data !== undefined) opts.body = JSON.stringify(data)

  let res
  try {
    res = await fetch(base + path, opts)
  } catch {
    if (mayqueue && method === 'POST' && queueable.some(rx => rx.test(path))) {
      enqueue(path, data)
      const err = new Error('offline. saved locally, will sync when you reconnect')
      err.network = true
      err.queued = true
      throw err
    }
    const err = new Error('offline. check your connection')
    err.network = true
    throw err
  }

  const json = await res.json().catch(() => ({}))
  if (res.status === 401 && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/password')) {
    localStorage.removeItem('fitnation_token')
    localStorage.removeItem('fitnation_user')
    location.hash = '#/login'
    throw new Error('session expired')
  }
  if (!res.ok) throw new Error(json.error || `request failed (${res.status})`)
  return json
}

export async function download(path) {
  const res = await fetch(base + path, { headers: { authorization: `Bearer ${token()}` } })
  if (!res.ok) throw new Error(`export failed (${res.status})`)
  const blob = await res.blob()
  const name = (res.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name ? name[1] : 'export.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export const api = {
  get: path => request('GET', path),
  post: (path, data) => request('POST', path, data),
  patch: (path, data) => request('PATCH', path, data),
  delete: path => request('DELETE', path),
}
