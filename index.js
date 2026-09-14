require('dotenv').config();

const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const fs = require('fs');
const path = require('path');
const os = require('os');

const bot = new Telegraf(process.env.BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

// ===== Jadwal tetap (mingguan) =====
const JADWAL_KULIAH = {
  Senin: [
    'Data Sains, F3.11, 07.00-09.30',
    'Pemrograman Aplikasi Web, F4.11, 09.35-12.10',
    'ASD, F3.2, 14.15-15.55',
  ],
  Selasa: ['Jaringan Komputer (Praktikum), G1.2, 14.15-15.55'],
  Rabu: [
    'Jaringan Komputer, F4.9, 07.00-09.30',
    'Pemrograman SQL, F4.14, 10.30-12.10',
    'TKTI, F3.14, 12.30-15.15',
    'DPSI, F4.5, 16.00-17.40',
  ],
  Kamis: [
    'Pemrograman Aplikasi Web (Praktikum), G1.2, 08.45-10.25',
    'ASD (Praktikum), G1.6, 12.30-14.10',
    'DPSI (Praktikum), G1.4, 14.15-15.55',
  ],
  Jumat: ['Pemrograman SQL (Praktikum), G1.3, 07.00-08.40'],
  Sabtu: [],
  Minggu: [],
};

const RUTINITAS = {
  Senin: [],
  Selasa: ['Cuci baju 07.00 - 08.00'],
  Rabu: [],
  Kamis: [],
  Jumat: ['Cuci baju 09.00 - 10.00', 'Mentoring kelas pekanan 18.00 - 22.00'],
  Sabtu: ['Cuci baju 07.00 - 08.00'],
  Minggu: [],
};

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']; // getDay(): 0 = Minggu
const CUTOFF_JAM = 18; // jam 18.00 -> default geser ke besok

function getNamaHari(date) {
  return NAMA_HARI[date.getDay()];
}

// Tentukan target tanggal: cek override kata kunci dulu, baru fallback ke logic jam
function resolveTargetDate(userText) {
  const now = new Date();
  const lower = userText.toLowerCase();
  const target = new Date(now);

  if (lower.includes('besok')) {
    target.setDate(now.getDate() + 1);
  } else if (lower.includes('hari ini')) {
    // tetap hari ini, gak perlu diubah
  } else if (now.getHours() >= CUTOFF_JAM) {
    target.setDate(now.getDate() + 1);
  }

  return target;
}

// Prompt template: gabungin jadwal tetap + rutinitas + input dinamis dari user
function buildPrompt(userText) {
  const targetDate = resolveTargetDate(userText);
  const hari = getNamaHari(targetDate);
  const tanggal = targetDate.toISOString().split('T')[0];

  const kuliah = JADWAL_KULIAH[hari] || [];
  const rutin = RUTINITAS[hari] || [];

  return `Kamu adalah asisten yang membuat to-do list harian dalam format Obsidian markdown.

HARI: ${hari}, TANGGAL: ${tanggal}

JADWAL KULIAH HARI ITU:
${kuliah.length ? kuliah.map((k) => `- ${k}`).join('\n') : '- (tidak ada kelas)'}

RUTINITAS TETAP HARI ITU:
${rutin.length ? rutin.map((r) => `- ${r}`).join('\n') : '- (tidak ada rutinitas tetap)'}

TUGAS/CATATAN TAMBAHAN DARI USER:
"""
${userText}
"""

INSTRUKSI OUTPUT:
1. Gabungkan jadwal kuliah + rutinitas tetap + tugas tambahan dari user, urutkan berdasarkan waktu (yang tanpa waktu spesifik taruh di bawah)
2. Output HANYA markdown, dengan format:
   - Frontmatter YAML (---) berisi: date, day, tags
   - Heading: "To-Do List ${hari}, ${tanggal}"
   - Checklist per item (- [ ] ) format: "[jam] Nama kegiatan (lokasi kalau ada)"
3. Jangan tambahkan penjelasan di luar markdown, jangan pakai code block pembungkus (\`\`\`)`;
}

// Handler buat command /start
bot.start((ctx) => {
  ctx.reply('Halo! Kirim jadwal harian kamu, nanti aku ubah jadi file .md buat Obsidian.');
});

// Handler buat semua pesan teks biasa -> generate markdown
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  console.log('Pesan masuk:', userText);

  try {
    await ctx.reply('Lagi diproses...');

    const result = await model.generateContent(buildPrompt(userText));
    const markdown = result.response.text();

    // Simpan ke file sementara
    const fileName = `${new Date().toISOString().split('T')[0]}.md`;
    const filePath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(filePath, markdown, 'utf-8');

    // Kirim file .md balik ke user
    await ctx.replyWithDocument({ source: filePath, filename: fileName });

    // Bersihin file sementara
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Error:', err);
    ctx.reply('Waduh, ada error pas generate. Coba lagi ya.');
  }
});

// Jalankan bot pakai polling
bot.launch();
console.log('Bot jalan...');

// Biar bot berhenti dengan bersih kalau di-Ctrl+C
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));