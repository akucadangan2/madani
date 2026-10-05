# MADANI — Web (Next.js + Supabase)

Struktur project web untuk MADANI: Web Admin, Dashboard Kecamatan, dan Web User
(marketplace tenaga kerja + barang). Mobile app (Flutter) ada di repo terpisah,
sama-sama konek ke backend Supabase yang sama.

## Setup

1. `npm install`
2. Copy `.env.example` ke `.env.local`, isi dengan kredensial project Supabase kamu
3. `npm run dev`

## Struktur folder

- `app/(auth)` — login, register, verifikasi OTP
- `app/(admin)` — Web Admin MADANI (manajemen user, verifikasi KTP, transaksi, bagi hasil, dll)
- `app/(kecamatan)` — Dashboard read-only untuk desa/kecamatan
- `app/(app)` — Web User: modul kerja, marketplace, toko, chat, saldo, profil
- `app/api` — webhook payment gateway & cron job
- `lib/supabase` — client Supabase (browser & server)
- `lib/validations` — schema Zod
- `components` — komponen UI per fitur

## Warna brand

Primary (hijau) `#67B022`, Secondary (teal) `#027A93` — sudah dikonfigurasi di
`tailwind.config.ts` lengkap dengan shade 50–900. Logo taruh sendiri di
`public/logo/` (belum disertakan di scaffold ini).

## TODO sebelum mulai

- [ ] Jalankan migration SQL di project Supabase (lihat repo `supabase/`)
- [ ] Isi `.env.local`
- [ ] Setup akun Midtrans/Xendit (sandbox dulu)
- [ ] Drop logo & favicon ke `public/`
