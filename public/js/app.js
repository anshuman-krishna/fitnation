import { store } from './store.js'
import { el, toast } from './ui.js'
import { flushqueue, queued } from './api.js'
import { landing } from './pages/landing.js'
import { authpage } from './pages/auth.js'
import { dashboard } from './pages/dashboard.js'
import { workouts } from './pages/workouts.js'
import { session } from './pages/session.js'
import { exercises } from './pages/exercises.js'
import { nutrition } from './pages/nutrition.js'
import { progress } from './pages/progress.js'
import { profile } from './pages/profile.js'

const routes = [
  { path: /^\/$/, page: landing, public: true, bare: true },
  { path: /^\/login$/, page: () => authpage('login'), public: true, bare: true },
  { path: /^\/register$/, page: () => authpage('register'), public: true, bare: true },
  { path: /^\/dashboard$/, page: dashboard, nav: 'dashboard' },
  { path: /^\/workouts$/, page: workouts, nav: 'workouts' },
  { path: /^\/workouts\/(\d+)$/, page: session, nav: 'workouts' },
  { path: /^\/exercises$/, page: exercises, nav: 'exercises' },
  { path: /^\/nutrition$/, page: nutrition, nav: 'nutrition' },
  { path: /^\/progress$/, page: progress, nav: 'progress' },
  { path: /^\/profile$/, page: profile, nav: 'profile' },
]

const links = [
  ['dashboard', '⚡', 'dashboard'],
  ['workouts', '🏋️', 'workouts'],
  ['exercises', '📚', 'exercises'],
  ['nutrition', '🥗', 'nutrition'],
  ['progress', '📈', 'progress'],
  ['profile', '👤', 'profile'],
]

function shell(content, active) {
  const navlinks = links.map(([name, ico, path]) =>
    el('a', { class: `nav-link ${active === name ? 'active' : ''}`, href: `#/${path}` },
      el('span', { class: 'ico' }, ico), name))

  const sidebar = el('aside', { class: 'sidebar' },
    el('a', { class: 'logo', href: '#/dashboard' },
      el('span', { class: 'bolt' }, '⚡'), 'fitnation'),
    ...navlinks,
    el('div', { class: 'spacer' }),
    el('a', {
      class: 'nav-link', href: '#/', onclick: e => { e.preventDefault(); store.logout() },
    }, el('span', { class: 'ico' }, '↩'), 'log out'))

  const bottomnav = el('nav', { class: 'bottom-nav' },
    ...links.slice(0, 5).map(([name, ico, path]) =>
      el('a', { class: active === name ? 'active' : '', href: `#/${path}` },
        el('span', { class: 'ico' }, ico), name)),
    el('a', { class: active === 'profile' ? 'active' : '', href: '#/profile' },
      el('span', { class: 'ico' }, '👤'), 'you'))

  return el('div', { class: 'shell' }, sidebar,
    el('main', { class: 'main' }, content), bottomnav)
}

async function render() {
  const hash = location.hash.slice(1) || '/'
  const app = document.getElementById('app')

  for (const route of routes) {
    const match = route.path.exec(hash)
    if (!match) continue

    if (!route.public && !store.authed) {
      location.hash = '#/login'
      return
    }
    if (route.public && store.authed && hash !== '/') {
      location.hash = '#/dashboard'
      return
    }

    app.replaceChildren()
    const content = await route.page(...match.slice(1))
    app.replaceChildren(route.bare ? content : shell(content, route.nav))
    window.scrollTo(0, 0)
    return
  }

  location.hash = store.authed ? '#/dashboard' : '#/'
}

addEventListener('hashchange', render)
render()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}

addEventListener('online', async () => {
  if (!queued()) return
  const n = await flushqueue()
  if (n) {
    toast(`back online. synced ${n} queued ${n === 1 ? 'entry' : 'entries'}`)
    render()
  }
})

addEventListener('unhandledrejection', e => {
  if (e.reason && e.reason.message) {
    e.preventDefault()
    toast(e.reason.message, e.reason.queued ? 'info' : 'error')
  }
})
