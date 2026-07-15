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
- **rest timer.** a countdown chip after every set (1:00 to 3:00, or off),
  with a beep when it's time to go again.
- **templates.** save any workout as a template and start it again with one
  tap, exercises pre-loaded.
- **exercise library.** 60+ curated movements with muscle targets, equipment
  tags, difficulty ratings and coaching cues, plus front/back muscle
  diagrams. add your own custom exercises too.
- **nutrition tracking.** a fast food database with macros per serving. log
  meals by slot and watch calories, protein, carbs and fat fill up live.
- **hydration.** tap a cup, stay on target.
- **progress analytics.** volume trends, bodyweight curves, muscle-split
  donuts, estimated one-rep maxes, a personal record board, training
  streaks, and a week-in-review report.
- **metric or imperial.** switch anytime in your profile. your data is
  stored canonically and converted on the fly.
- **your data is yours.** csv export of workouts, bodyweight and meals from
  the profile page.
- **installable pwa.** add it to your home screen. the app shell works
  offline and quick logs made without a connection sync when you're back.

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
| styling | one css file, custom properties, dark volt theme |
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

20 integration tests spin up a real server on a throwaway database and
drive the full api: auth, workouts, sets, templates, nutrition, stats,
exports, and cross-user isolation.

## license

private project. all rights reserved.
