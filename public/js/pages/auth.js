import { el, toast } from '../ui.js'
import { api } from '../api.js'
import { store } from '../store.js'

export function authpage(mode) {
  const islogin = mode === 'login'
  const errorbox = el('div', { class: 'error-box', style: 'display:none' })

  async function submit(e) {
    e.preventDefault()
    const form = e.target
    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true
    btn.textContent = islogin ? 'logging in…' : 'creating account…'
    errorbox.style.display = 'none'

    const data = Object.fromEntries(new FormData(form))
    try {
      const res = await api.post(`/api/auth/${islogin ? 'login' : 'register'}`, data)
      store.login(res.token, res.user)
      toast(islogin ? `welcome back, ${res.user.name}` : `welcome to fitnation, ${res.user.name}`)
      location.hash = '#/dashboard'
    } catch (err) {
      errorbox.textContent = err.message
      errorbox.style.display = 'block'
      btn.disabled = false
      btn.textContent = islogin ? 'log in' : 'create account'
    }
  }

  const form = el('form', { onsubmit: submit },
    errorbox,
    !islogin && el('div', { class: 'field' },
      el('label', {}, 'name'),
      el('input', { class: 'input', name: 'name', placeholder: 'what should we call you?', required: true, autocomplete: 'name' })),
    el('div', { class: 'field' },
      el('label', {}, 'email'),
      el('input', { class: 'input', name: 'email', type: 'email', placeholder: 'you@example.com', required: true, autocomplete: 'email' })),
    el('div', { class: 'field' },
      el('label', {}, 'password'),
      el('input', {
        class: 'input', name: 'password', type: 'password', required: true,
        placeholder: islogin ? 'your password' : 'at least 6 characters',
        autocomplete: islogin ? 'current-password' : 'new-password', minlength: 6,
      })),
    el('button', { class: 'btn primary lg full', type: 'submit' }, islogin ? 'log in' : 'create account'))

  return el('div', { class: 'auth-wrap page' },
    el('div', { class: 'orb', style: 'width:480px;height:480px;background:var(--volt);top:-160px;right:-100px' }),
    el('div', { class: 'orb', style: 'width:400px;height:400px;background:var(--sky);bottom:-140px;left:-80px;animation-delay:-8s' }),
    el('div', { class: 'auth-card' },
      el('a', { class: 'logo', href: '#/' }, el('span', { class: 'bolt' }, '⚡'), 'fitnation'),
      el('h2', {}, islogin ? 'welcome back' : 'join fitnation'),
      el('p', { class: 'sub' }, islogin ? 'pick up where you left off.' : 'your best season starts now.'),
      form,
      el('p', { class: 'swap' },
        islogin ? 'new here? ' : 'already have an account? ',
        el('a', { href: islogin ? '#/register' : '#/login' }, islogin ? 'create an account' : 'log in'))))
}
