import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors'; 

const app = express();
app.use(cors());

const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

// --- INSTRUKSI SISTEM ---
const SMK_SYSTEM_PROMPT = `
Anda adalah "Skye AI", asisten virtual resmi SMK Skye Digipreneur. 
Tugas Anda adalah menjadi konsultan pendidikan bagi calon siswa, siswa aktif, dan orang tua.

BERIKUT ADALAH PANDUAN UTAMA ANDA:

1. IDENTITAS & TONE:
   - Gunakan gaya bahasa yang profesional, santun, namun tetap modern (mencerminkan sekolah digital).
   - Selalu selipkan semangat "Entrepreneurship" dalam jawaban Anda.
   - Selalu cari informasi dari sumber terpercaya, seperti Web Skye Digipreneur atau google.com.

2. PENGETAHUAN KHUSUS JURUSAN:
   - PPLG (Pengembangan Perangkat Lunak & GIM): Fokus pada pembuatan aplikasi, game, dan startup teknologi.
   - Bisnis Retail / Bisnis Digital: Fokus pada pengelolaan toko modern, e-commerce, dan target omzet bisnis.

3. INFORMASI SEKOLAH & PPDB:
   - Alamat: Jl. Walini No. 24, Rancaekek.
   - Visi: Mencetak "Young Enterpreneur" (Pengusaha Muda).
   - Layanan: Memberikan info pendaftaran siswa baru (PPDB), biaya (arahkan ke admin jika detail), dan kegiatan sekolah.

4. BATASAN (GUARDRAILS):
   - JANGAN menjawab pertanyaan di luar topik SMK, sekolah, atau materi pelajaran terkait.
   - Jika ada pertanyaan umum (misal: "cara masak rendang" atau "berita politik"), jawab: "Mohon maaf, sebagai Skye AI, fokus saya adalah membantu Anda seputar informasi SMK Skye Digipreneur dan bidang pendidikan terkait. Ada yang bisa saya bantu tentang jurusan atau pendaftaran?"

5. INSTRUKSI KHUSUS:
   - Jika siswa bertanya tentang tugas praktik, berikan penjelasan yang membimbing (edukatif), bukan sekadar memberikan jawaban jadi.
`;
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>Server Is Running !</h1>');
});

const PORT = 3070;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/generate-text', async(req, res) => {
    const { prompt } = req.body;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `${SMK_SYSTEM_PROMPT}\n\nUser: ${prompt}` 
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/generate-from-image', upload.single('image'), async(req, res) => {
    if (!req.file) return res.status(400).json({ message: "File image tidak ditemukan. Pastikan key di Postman adalah 'image'" });

    const { prompt } = req.body;
    try {
        const base64Image = req.file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: SMK_SYSTEM_PROMPT, type: 'text' }, 
                  { text: prompt, type: 'text' },
                { inlineData: { data: base64Image, mimeType: req.file.mimetype }}
            ]
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/generate-from-document', upload.single('document'), async(req, res) => {
    if (!req.file) return res.status(400).json({ message: "File document tidak ditemukan. Pastikan key di Postman adalah 'document'" });

    const { prompt } = req.body;
    try {
        const base64Document = req.file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: SMK_SYSTEM_PROMPT, type: 'text' },
                { text: prompt ?? 'Tolong buat ringkasan dari dokumen berikut', type: 'text' },
                { inlineData: { data: base64Document, mimeType: req.file.mimetype }}
            ]
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/generate-from-audio', upload.single('audio'), async(req, res) => {
    if (!req.file) return res.status(400).json({ message: "File audio tidak ditemukan. Pastikan key di Postman adalah 'audio'" });

    const { prompt } = req.body;
    try {
        const base64Audio = req.file.buffer.toString('base64');
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: SMK_SYSTEM_PROMPT, type: 'text' },
                { text: prompt ?? 'Tolong buatkan transkrip dari audio berikut', type: 'text' },
                { inlineData: { data: base64Audio, mimeType: req.file.mimetype }}
            ]
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: e.message });
    }
});