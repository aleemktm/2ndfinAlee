# AleemFin — Phase 9

## Modular application shell refactor

This phase keeps the existing UI, data model, calculations, tabs, modals, storage keys, and native bridge behavior intact while removing the top-level runtime/bootstrap code from the giant `app.js` file.

### Changes
- `app.js` is now a small bootstrap entry point.
- Shared runtime utilities/configuration moved to `core/runtime.js`.
- The React `App` implementation moved to `app/main.js`.
- Existing tab and modal modules remain unchanged.
- No migration of localStorage keys or financial calculations.
- No dependency on ES modules/bundlers was introduced, preserving direct Safari/PWA loading and the future Capacitor shell workflow.

### Load order
React → icons/tabs/modals → `core/runtime.js` → `app/main.js` → `app.js`.

### Phase 9 scope
This is the first structural split. The next architectural pass can further break `app/main.js` into state, data/finance logic, actions, and presentation modules without changing behavior.
