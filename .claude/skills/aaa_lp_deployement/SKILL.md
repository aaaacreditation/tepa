---
name: aaa_lp_deployement
description: Commit and deploy the AAA landing pages (/tepa, /healthcare, /clinic) to production at campaigns.aaa-accreditation.org in one pass. Use whenever the user wants to deploy, ship, publish, push live, release, or "make it live" — or says the live site still shows the old version. Handles the local build gate, the commit, the push to main, the git pull and rebuild on the Hetzner server, the service restart, and verification that the new bytes are actually being served. Always prefer this over running git commit/push by hand: a push alone changes nothing on this server.
---

# Deploy the AAA landing pages

One command's worth of intent — "deploy" — covers five steps that must all
happen, in order. Skipping any of them is how the site ends up serving code
nobody pushed.

## The one fact that explains every past confusion

**Pushing to GitHub does not deploy anything.** There is no CI in this repo and
the domain is not on Vercel. Production is a Hetzner box that has to be told to
pull and rebuild. If someone reports "I still see the old page", it is almost
always because only step 3 of 5 below was done.

```
GitHub (origin/main) ──push──> nothing happens on its own
                                        │
       campaigns.aaa-accreditation.org ─┘  DNS → 2.28.26.33 (Hetzner, Falkenstein)
                                            nginx :443 ──proxy──> 127.0.0.1:3000
                                            systemd tepa.service
                                            /opt/tepa/app  (git checkout, branch `live`)
```

## Production facts

| | |
|---|---|
| Host | `root@2.28.26.33` (`ubuntu-4gb-fsn1-1`) |
| SSH key | `~/.ssh/tepa_hetzner_ed25519` — key auth works, **never use a password** |
| App dir | `/opt/tepa/app` |
| Branch | `live`, tracking `origin/main` |
| Service | `tepa.service` (`next start -H 127.0.0.1 -p 3000`), runs as user `tepa` |
| Domain | `https://campaigns.aaa-accreditation.org` |
| Routes | `/tepa`, `/healthcare`, `/clinic` |
| Repo | `https://github.com/aaaacreditation/tepa` (public — no deploy key needed) |

## Deploy

### 1. Gate on a local build — before committing anything

The server rebuilds from source. A broken build there leaves the old process
running and the deploy silently does nothing, so catch it locally first.

```bash
npx tsc --noEmit && npm run build
```

Do not continue if either fails.

### 2. Commit

Stage deliberately — never `git add -A` blind, and never commit `.env*`.

```bash
git status --short
git add <paths>
git commit    # imperative subject, sentence case, no trailing period
```

End every commit message with:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: <session url>
```

### 3. Push

**Check the active GitHub account first.** The keyring holds several; git takes
credentials from whichever `gh` says is active, and `mounirbennassar` has no
write access here — it fails with `403 Permission to aaaacreditation/tepa.git
denied`.

```bash
gh auth status --active          # must be: aaaacreditation
gh auth switch --hostname github.com --user aaaacreditation   # if it is not
git push origin main
```

### 4. Deploy to the server

```bash
ssh -i ~/.ssh/tepa_hetzner_ed25519 root@2.28.26.33 '
  set -e
  cd /opt/tepa/app
  tar czf /root/tepa-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
      --exclude=node_modules --exclude=.next app lib public package.json 2>/dev/null || true
  git fetch origin main
  git checkout -B live origin/main
  sudo -u tepa npm ci --no-audit --no-fund
  sudo -u tepa npm run build
  systemctl restart tepa.service
'
```

Why each line is the way it is:

- **Build as `tepa`, not root.** Everything under `/opt/tepa/app` is
  `tepa:tepa`. Building as root leaves a root-owned `.next` that the service
  user cannot replace on the next deploy.
- **`git checkout -B live origin/main`** rather than `git pull`, so the branch
  is reset to the remote even if the server ever drifts again.
- **`npm ci`, not `npm install`** — installs exactly the lockfile.
- **The tar first.** It is a few seconds and it is the only rollback that does
  not depend on git being intact.

### 5. Verify — the deploy is not done until this passes

```bash
# service came back
ssh -i ~/.ssh/tepa_hetzner_ed25519 root@2.28.26.33 \
  'systemctl is-active tepa.service; cd /opt/tepa/app && git rev-parse --short HEAD'

# every route answers through the public domain
for p in / /tepa /healthcare /clinic; do
  printf "%-12s %s\n" "$p" \
    "$(curl -sS -o /dev/null -w '%{http_code}' https://campaigns.aaa-accreditation.org$p --max-time 20)"
done
```

Then confirm the *content* changed, not just that something returned 200 — a
stale process also returns 200. Grep the live HTML for a string that only
exists in the new code:

```bash
curl -sS https://campaigns.aaa-accreditation.org/clinic | grep -c '<some-new-class>'
```

The server SHA must equal `git rev-parse --short origin/main` locally.

## When it goes wrong

**Live page unchanged after a successful deploy.** Check the process start
time — `systemctl show tepa.service -p ActiveEnterTimestamp --value`. If it is
old, the restart did not happen. If it is new, you are looking at a cached
response; the app sets `Cache-Control: s-maxage=31536000`, so re-request with
`-H 'Cache-Control: no-cache'`.

**`dubious ownership in repository`.** Root running git over a `tepa`-owned
checkout. Already configured, but if it returns:
`git config --global --add safe.directory /opt/tepa/app`.

**Build fails on the server.** The old process is still serving, so the site is
fine — do not restart. Fix, push, redeploy. The box has 3.7 GB RAM and builds
with 1 worker; an OOM shows as a killed build with no error.

**Rollback.**

```bash
ssh -i ~/.ssh/tepa_hetzner_ed25519 root@2.28.26.33 '
  cd /opt/tepa/app
  git checkout -B live <last-good-sha>
  sudo -u tepa npm ci && sudo -u tepa npm run build
  systemctl restart tepa.service
'
```

Backups: `ls -lh /root/tepa-backup-*.tar.gz`.

## Never

- **Never touch `/opt/tepa/app/.env`.** It is mode 600, `tepa`-owned, gitignored
  and holds the database URL and Google Ads credentials. `.env.local` is a
  symlink to it. Nothing in a deploy should write either.
- **Never authenticate with a root password**, even if one is offered. Key auth
  works. A password pasted into a session is a credential that has to be
  rotated.
- **Never deploy a branch other than `main`** without saying so explicitly. The
  server's `live` branch tracks `origin/main`; pointing it elsewhere is how the
  site ends up serving something no one can find in the default branch.

## History worth knowing

Until 21 Aug 2026 `/opt/tepa/app` was **not** a git checkout — files were
uploaded by hand. The `/clinic` page that ran in production for a week existed
in no repository. It was recovered onto branch `clinic-readiness-quiz`
(`ca90521`) before `main` was deployed over it. If a page ever appears live that
is not in `git log --all`, check that branch and `/root/tepa-backup-*.tar.gz`
before assuming it is lost.
