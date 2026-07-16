# running fitnation

everything you need to run, develop, test and reset the app.

## requirements

- node 22.5 or newer (the app uses the built-in `node:sqlite` driver).
  check with `node --version`. no npm install needed, there are no
  dependencies.

## start the app

```bash
npm start
```

serves the app at http://localhost:4600. the sqlite database is created
and seeded (60 exercises, 36 foods) automatically on first boot at
`data/fitnation.db`.

## development mode

```bash
npm run dev
```

same as start, but the server restarts automatically when files in
`server/` change. frontend files in `public/` are read per-request, so
css/js changes only need a browser refresh, never a server restart.

heads up: the service worker caches the app shell. if a frontend change
doesn't show up, hard-refresh (cmd+shift+r), or in chrome devtools open
application > service workers and tick "update on reload" while developing.

## run the tests

```bash
npm test
```

31 integration tests. they spawn a real server on port 4699 with an
isolated database (`data/test.db`), so they never touch your real data.
takes under half a second.

## environment variables

| variable | default | purpose |
|----------|---------|---------|
| `port` | 4600 | http port |
| `fitnation_db` | `data/fitnation.db` | sqlite file path |
| `fitnation_secret` | dev fallback | hmac secret for auth tokens. set a real one for anything non-local |

example:

```bash
port=8080 fitnation_secret=$(openssl rand -hex 32) npm start
```

## reset all data

```bash
# stop the server first, then:
rm data/fitnation.db*
npm start
```

the wildcard matters: wal mode keeps three files (`.db`, `.db-wal`,
`.db-shm`). the database reseeds itself on next boot. this deletes every
account and all logged data, so be sure.

## common problems

**`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`**
your node is too old. upgrade to 22.5+.

**port already in use**
a previous instance is still alive. `lsof -i :4600` to find it, kill it,
or start on another port with `port=4601 npm start`.

**logged out unexpectedly**
tokens expire after 30 days, and changing `fitnation_secret` invalidates
all existing tokens. just log in again.

**blank page after an update**
stale service worker cache. hard-refresh, or clear site data in devtools.

**"open food facts is unreachable right now"**
the food picker's online search proxies openfoodfacts.org through the
server. it needs an internet connection and gives up after 6 seconds;
everything else in the app works fully offline from your local database.

## a note on deployment

this is a private, localhost-first build. before exposing it anywhere:
set a strong `fitnation_secret`, put it behind https, and read the
security notes in the project docs. it has no email flows, so password
recovery is not possible if you forget your password (you can change it
from the profile page while logged in).
