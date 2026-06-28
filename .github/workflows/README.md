# CI/CD

GitHub Actions pipelines for the Community Hero monorepo.

## Workflows

### `ci.yml` — Continuous Integration
Runs on every push and pull request to `main` and `develop`.

| Job | Steps |
| --- | --- |
| **Backend** | `npm ci` → `prisma validate` → `prisma generate` → syntax-check every `src/**/*.js` |
| **Frontend** | `npm ci` → `npm run lint` → `npm run build` (`tsc -b && vite build`) → upload `dist` artifact |

No database, API keys, or secrets are required for CI.

### `deploy.yml` — Continuous Deployment
Triggers automatically after a **successful CI run on `main`**, and can also be
run manually (`workflow_dispatch`). It uses platform **deploy hooks**, so the
build itself runs on Render/Vercel using each platform's own root-directory
configuration.

Deployment is **disabled by default**. It only runs when the repository
variable `ENABLE_DEPLOY` is `true`, and each target is skipped unless its hook
secret is present.

## Required configuration

Set these under **GitHub → Settings → Secrets and variables → Actions**.

### Variable
| Name | Value | Purpose |
| --- | --- | --- |
| `ENABLE_DEPLOY` | `true` | Master switch that enables the deploy job |

### Secrets
| Name | Where to get it | Used for |
| --- | --- | --- |
| `RENDER_DEPLOY_HOOK_URL` | Render service → Settings → Deploy Hook | Deploy the backend |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel project → Settings → Git → Deploy Hooks | Deploy the frontend |

If a secret is missing, that target is skipped (the job still succeeds), so you
can enable backend and frontend deploys independently.

## One-time platform setup
1. **Render (backend):** create a Web Service from this repo with root directory
   `Backend`, build `npm ci && npx prisma generate`, start `npm start`. Add the
   backend env vars (`DATABASE_URL`, `JWT_SECRET`, etc.). Copy its Deploy Hook
   URL into `RENDER_DEPLOY_HOOK_URL`.
2. **Vercel (frontend):** import this repo with root directory `Frontend`,
   framework Vite. Add the `VITE_*` env vars. Create a Deploy Hook and copy its
   URL into `VERCEL_DEPLOY_HOOK_URL`.
3. Set the `ENABLE_DEPLOY` variable to `true`.

## Notes
- Node 20 is used in CI; align your Render/Vercel runtime to Node 20+.
- CI builds the frontend on Node 20 — if the build is red, fix lint/type errors
  before merging (that is the gate doing its job).
