export const store = {
  get user() {
    try {
      return JSON.parse(localStorage.getItem('fitnation_user'))
    } catch {
      return null
    }
  },

  set user(u) {
    if (u) localStorage.setItem('fitnation_user', JSON.stringify(u))
    else localStorage.removeItem('fitnation_user')
  },

  get token() {
    return localStorage.getItem('fitnation_token')
  },

  login(token, user) {
    localStorage.setItem('fitnation_token', token)
    this.user = user
  },

  logout() {
    localStorage.removeItem('fitnation_token')
    localStorage.removeItem('fitnation_user')
    location.hash = '#/'
  },

  get authed() {
    return !!this.token
  },
}
