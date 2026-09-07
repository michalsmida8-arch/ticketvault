# TicketVault 1.15.44 — Kontaktní/fakturační údaje u schránek

## ✨ Co je nové
U každé e-mailové schránky (Emailové schránky) jde teď uložit i kontaktní a
fakturační údaje pro checkout:
- Telefon (předvolba + číslo)
- PSČ, Město
- Adresa řádek 1 a 2
- Region / kraj
- Země

Vyplníš je v Přidat/Upravit schránku, uloží se ke schránce a synchronizují se
jako zbytek dat.

## 🚀 Nasazení
Jen frontend (src/app.js + src/index.html), žádná nová závislost. Po tagu CI
build + přeinstalovat.
