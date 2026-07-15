import { el } from '../ui.js'
import { store } from '../store.js'

const features = [
  ['🏋️', 'var(--volt-glow)', 'workout logging', 'log every set, rep and kilo in seconds. live session timer, per-exercise history, and automatic volume math while you train.'],
  ['📚', 'rgba(86,184,255,0.12)', 'exercise library', '60+ curated movements with muscle targets, equipment tags, difficulty ratings and coaching cues written by lifters, for lifters.'],
  ['🥗', 'rgba(74,222,128,0.12)', 'nutrition tracking', 'a fast food database with macros per serving. log meals by slot, watch calories, protein, carbs and fat fill up in real time.'],
  ['💧', 'rgba(86,184,255,0.12)', 'hydration', 'tap a cup, stay on target. daily water goals that follow you across every device.'],
  ['📈', 'rgba(167,139,250,0.12)', 'progress analytics', 'volume trends, bodyweight curves, muscle-split donuts and estimated one-rep maxes. every chart you need, zero you don\'t.'],
  ['🔥', 'rgba(255,107,74,0.12)', 'streaks & prs', 'training streaks that keep you honest and a personal-record board that keeps you hungry.'],
]

export function landing() {
  const authed = store.authed
  const cta = authed ? '#/dashboard' : '#/register'

  const page = el('div', { class: 'landing page' })

  page.append(
    el('div', { class: 'orb', style: 'width:520px;height:520px;background:var(--volt);top:-180px;left:-120px' }),
    el('div', { class: 'orb', style: 'width:420px;height:420px;background:var(--sky);top:220px;right:-160px;animation-delay:-6s' }),
    el('div', { class: 'orb', style: 'width:380px;height:380px;background:var(--violet);bottom:-100px;left:30%;animation-delay:-12s' }))

  page.append(el('nav', { class: 'landing-nav' },
    el('a', { class: 'logo', href: '#/', style: 'padding:0' },
      el('span', { class: 'bolt' }, '⚡'), 'fitnation'),
    el('div', { class: 'flex' },
      authed
        ? el('a', { class: 'btn primary', href: '#/dashboard' }, 'open app')
        : el('div', { class: 'flex' },
            el('a', { class: 'btn ghost', href: '#/login' }, 'log in'),
            el('a', { class: 'btn primary', href: '#/register' }, 'get started')))))

  page.append(el('section', { class: 'hero' },
    el('span', { class: 'eyebrow' }, el('span', { class: 'dot' }), 'v2, rebuilt from zero'),
    el('h1', { html: 'train harder.<br>track <span class="accent">everything.</span>' }),
    el('p', { class: 'lede' },
      'fitnation is your entire fitness life in one fast, beautiful place: workouts, nutrition, hydration, bodyweight and progress analytics. no ads, no fluff, just gains.'),
    el('div', { class: 'cta-row' },
      el('a', { class: 'btn primary lg', href: cta }, authed ? 'go to dashboard →' : 'start free →'),
      el('a', { class: 'btn lg', href: '#features' }, 'see features'))))

  page.append(el('div', { class: 'marquee-stats' },
    ...[['60+', 'exercises'], ['36+', 'foods with macros'], ['0ms', 'bloat'], ['100%', 'yours']].map(([n, l]) =>
      el('div', { class: 'ms' }, el('div', { class: 'n' }, n), el('div', { class: 'l' }, l)))))

  page.append(el('section', { class: 'features', id: 'features' },
    el('h2', {}, 'everything you need. nothing you don\'t.'),
    el('p', { class: 'sub' }, 'six tools, one app, zero friction.'),
    el('div', { class: 'grid cols-3' },
      ...features.map(([ico, bg, title, desc]) =>
        el('div', { class: 'feature-card' },
          el('div', { class: 'fico', style: `background:${bg}` }, ico),
          el('h3', {}, title),
          el('p', {}, desc))))))

  page.append(el('section', { class: 'hero', style: 'padding-top:20px' },
    el('h2', { style: 'font-size:clamp(26px,4vw,40px);letter-spacing:-0.03em' }, 'your best season starts today.'),
    el('div', { class: 'cta-row', style: 'margin-top:28px' },
      el('a', { class: 'btn primary lg', href: cta }, authed ? 'open the app →' : 'create your account →'))))

  page.append(el('footer', { class: 'landing-footer' },
    `⚡ fitnation. built for people who show up. ${new Date().getFullYear()}`))

  return page
}
