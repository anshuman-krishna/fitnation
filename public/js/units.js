import { store } from './store.js'

const factor = 2.2046226218

export const imperial = () => (store.user && store.user.units) === 'imperial'

export const wtunit = () => imperial() ? 'lb' : 'kg'

export const showwt = kg => {
  const v = imperial() ? kg * factor : kg
  return Math.round(v * 10) / 10
}

export const inkg = v => imperial() ? v / factor : v
