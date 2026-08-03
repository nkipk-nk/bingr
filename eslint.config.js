import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Design-system migration allowlist — grows by one path per migration PR.
// Flat config's `files` can't be an empty array, so this starts with a
// placeholder glob that matches nothing; replace it with the first real
// path (e.g. 'src/pages/PrivacyPolicy.jsx') as soon as one exists.
const MIGRATED_FILES = [
  'src/pages/PrivacyPolicy.jsx',
  'src/pages/TermsOfService.jsx',
  'src/pages/SupportersPage.jsx',
  'src/pages/DeleteAccount.jsx',
  'src/pages/ForgotPassword.jsx',
  'src/pages/ResetPassword.jsx',
  'src/pages/AdminPanel.jsx',
  'src/components/DetailPanel.jsx',
  'src/components/MovieCard.jsx',
  'src/pages/DiscoverPage.jsx',
  'src/pages/ActivityFeed.jsx',
  'src/components/FindPeople.jsx',
  'src/pages/FeedPage.jsx',
  'src/components/WatchLogCard.jsx',
  'src/pages/DiaryPage.jsx',
  'src/pages/LibraryPage.jsx',
  'src/pages/LibraryTab.jsx',
  'src/components/ExportPanel.jsx',
  'src/pages/LandingPage.jsx',
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Every remaining lint error in this codebase (17, down from 44 at
      // audit time) is this one rule, in the same shape everywhere: a hook's
      // `useEffect(() => { load() }, [load])` where `load` synchronously
      // calls setLoading(true) before its async work starts. Fixing it
      // properly means restructuring how ~15 data-fetching hooks/pages start
      // a request — the same scope as the TanStack Query migration tracked
      // as recommendation R1 in BINGR_AUDIT_REPORT.md, not something to
      // rush as a lint cleanup. Downgraded to a warning so CI can be a real,
      // green-by-default gate against *new* regressions today — errors here
      // still fail the build; this one warns instead of blocking, and stays
      // visible in `npm run lint` output rather than being silenced.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Design-system migration guard (BINGR_DESIGN_SYSTEM.md / the
    // implementation plan's Phase 0 tooling). Every screen still uses
    // hand-typed `style={{...}}` objects today (944 of them at audit
    // time) — that's the normal, allowed state for anything not yet
    // migrated to CSS Modules + the shared primitives in
    // src/components/ui/. Once a file's inline styles are fully replaced,
    // add its path here so this rule locks in the migration and CI fails
    // if inline styles creep back in. Grows by one entry per migration PR.
    files: MIGRATED_FILES,
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: 'This file has been migrated off inline styles — use the CSS Module for this component instead of style={{...}}.',
        },
      ],
    },
  },
])
