---
name: aaa_lp_deployement
description: Commit, push and deploy the AAA landing pages (/tepa, /healthcare, /clinic and the Accredited Provider Fast Track page) to production at campaigns.aaa-accreditation.org on the Hetzner box, then prove the new bytes are actually being served. Use whenever the user is working in the aaaacreditation/tepa repo and says deploy, commit and deploy, ship, publish, push live, release, "make it live", "send it to the server", or reports that the live site still shows the old page or that a deploy "did nothing". This pipeline is non-obvious — there is NO CI, the domain is NOT on Vercel, and a git push on its own changes nothing on the server — so always prefer this over running git commit/push by hand. Distinct from clinicovia-deploy and myclinicwebsite_deployement, which belong to different products; use this one whenever the repo is aaaacreditation/tepa.
---

# Deploy the AAA landing pages

One word of intent — "deploy" — covers five steps that must all happen, in
order. Skipping any of them is how the site ends up serving code nobody pushed.

## The one fact that explains every past confusion

**Pushing to GitHub does not deploy anything.** There is no CI in this repo and
the domain is not on Vercel. Production is a Hetzner box that has to be told to
pull and rebuild. If someone reports "I still see the old page", it is almost
always because only step 3 of 5 was done.

```
GitHub (origin/main) ──push──> nothing happens on its own
                                        │
       campaigns.aaa-accreditation.org ─┘  DNS → 2.28.26.33 (Hetzner, Falkenstein)
                                            nginx :443 ──proxy──> 127.0.0.1:3000
                                            systemd tepa.service
                                            /opt/tepa/app  (git checkout, branch `live`)
```

## Work from the right copy — check this first

The project was moved out of iCloud in September 2026. Three directories on this
Mac contain a `tepa` git remote and **only one of them is real**:

| Path | Use it? |
|---|---|
| `/Users/mounirbennassar/projects/Clients/AAA/marketing/lps/tepa` | **YES — the live working copy** |
| `~/Documents/Clients/AAA/marketing/lps/tepa` | No. iCloud-evicted, `git log` returns `fatal: bad object HEAD` |
| `~/projects/_old_copies/AAA-tepa_clone_from_github` | No. Stale read-only clone, no unpushed work |

`cd` to the first one before anything else. If a "deploy" seems to have no
local changes to send, confirm you are not sitting in one of the other two.

## Production facts

| | |
|---|---|
| Host | `root@2.28.26.33` (`ubuntu-4gb-fsn1-1`, Ubuntu 26.04, 4 GB) |
| SSH key | `~/.ssh/tepa_hetzner_ed25519` — key auth works, **never use a password** |
| App dir | `/opt/tepa/app`, owned `tepa:tepa` |
| Branch | `live`, tracking `origin/main` |
| Service | `tepa.service` (`next start -H 127.0.0.1 -p 3000`), runs as user `tepa` |
| Domain | `https://campaigns.aaa-accreditation.org` |
| Routes | `/`, `/tepa`, `/healthcare`, `/clinic`, `/trainingandeducationandprovidersandaccreditation`, `/dashboard/login` |
| Repo | `https://github.com/aaaacreditation/tepa` (public — no deploy key needed) |
| Also on the box | `tepa-backup.service` (nightly pg_dump), `tepa-conversions.service` (Google Ads outbox drain) |

## Deploy

### 1. Gate on a local build — before committing anything

The server rebuilds from source. A broken build there leaves the old process
running and the deploy silently does nothing, so catch it locally first.

```bash
cd /Users/mounirbennassar/projects/Clients/AAA/marketing/lps/tepa
npx tsc --noEmit && npm run build
```

Do not continue if either fails. A healthy build prints all routes; check the
one you just added is in that list.

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
```

If the tree is already clean and `git status -sb` shows `ahead N`, the commit
step is done — go straight to the push.

### 3. Push

**Check the active GitHub account first.** The keyring holds five; git takes
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
~/.claude/skills/aaa_lp_deployement/scripts/deploy.sh
```

That script is the runbook below, verbatim. Run the steps by hand instead if
you need to vary one:

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
- **`npm ci`, not `npm install`** — installs exactly the lockfile. ~25 s.
- **The tar first.** A few seconds, and the only rollback that does not depend
  on git being intact.

Expect roughly 90 seconds end to end. The box builds with 1 worker.

### 5. Verify — the deploy is not done until this passes

```bash
~/.claude/skills/aaa_lp_deployement/scripts/verify_live.sh
```

It checks three things, and all three matter:

1. **The server SHA equals local `git rev-parse --short origin/main`.**
2. **Every route returns 200** through the public domain, requested with
   `-H 'Cache-Control: no-cache'`.
3. **The content actually changed.** A stale process also returns 200, so grep
   the live HTML for a string that exists only in the new code:

```bash
curl -sS -H 'Cache-Control: no-cache' https://campaigns.aaa-accreditation.org/<route> \
  | grep -c '<some-new-string>'
```

Report the byte counts per route — a page that collapses from 140 KB to 2 KB is
a rendering failure that still answers 200.

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

**`Failed to parse body as FormData` / `no boundary found` in the journal.**
Bot traffic probing the enquiry endpoints. Not a deploy failure — ignore unless
it correlates with real lost leads.

**Rollback.**

```bash
ssh -i ~/.ssh/tepa_hetzner_ed25519 root@2.28.26.33 '
  cd /opt/tepa/app
  git checkout -B live <last-good-sha>
  sudo -u tepa npm ci && sudo -u tepa npm run build
  systemctl restart tepa.service
'
```

Backups: `ls -lh /root/tepa-backup-*.tar.gz` (17 kept as of Sep 2026).

## Never

- **Never touch `/opt/tepa/app/.env`.** Mode 600, `tepa`-owned, gitignored, and
  holds the database URL plus the Google Ads and Meta credentials. `.env.local`
  is a symlink to it. Nothing in a deploy should write either.
- **Never authenticate with the root password**, even if one is offered or
  pasted into the chat. Key auth works. A password that reaches a transcript is
  a credential that has to be rotated — say so rather than using it.
- **Never deploy a branch other than `main`** without being told to explicitly.
  The server's `live` branch tracks `origin/main`; pointing it elsewhere is how
  the site ends up serving something no one can find in the default branch.
- **Never merge `clinic-readiness-quiz`** as part of a deploy. See below.

## History worth knowing

Until 21 Aug 2026 `/opt/tepa/app` was **not** a git checkout — files were
uploaded by hand. The `/clinic` page that ran in production for a week existed
in no repository. It was recovered onto branch `clinic-readiness-quiz`
(`ca90521`) before `main` was deployed over it. That branch forks from a commit
far behind `main`: merging it would delete `ConsultationForm`, `MobileCta`,
`StoryVideo`, `TeamGrid` and `icons.tsx` and revert the current `/clinic`.
Which `/clinic` should be live is a product decision for the user, never a step
in a deploy.

If a page ever appears live that is not in `git log --all`, check that branch
and `/root/tepa-backup-*.tar.gz` before assuming it is lost.

`tepa-form-only-ctas` is fully merged into `main`; nothing is pending on it.
