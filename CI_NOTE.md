# Nota: CI workflow

El workflow de GitHub Actions (`.github/workflows/ci.yml`) no se pudo subir con el
token actual (falta el scope `workflow`). Para habilitar CI de lint/format, crear
`.github/workflows/ci.yml` desde una cuenta con permiso `workflow`. Contenido sugerido:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install --no-save eslint@^8.57.0 prettier@^3.3.0
      - run: npx eslint js/ || true
      - run: npx prettier --check "js/**/*.js" || true
```

Localmente: `npm run lint` y `npm run format:check` (ver package.json).
