# 🍽️ Lunch Order App v2

Týmový systém pro objednávání obědů s AI rozpoznáváním menu.

## ✨ Funkce

- 🔐 **Admin panel** - nahrání a správa menu (heslo: `admin123`)
- 📸 **AI rozpoznávání** menu z fotky
- 👥 **Oddělené role** - admin vs. uživatelé
- 📝 **Poznámky** - k jídlům i typu objednávky (na místě/s sebou)
- 📊 **Export objednávek** - do .txt souboru
- 💾 **Automatické mazání** - po 5 dnech

## 🚀 Nasazení na Vercel

### 1. Nahrát na GitHub

```bash
cd lunch-app-v2
git init
git add .
git commit -m "Initial commit"
gh repo create lunch-app-v2 --private --source=. --push
```

### 2. Připojit na Vercel

1. Jdi na [vercel.com](https://vercel.com)
2. **Import Project** → vyber GitHub repo `lunch-app-v2`
3. **Deploy** (zatím NEFUNGUJE - potřeba nastavit proměnné)

### 3. Nastavit databázi

1. Vercel Dashboard → tvůj projekt
2. **Storage** → **Create Database** → **KV**
3. Pojmenuj: `lunch-orders-db`
4. **Create**

### 4. Nastavit Anthropic API

1. Jdi na [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Zkopíruj klíč

### 5. Přidat Environment Variables

Vercel Dashboard → tvůj projekt → **Settings** → **Environment Variables**

Přidej:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

KV proměnné se přidají automaticky po připojení databáze.

### 6. Redeploy

1. **Deployments** → najdi poslední deploy
2. Tři tečky ⋯ → **Redeploy**
3. ✅ Hotovo!

## 🔧 Admin přístup

**Heslo:** `admin123`

Změnit v souboru `app/page.jsx`, řádek:
```javascript
if (adminPassword === 'admin123') {
```

## 📊 Použití

### Admin (v neděli večer):
1. Přihlásit se (🔒 ikona)
2. Nahrát foto menu
3. AI rozpozná jídla
4. Potvrdit menu

### Uživatelé (v pondělí):
1. Otevřít URL
2. Zadat jméno
3. Vybrat typ (na místě/s sebou)
4. Přidat poznámku k typu
5. Vybrat jídla
6. Přidat poznámky k jídlům
7. Odeslat

### Admin (ráno):
1. Zobrazit objednávky
2. Export → .txt soubor
3. Poslat restauraci

## 💰 Náklady

- Vercel: **$0** (zdarma)
- KV databáze: **$0** (zdarma)
- Anthropic API: **~$0.30/měsíc** (při 100 menu)

**Celkem: ~$0.30/měsíc**

## 🔄 Aktualizace

```bash
git add .
git commit -m "Update"
git push
```

Vercel automaticky redeploy.

## 🆘 Podpora

Pokud něco nefunguje:
1. Zkontroluj Environment Variables
2. Zkontroluj KV databázi
3. Zkontroluj Anthropic API kredit
4. Podívej se do Vercel Logs

---

Vytvořeno s ❤️ pro snadnější týmové obědy
