# 🍽️ Objednávka Oběda - Minimalistická Varianta

Systém pro týmové objednávání obědů s AI rozpoznáváním menu a automatickým mazáním dat po 3 dnech.

## ✨ Funkce

- 📸 **AI rozpoznání menu** z fotky (Claude API)
- 👥 **Týmové objednávání** s rozlišením "na místě" vs "s sebou"
- 📝 **Poznámky k jídlům**
- 📋 **Automatický souhrn** pro restauraci (export do .txt)
- 🗄️ **Vercel KV databáze** (automatické mazání po 3 dnech)
- 🔒 **Admin sekce** pro správu menu

## 🚀 Nasazení na Vercel (10 minut)

### Krok 1: Příprava účtů

1. **GitHub účet**
   - Registrujte se na https://github.com (pokud ještě nemáte)
   - Zdarma

2. **Vercel účet**
   - Jděte na https://vercel.com
   - Klikněte "Sign Up" → "Continue with GitHub"
   - Zdarma

### Krok 2: Nahrajte kód na GitHub

#### Varianta A: Přes webové rozhraní (jednodušší)

1. Na GitHubu vytvořte nový repozitář:
   - Klikněte na "+" → "New repository"
   - Název: `lunch-order-app`
   - Visibility: Private (doporučeno)
   - Klikněte "Create repository"

2. Nahrajte soubory:
   - Klikněte "uploading an existing file"
   - Přetáhněte VŠECHNY soubory z této složky
   - Commit changes

#### Varianta B: Přes Git CLI (pro zkušené)

```bash
cd lunch-order-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VAS_USERNAME/lunch-order-app.git
git push -u origin main
```

### Krok 3: Deploy na Vercel

1. **Importujte projekt**
   - Přihlaste se na https://vercel.com
   - Klikněte "Add New..." → "Project"
   - Vyberte váš GitHub repozitář `lunch-order-app`
   - Klikněte "Import"

2. **Vytvořte KV databázi**
   - Na Vercelu jděte do Settings → Storage
   - Klikněte "Create Database"
   - Vyberte "KV" (Redis)
   - Název: `lunch-order-db`
   - Klikněte "Create"
   - Vercel automaticky propojí databázi s projektem ✅

3. **Deploy**
   - Klikněte "Deploy"
   - Počkejte ~2 minuty
   - Hotovo! 🎉

### Krok 4: Získejte URL aplikace

Po úspěšném deployi:
- Vercel vám zobrazí URL: `https://vas-projekt.vercel.app`
- Sdílejte tuto URL s týmem
- Aplikace je ihned funkční!

## 📋 Jak aplikaci používat

### Admin (nastavení menu)

1. **Nahrajte foto menu**
   - Otevřete aplikaci
   - Klikněte na "Admin sekce"
   - Nahrajte foto menu
   - AI automaticky rozpozná jídla

2. **Upravte menu** (pokud potřeba)
   - Opravte názvy jídel
   - Přidejte/odeberte položky
   - Klikněte "Potvrdit menu"

3. **Zamkněte admin sekci**
   - Menu je automaticky zamčeno po potvrzení
   - Ostatní uživatelé mohou pouze objednávat

### Zaměstnanci (objednávání)

1. **Vyplňte jméno** (povinné)
2. **Vyberte jídla**
   - Počet porcí "na místě"
   - Počet porcí "s sebou"
   - Přidejte poznámky (volitelné)
3. **Odešlete objednávku**

### Export pro restauraci

1. Klikněte "Stáhnout" v sekci "Souhrn pro restauraci"
2. Stáhne se .txt soubor s přehledem všech objednávek
3. Odešlete restauraci

## 🔄 Automatické mazání dat

Data se **automaticky mažou po 3 dnech**. Pokud potřebujete jiný interval:

1. Otevřete `app/api/menu/route.ts`
2. Změňte řádek:
   ```typescript
   const TTL_SECONDS = 3 * 24 * 60 * 60; // 3 dny
   ```
3. Na:
   ```typescript
   const TTL_SECONDS = 1 * 24 * 60 * 60; // 1 den
   // nebo
   const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 dní
   ```
4. Commit a push změn → Vercel automaticky re-deployuje

## 🆓 Free limity

**Vercel:**
- 100GB bandwidth/měsíc
- Neomezené deploymenty
- Vlastní doména zdarma

**Vercel KV:**
- 256MB úložiště
- 100,000 příkazů/měsíc
- ✅ **Více než dostačující pro vaše použití!**

## 🛠️ Údržba

### Ruční reset databáze

Pokud potřebujete smazat všechna data před 3 dny:
1. Otevřete aplikaci
2. Admin sekce → "Reset"
3. Potvrďte

### Aktualizace kódu

1. Upravte soubory lokálně
2. Nahrajte na GitHub (commit & push)
3. Vercel automaticky deployuje změny

## 📞 Podpora

Pokud narazíte na problémy:

1. **Kontrola logů:**
   - Vercel Dashboard → váš projekt → Logs
   - Hledejte červené chybové hlášky

2. **Časté problémy:**
   - **Menu se neukládá**: Zkontrolujte, že je KV databáze propojená
   - **AI nefunguje**: Zkontrolujte Claude API dostupnost
   - **Data mizí příliš brzy**: Zkontrolujte TTL_SECONDS v kódu

## 🎯 Výhody tohoto řešení

✅ **Jednoduchý setup** - pouze Vercel  
✅ **Automatické mazání** dat (TTL)  
✅ **100% zdarma** navždy  
✅ **Profesionální hosting**  
✅ **HTTPS automaticky**  
✅ **Rychlý a spolehlivý**  

## 📝 License

MIT - použijte jak chcete!

---

**Vytvořeno s ❤️ pro týmové objednávání obědů**
