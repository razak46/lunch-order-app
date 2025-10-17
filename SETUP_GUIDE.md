# 🚀 Rychlý průvodce nasazením (10 minut)

## Co budete potřebovat
- ✅ Gmail účet (pro přihlášení přes GitHub)
- ✅ Stabilní internetové připojení
- ✅ 10 minut času

---

## KROK 1: Registrace GitHub (2 minuty)

1. Jděte na **https://github.com**
2. Klikněte **"Sign up"**
3. Vyplňte email a heslo
4. Ověřte email
5. ✅ Máte GitHub účet!

---

## KROK 2: Nahrání kódu (3 minuty)

### Jednoduchá cesta (doporučeno):

1. Přihlaste se na GitHub
2. Klikněte na **"+"** vpravo nahoře → **"New repository"**
3. Vyplňte:
   - Repository name: `lunch-order-app`
   - Description: `Systém pro objednávání obědů`
   - Visibility: **Private** (soukromé)
4. Klikněte **"Create repository"**
5. Na další stránce klikněte **"uploading an existing file"**
6. **Přetáhněte VŠECHNY soubory** z této složky do okna
7. Klikněte **"Commit changes"**
8. ✅ Kód je na GitHubu!

---

## KROK 3: Nasazení na Vercel (5 minut)

1. Jděte na **https://vercel.com**
2. Klikněte **"Sign Up"** → **"Continue with GitHub"**
3. Povolte Vercelu přístup k vašemu GitHubu
4. ✅ Přihlášeni!

### Vytvoření projektu:

1. Klikněte **"Add New..."** → **"Project"**
2. Vyberte repozitář **`lunch-order-app`**
3. Klikněte **"Import"**

### Nastavení databáze (DŮLEŽITÉ):

1. **PŘED** kliknutím na "Deploy" jděte do:
   - **Storage** tab (vlevo)
2. Klikněte **"Create Database"**
3. Vyberte **"KV"**
4. Název: `lunch-order-db`
5. Region: **Frankfurt** (nejbližší)
6. Klikněte **"Create"**
7. Klikněte **"Connect to Project"**
8. Vyberte váš projekt `lunch-order-app`
9. Klikněte **"Connect"**
10. ✅ Databáze připojena!

### Spuštění:

1. Vraťte se na **"Deployments"** tab
2. Klikněte **"Deploy"**
3. Počkejte ~2 minuty (zelená animace)
4. Klikněte na **"Visit"** po dokončení
5. ✅ **HOTOVO!**

---

## KROK 4: Sdílení s týmem

1. Zkopírujte URL z Vercelu (např. `https://lunch-order-app.vercel.app`)
2. Odešlete týmu
3. ✅ Všichni mohou objednávat!

---

## 🎯 První použití

### Jako admin (vy):
1. Otevřete aplikaci
2. Nahrajte foto menu z restaurace
3. Zkontrolujte rozpoznaná jídla
4. Klikněte "Potvrdit menu"

### Váš tým:
1. Otevře stejnou URL
2. Vyplní jméno
3. Vybere jídla
4. Odešle objednávku

### Export pro restauraci:
1. Počkejte až všichni objednají
2. Klikněte "Stáhnout" v sekci "Souhrn"
3. Odešlete .txt soubor restauraci

---

## ❓ Co když to nefunguje?

### Problem: "Database not found"
**Řešení:** 
- Jděte na Vercel Dashboard
- Storage → KV database
- Zkontrolujte že je připojená k projektu

### Problem: Menu se nesmaže po 3 dnech
**Řešení:**
- To je normální - automatické mazání funguje na pozadí
- Nebo použijte tlačítko "Reset" v admin sekci

### Problem: AI nerozpozná menu
**Řešení:**
- Vyfotit menu jasněji (lepší světlo)
- Nebo upravit menu ručně po nahrání

---

## 💰 Je to opravdu zdarma?

**ANO!** ✅

- **GitHub**: Zdarma navždy
- **Vercel**: 100GB bandwidth/měsíc (více než dost)
- **Vercel KV**: 256MB úložiště (stačí na 10,000+ objednávek)

**Pro vaše použití (týmové obědy) je to 100% zdarma!**

---

## 🎊 Gratulujeme!

Máte funkční systém pro objednávání obědů!

**Potřebujete pomoc?**
- Zkontrolujte README.md pro detailní dokumentaci
- Podívejte se na Vercel Logs pro chybové hlášky

---

**Vytvořeno pro EUED s.r.o. ❤️**
