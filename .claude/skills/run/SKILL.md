---
name: run
description: launch fitnation locally and verify changes in a real browser. use when asked to run the app, screenshot it, or confirm a frontend change works end to end.
---

# running fitnation

## start the server

```bash
port=4641 fitnation_db=<scratchpad>/run.db node server/index.js
```

run it in the background from the repo root. wait for the stdout line
`fitnation running at http://localhost:4641`. use a scratchpad db path so
real data at `data/fitnation.db` is never touched. frontend files are read
per-request, so after editing `public/` just reload the browser, never
restart the server.

## drive it in a browser

playwright is NOT a project dependency and must never be added to
package.json. install it ad hoc in the session scratchpad:

```bash
cd <scratchpad> && npm init -y && npm install playwright && npx playwright install chromium
```

then write a node script using `require('playwright')` that:

1. registers a fresh account (`#/register`, unique email per run, three inputs: name, email, password)
2. drives the flows under test
3. collects `pageerror` and console `error` events and fails if any fire (ignore favicon noise)

## timing gotchas

- `.page` rises over 350ms and modals pop over 220ms; wait ~300-800ms after navigation or modal open before screenshots or text assertions
- `.session-timer` also matches the hidden rest chip; prefer `button:has-text("+ add exercise")` to detect the session page
- the keyboard shortcut `n` (new workout) needs focus outside inputs and a settled dashboard; wait ~600ms after login

## cleanup

kill the background server and leave the scratchpad db behind; nothing in
the repo is modified by a run.
