# MurTo-Do

Bot Telegram berbasis AI yang menghasilkan to-do list harian dalam format `.md` dan menyimpannya ke Obsidian vault kamu.

## Fitur

- Generate to-do list otomatis berdasarkan jadwal kuliah dan rutinitas
- AI (Google Gemini) memproses aktivitas dan mengurutkan berdasarkan waktu
- Tersimpan langsung ke Obsidian vault dalam format Markdown dengan YAML frontmatter
- File dikirim balik ke Telegram sebagai lampiran `.md`

## Persiapan

- Node.js >= 18
- Obsidian vault di komputer kamu
- Akun Telegram
- API key Google Gemini

## Instalasi

```bash
git clone https://github.com/username/todo-bot.git
cd todo-bot
npm install
```

## Konfigurasi

Buat file `.env` berdasarkan `env.example`:

```bash
cp env.example .env
```

Isi variabel berikut:

| Variable | Keterangan |
|---|---|
| `BOT_TOKEN` | Token bot Telegram (dari @BotFather) |
| `GEMINI_API_KEY` | API key Google Gemini |
| `VAULT_PATH` | Path absolut ke Obsidian vault kamu |

### Mendapatkan BOT_TOKEN

1. Buka Telegram, cari **@BotFather**
2. Kirim `/newbot`
3. Ikuti instruksi: beri nama bot dan username
4. Copy token yang diberikan dan simpan ke `BOT_TOKEN` di `.env`

## Menjalankan

```bash
node index.js
```

## Cara Pakai

1. Buka bot di Telegram
2. Kirim `/start` untuk memulai
3. Kirim pesan berisi aktivitas/jadwal harian kamu
4. Bot akan generate to-do list dan mengirimkannya sebagai file `.md`
5. File juga disimpan ke folder `TODO-BOT/` di Obsidian vault kamu

### Penjadwalan Otomatis

- Pesan yang mengandung "besok" → to-do list untuk besok
- Pesan sebelum jam 18:00 → to-do list untuk hari ini
- Pesan setelah jam 18:00 → otomatis untuk besok

## Tech Stack

- **Node.js** - Runtime
- **Telegraf** - Telegram Bot framework
- **Google Gemini AI** - AI untuk generate to-do list
- **dotenv** - Environment variable management

## Output

File `.md` yang dihasilkan memiliki format seperti ini:

```markdown
---
date: 2026-09-14
day: Monday
tags: [todo, daily]
---

# To-Do List - 2026-09-14

- [ ] 07.00-09.30 Data Sains (F3.11)
- [ ] 10.00-12.00 Kerjakan tugas ASD
- [ ] 13.00-15.00 Laundry
```
