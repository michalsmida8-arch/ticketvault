# TicketVault 1.2.0 — Příjmy na stránce Výdaje

Rozšíření stránky Výdaje o evidenci příjmů (peníze co ti někdo posílá) a výpočet netto nákladů.

## Co je nové

### 🔀 Typ položky: Výdaj / Příjem
V modalu pro přidání/úpravu je nahoře přepínač **Výdaj** / **Příjem**. Obě mají stejnou strukturu (název, cena, frekvence, karta…), takže můžeš evidovat:
- **Výdaje** — předplatná, provozní náklady (peníze dávám)
- **Příjmy** — to, co ti ostatní pravidelně posílají (peníze přichází)

### 📊 Nové stat karty
| Předtím | Teď |
|---|---|
| Měsíčně platím | **Celkové výdaje / měsíc** (červená) |
| Ročně platím | **Celkové příjmy / měsíc** (zelená) |
| Aktivní předplatná | **Moje náklady (netto)** = výdaje − příjmy |
| Nejbližší platba | **Aktivní položky** |

Pokud vyděláváš víc, než vydáváš, netto se obarví zeleně.

### 🎨 Vizuální odlišení v tabulce
- Nový sloupec **TYP** s barevným badge (Výdaj / Příjem)
- Příjem má **+** před částkou v zeleném odstínu, výdaj **−** v neutrálním
- Řádky příjmů jemně zeleně nadechlé
- Tlačítko "Zaplaceno" se u příjmů mění na **"Přijato"**

### 🔍 Nový filter
V panelu filtrů je nový dropdown **Typ** s volbami:
- Vše (výdaje + příjmy) — default
- Jen výdaje
- Jen příjmy

## Zpětná kompatibilita
Existující položky bez `type` pole se automaticky chovají jako `expense`. Nic se neztratí, netto spočítá správně (= totéž co celkové výdaje, protože příjmy jsou zatím 0).

## Deploy (auto-update)

```bash
cd C:\Users\msmida\Desktop\ticketvault
git add .
git commit -m "release 1.2.0 - income tracking in expenses"
git tag v1.2.0
git push && git push --tags
```

Za ~5 min GitHub Actions zbuildí installer, stávající instalace se upgradnou samy při dalším startu.
