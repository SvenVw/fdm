import neostandard, { resolveIgnoresFromGitignore } from 'neostandard'

export default neostandard({
  ts: true,
  files: ['{fdm-core,fdm-data,fdm-calculator}/src/**/*.{js,mjs,cjs,ts}', 'fdm-app/app/**/*.{js,mjs,cjs,ts}'],
  ignores: resolveIgnoresFromGitignore(),
  rules: {
    camelcase: 'off'
  }
})
