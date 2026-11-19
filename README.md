# Rumah Aqiqah Semarang — Landing Page (Single-File Static)

Landing page katalog & pemesanan WhatsApp untuk **Rumah Aqiqah Semarang** (Candisari, Kota Semarang), dibangun dengan arsitektur **Single-File Static** (`index.html` + Tailwind CSS CDN + Vanilla JS) tanpa framework berat dan tanpa `node_modules`.

## Arsitektur & Batasan Teknis
- **Zero Build Step:** 100% file statis (`index.html`), ramah laptop RAM 4 GB.
- **Styling:** Tailwind CSS Play CDN + Google Fonts (`Playfair Display` untuk judul & `Plus Jakarta Sans` untuk body/angka).
- **Interaktivitas:** Vanilla JS murni (filter kategori paket, kalkulator estimasi nasi box + tanggal acara, pratinjau & salin draf pesan WhatsApp, menu navigasi mobile, fallback gambar otomatis).
- **Deploy:** GitHub -> Vercel (otomatis mendeteksi root `index.html`, tanpa perlu Vercel CLI).

## Cara Kloning untuk Klien UMKM Baru (< 5 Menit)
Buka `index.html`, lalu ubah objek `SITE_CONFIG` dan `PACKAGE_RATES` di bagian `<script>` bawah:
1. Ganti `brandName`, `tagline`, `waNumber` (format `628...`), `waDisplay`, `address`, `shortAddress`, `hours`, dan `mapQuery`.
2. Sesuaikan judul, deskripsi, dan indikasi harga pada 4 kartu paket di `#paket-list`.
3. Perbarui meta `<title>`, `<meta name="description">`, `og:title`, dan `og:description` untuk preview link WhatsApp.
4. Commit & push ke GitHub -> Vercel otomatis live.

## Deploy ke GitHub -> Vercel
```powershell
git add index.html .gitignore README.md
git commit -m "feat: deploy audited index.html for Rumah Aqiqah Semarang"
git push origin main
```
Setelah push selesai, buka Vercel Dashboard -> pastikan Production Deployment berstatus **Ready** -> cek `https://template-catering-psi.vercel.app/`.
