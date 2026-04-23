# TicketVault 1.1.0 — Black + Gold Redesign

Visual refresh zachovávající veškerou funkcionalitu. Žádné změny v datovém modelu, API nebo Electron logice — jen styling, logo a fonty.

## Co se změnilo

### 🎨 Theme — Black + Gold v obou módech
- **Dark mode** (default): hluboká warm ink (`#0a0908`) + patinové zlato (`#d4a94a`)
- **Light mode** (přes theme toggle): krémová (`#faf6ea`) + hlubší zlato (`#a6873a`)
- Purple akcent nahrazen zlatem ve všech 110+ CSS pravidlech (přes změnu CSS proměnných)

### 🎫 Logo — nová ikona Stub Monogram
- Klasický tvar lístku s černým tělem a zlatou stub s čárovým kódem
- TV monogram v serif fontu
- Všechny velikosti regenerované: 16, 32, 48, 64, 128, 256, 512, 1024 + `icon.ico`

### 🔐 Login obrazovka — vždy dark
- Úvodní brána zůstává černo-zlatá bez ohledu na theme uvnitř apky
- Lokálně napinované dark tokens přes `.auth-overlay { --bg-primary: ... }`

### 📊 Stat karty
- **Variant 03**: Inter bold tabular numerals, jednobarevné (bez dvoutónového 24/812)
- Nový ticket-stub akcent: solid gold bar vlevo + perforační tečky
- `font-variant-numeric: tabular-nums` pro dokonale zarovnaná čísla

### 🔤 Typografie
- **Playfair Display** (serif) — page-title, sidebar brand
- **Oswald** (condensed sans) — primary CTA tlačítka ("+ NOVÁ", "PŘIHLÁSIT SE")
- **Inter** — zbytek UI (beze změny)
- **JetBrains Mono** — čísla, mono labels (beze změny)

## Soubory změněné

```
src/styles.css        — :root, [data-theme="light"], .stat-card, .auth-overlay, .logo, .btn-primary, .page-title
src/index.html        — Google Fonts import (+ Playfair Display, Oswald)
package.json          — version 1.0.1 → 1.1.0
assets/*.png, .ico    — všechny ikony regenerované (Stub Monogram)
```

## Soubory NEZMĚNĚNÉ

- `main.js`, `preload.js` — žádné změny v Electron logice
- `src/app.js` — žádné změny v renderer logice, CRUD, inbox, parserech
- Backend (`ticketvault-backend/`) — netknuto
- API endpointy, DB schéma — netknuto

## Deploy (auto-update pro uživatele)

1. Rozbal tento ZIP do své stávající git složky — přepíše existující soubory
2. Commit + tag + push:
   ```bash
   git add .
   git commit -m "release 1.1.0 — black+gold redesign"
   git tag v1.1.0
   git push && git push --tags
   ```
3. GitHub Actions (`.github/workflows/release.yml`) automaticky zbuildí Windows installer a nahraje ho do GitHub Release `v1.1.0`
4. Existující instalace při příštím spuštění uvidí banner "Nová verze 1.1.0 dostupná", update se stáhne na pozadí, pak "Restartovat a nainstalovat"

## Rollback

Pokud se něco nezalíbí, commit před tím obsahuje verzi 1.0.1 — stačí `git revert` a přetagovat.
