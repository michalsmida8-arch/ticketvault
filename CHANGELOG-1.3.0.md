# TicketVault 1.3.0 — Personal forward address (generate button is back)

Každý uživatel má zase svou **unikátní forward adresu** s generate tlačítkem. Routing funguje podle `+tag` v adrese, ne podle whitelistu odesílatelů.

## Proč?

Po přechodu na whitelist (předchozí verze) nefungovalo forwardování od sdílených uživatelů tak, jak by mělo. User si musel manuálně registrovat svoje Gmaily — složité. Vracíme se k původnímu modelu *"každý uživatel = vlastní adresa"*.

## Co je nové

### 📥 Osobní forward adresa v Settings
```
e39a755c78a59a3e9759+a7f3k2q1@cloudmailin.net
                     ^^^^^^^^
                     tvůj unikátní +tag
```

Každý uživatel má svůj vlastní, 10-znakový alphanumerický tag. Emaily forwardované na TU adresu přistanou **jen v jeho DB** (pokud sdílí DB s někým, v té sdílené).

### 🔄 Generate button
Tlačítko *"Vygenerovat novou adresu"* v Settings vytvoří čerstvý tag. Stará adresa okamžitě přestane fungovat — uživatel musí aktualizovat filter v Gmailu, jinak mu emaily přestanou chodit.

### ⚙️ Automatická migrace
Stávající uživatelé (smidis, dticky, peclinovsky) dostanou při prvním načtení vygenerovaný mailToken — nemusíš dělat nic manuálně. Po deployi backendu stačí otevřít Settings → vidíš svou novou adresu a můžeš s ní začít pracovat.

### 🛟 Legacy fallback
Starý whitelist (`allowedSenders`) zůstává v datech **jako záložní routing** (pokud email dorazí bez +tagu). UI je ale skryté — uživatelé si to nemusí řešit.

## Backend změny (musí být deploynuté PŘED frontendem!)

- `api.js`: `mailToken` field, regenerace endpoint, auto-migrace, generace při registraci
- `inbox.js`: `envelope.to` extrakce, `+tag` parser, 3-tier routing (tag → whitelist → admin)

## Frontend změny

- `main.js`: nový IPC handler `auth:regenerateMailToken`
- `preload.js`: API `authRegenerateMailToken`
- `src/app.js`: nová UI logika (`buildPersonalForwardAddress`, `copyMailForwardAddress`, `regenerateMailToken`)
- `src/index.html`: nová sekce Settings → 📥 Příchozí emaily (replace whitelist UI)
- `src/styles.css`: malý styling status hintu

## Deploy (dva samostatné kroky!)

### 1) BACKEND — Netlify (DŘÍV, jinak frontend padne)

Rozbal `ticketvault-backend-1.3.0.zip` do své Netlify git složky (nebo drag-and-drop do Netlify dashboardu).

```bash
cd <tvoj-backend-repo>
# přepiš soubory v netlify/functions/
git add .
git commit -m "1.3.0 — mailToken routing"
git push
```

Netlify se automaticky redeploynou. Ověření: `GET /api/auth/me` teď vrací field `mailToken`.

### 2) FRONTEND — GitHub (auto-update)

```bash
cd C:\Users\msmida\Desktop\ticketvault
# rozbal ticketvault-1.3.0-frontend.zip sem
git add .
git commit -m "release 1.3.0 — generate personal forward address"
git tag v1.3.0
git push && git push --tags
```

GitHub Actions zbuildí installer, stávající instalace se upgradnou samy.

## Test checklist po deployi

- [ ] Login: uvidíš se bez změny
- [ ] Settings → 📥 Příchozí emaily: vidíš svoji unikátní adresu s `+tag`
- [ ] Klikni "Vygenerovat novou adresu" → adresa se změní, toast potvrdí
- [ ] Klikni "📋 Kopírovat" → máš v clipboardu
- [ ] V Gmailu aktualizuj forward na novou adresu
- [ ] Forward test email → přistane v inboxu
- [ ] Druhý uživatel (dticky) udělá to samé — jeho forwardy taky fungují
