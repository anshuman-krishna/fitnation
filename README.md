# ⚡ fitnation

train harder. track everything.

fitnation is your entire fitness life in one fast, beautiful app: workouts,
nutrition, hydration, bodyweight and progress analytics. no ads, no fluff,
just gains.

built with zero dependencies. the backend is pure node stdlib, the frontend
is a hand-rolled vanilla js spa, and the database is sqlite via node's
built-in driver. no build step, no framework, nothing to install. clone it,
start it, train.

## features

- **workout logging.** log every set, rep and kilo in seconds. live session
  timer, per-exercise history, automatic volume math while you train.
- **progressive overload hints.** every exercise shows your top set from
  last time, with a one-tap "try +2.5" nudge to beat it.
- **supersets.** link exercises in the logger and they're grouped, saved,
  and restored together.
- **plate calculator.** tap the barbell icon on any exercise and see exactly
  which plates to load per side.
- **rest timer.** a countdown chip after every set (1:00 to 3:00, or off),
  with a beep, a toast, and a browser notification if you've tabbed away.
  set a different duration per exercise if you like.
- **templates.** save any workout as a template, start it with one tap,
  and edit it later: rename, reorder, add or remove exercises. one-tap
  repeat on any past workout too.
- **exercise library.** 60+ curated movements with muscle targets, equipment
  tags, difficulty ratings and coaching cues, plus front/back muscle
  diagrams. add your own custom exercises too.
- **exercise substitutions.** machine taken? every exercise suggests similar
  movements by muscle and equipment, and unlogged exercises can be swapped
  mid-session with one tap.
- **live pr detection.** the moment a set beats your all-time best for that
  exercise, the logger celebrates it. no digging through history to find out.
- **share cards.** turn any finished workout into a shareable image: volume,
  sets and top lifts on a clean dark card, rendered locally, no upload.
  your pr board and week-in-review share the same way.
- **training year heatmap.** a 12-month calendar of every day you showed up,
  shaded by volume. fill the squares.
- **nutrition tracking.** a fast food database with macros per serving. log
  meals by slot and watch calories, protein, carbs and fat fill up live.
  copy yesterday's meals per slot, or save a slot as a reusable recipe and
  log the whole thing with one tap.
- **open food facts search.** if a food isn't in the local database, search
  the open food facts catalog from the picker and log it; macros come in
  per 100 g and the food is saved for next time.
- **barcode scanning.** point your camera at a package in the food picker
  and the product's macros come straight from open food facts. no camera
  support? type the digits instead.
- **hydration.** tap a cup, stay on target.
- **progress analytics.** volume trends, bodyweight curves, muscle-split
  donuts, estimated one-rep maxes, a personal record board, training
  streaks, 7-day rolling averages, and a week-in-review report.
- **deload watch.** if this week's volume drops sharply below your 3-week
  average, the week-in-review says so, whether it's a planned deload or a
  slipping schedule.
- **body measurements.** track waist, chest, arms and more, each with its
  own chart.
- **metric or imperial.** switch anytime in your profile. your data is
  stored canonically and converted on the fly.
- **dark or light.** volt-on-black by default, a clean light theme one
  toggle away.
- **keyboard shortcuts.** press n to start a workout, / to search.
- **your data is yours.** csv export of workouts, bodyweight and meals from
  the profile page, csv import to restore them, and full account deletion
  when you want out. bodyweight and workout history from an apple health
  export (export.xml) import too.
- **installable pwa.** add it to your home screen, with app shortcuts to
  jump straight into a workout, a meal or a weigh-in. the app shell works
  offline and quick logs (and deletes) made without a connection sync when
  you're back.
- **hardened by default.** strict input validation on every endpoint, login
  throttling, and security headers (csp, nosniff, frame denial) on every
  response.

## quick start

```bash
npm start
```

that's it. open http://localhost:4600, create an account, and start
training. requires node 22.5 or newer (built and tested on node 26).

see [RUNNING.md](RUNNING.md) for dev mode, tests, environment variables,
and troubleshooting.

## stack

| layer | choice |
|-------|--------|
| server | node:http, hand-rolled router and middleware |
| database | sqlite via node:sqlite, wal mode |
| auth | scrypt password hashing, hmac-signed tokens |
| frontend | vanilla es modules, hash routing, svg charts |
| styling | one css file, custom properties, dark + light themes |
| dependencies | zero |

## project layout

```
server/     backend: router, middleware, auth, db, api routes
public/     frontend: spa pages, design system, pwa assets
test/       integration tests (node:test, real server, isolated db)
data/       runtime sqlite database (gitignored)
```

## testing

```bash
npm test
```

38 integration tests spin up a real server on a throwaway database and
drive the full api: auth, workouts, sets, supersets, templates, nutrition,
recipes, measurements, stats, deload detection, exercise substitutions,
exports, imports, account deletion, cross-user isolation, input validation
limits, login throttling, and security headers.

## license

private project. all rights reserved.
