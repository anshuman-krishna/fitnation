const db = require('../db')
const { authed } = require('../middleware')

module.exports = app => {
  app.get('/api/stats/dashboard', authed, (req, res) => {
    const uid = req.user.id
    const today = new Date().toISOString().slice(0, 10)

    const week = db.prepare(`
      select count(*) as workouts, coalesce(sum(v.volume), 0) as volume
      from workouts w
      left join (select workout_id, sum(weight * reps) as volume from sets group by workout_id) v
        on v.workout_id = w.id
      where w.user_id = ? and w.started >= date('now', '-6 days')
    `).get(uid)

    const total = db.prepare('select count(*) as n from workouts where user_id = ?').get(uid)

    const days = db.prepare(`
      select distinct date(started) as d from workouts where user_id = ?
      order by d desc limit 60
    `).all(uid).map(r => r.d)
    let streak = 0
    const cursor = new Date()
    if (!days.includes(today)) cursor.setDate(cursor.getDate() - 1)
    while (days.includes(cursor.toISOString().slice(0, 10))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }

    const meals = db.prepare(`
      select coalesce(sum(f.cal * m.qty), 0) as cal, coalesce(sum(f.protein * m.qty), 0) as protein
      from meals m join foods f on f.id = m.food_id
      where m.user_id = ? and m.date = ?
    `).get(uid, today)

    const water = db.prepare('select coalesce(sum(ml), 0) as ml from water where user_id = ? and date = ?')
      .get(uid, today)

    const weight = db.prepare('select kg, date from weights where user_id = ? order by date desc limit 1')
      .get(uid)

    const recent = db.prepare(`
      select w.*, count(s.id) as set_count, coalesce(sum(s.weight * s.reps), 0) as volume
      from workouts w left join sets s on s.workout_id = w.id
      where w.user_id = ?
      group by w.id order by w.started desc limit 5
    `).all(uid)

    res.json(200, {
      week, total: total.n, streak,
      today: { cal: meals.cal, protein: meals.protein, water: water.ml },
      weight: weight || null,
      recent,
    })
  })

  app.get('/api/stats/volume', authed, (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 30, 365)
    const rows = db.prepare(`
      select date(w.started) as date, coalesce(sum(s.weight * s.reps), 0) as volume, count(distinct w.id) as workouts
      from workouts w left join sets s on s.workout_id = w.id
      where w.user_id = ? and w.started >= date('now', ?)
      group by date(w.started) order by date
    `).all(req.user.id, `-${days} days`)
    res.json(200, { volume: rows })
  })

  app.get('/api/stats/muscles', authed, (req, res) => {
    const rows = db.prepare(`
      select e.muscle, count(s.id) as sets, coalesce(sum(s.weight * s.reps), 0) as volume
      from sets s
      join exercises e on e.id = s.exercise_id
      join workouts w on w.id = s.workout_id
      where w.user_id = ? and w.started >= date('now', '-30 days')
      group by e.muscle order by sets desc
    `).all(req.user.id)
    res.json(200, { muscles: rows })
  })

  app.get('/api/stats/calories', authed, (req, res) => {
    const days = Math.min(parseInt(req.query.days) || 14, 90)
    const rows = db.prepare(`
      select m.date, sum(f.cal * m.qty) as cal, sum(f.protein * m.qty) as protein,
        sum(f.carbs * m.qty) as carbs, sum(f.fat * m.qty) as fat
      from meals m join foods f on f.id = m.food_id
      where m.user_id = ? and m.date >= date('now', ?)
      group by m.date order by m.date
    `).all(req.user.id, `-${days} days`)
    res.json(200, { calories: rows })
  })

  app.get('/api/stats/report', authed, (req, res) => {
    const uid = req.user.id

    const weekagg = (from, to) => db.prepare(`
      select count(distinct w.id) as workouts, coalesce(sum(s.weight * s.reps), 0) as volume,
        count(s.id) as sets
      from workouts w left join sets s on s.workout_id = w.id
      where w.user_id = ? and w.started >= datetime('now', ?) and w.started < datetime('now', ?)
    `).get(uid, from, to)

    const thisweek = weekagg('-7 days', '+1 day')
    const lastweek = weekagg('-14 days', '-7 days')

    const prior = db.prepare(`
      select count(distinct w.id) as workouts, coalesce(sum(s.weight * s.reps), 0) / 3.0 as volume
      from workouts w left join sets s on s.workout_id = w.id
      where w.user_id = ? and w.started >= datetime('now', '-28 days') and w.started < datetime('now', '-7 days')
    `).get(uid)
    const deload = {
      baseline: Math.round(prior.volume),
      flagged: prior.workouts >= 3 && prior.volume > 0 && thisweek.volume < prior.volume * 0.6,
    }

    const nutrition = db.prepare(`
      select count(*) as days_logged, coalesce(avg(cal), 0) as avg_cal,
        coalesce(avg(protein), 0) as avg_protein
      from (
        select m.date, sum(f.cal * m.qty) as cal, sum(f.protein * m.qty) as protein
        from meals m join foods f on f.id = m.food_id
        where m.user_id = ? and m.date >= date('now', '-6 days')
        group by m.date
      )
    `).get(uid)

    const latest = db.prepare('select kg, date from weights where user_id = ? order by date desc limit 1').get(uid)
    const weekago = db.prepare(`
      select kg, date from weights where user_id = ? and date <= date('now', '-7 days')
      order by date desc limit 1
    `).get(uid) || db.prepare('select kg, date from weights where user_id = ? order by date asc limit 1').get(uid)

    const prs = db.prepare(`
      select e.name, max(s.weight) as weight from sets s
      join exercises e on e.id = s.exercise_id
      join workouts w on w.id = s.workout_id
      where w.user_id = ? and s.weight > 0
      group by e.id
      having max(case when s.created >= datetime('now', '-7 days') then s.weight else 0 end) >= max(s.weight)
    `).all(uid)

    res.json(200, {
      this_week: thisweek,
      last_week: lastweek,
      deload,
      nutrition,
      weight: { latest: latest || null, previous: weekago || null },
      prs_this_week: prs,
    })
  })

  app.get('/api/stats/prs', authed, (req, res) => {
    const rows = db.prepare(`
      select e.name, e.muscle, max(s.weight) as max_weight,
        max(s.weight * (1 + s.reps / 30.0)) as est_1rm, count(s.id) as total_sets
      from sets s
      join exercises e on e.id = s.exercise_id
      join workouts w on w.id = s.workout_id
      where w.user_id = ? and s.weight > 0
      group by e.id order by est_1rm desc limit 10
    `).all(req.user.id)
    res.json(200, { prs: rows })
  })
}
