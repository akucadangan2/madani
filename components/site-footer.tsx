'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PLAY_STORE_URL } from '@/components/tombol-play-store'

export default function SiteFooter() {
  const path = usePathname() ?? ''
  const dalamApp =
    path === '/app' || path.startsWith('/app/') || path === '/admin' || path.startsWith('/admin/')
  if (dalamApp) return null

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Image src="/logo.png" alt="MADANI" width={28} height={28} />
            MADANI
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Marketplace kecamatan untuk pekerjaan dan barang. Dikembangkan oleh Sharee Management Group.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Jelajahi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/lowongan" className="hover:underline">Lowongan kerja</Link></li>
            <li><Link href="/produk" className="hover:underline">Produk</Link></li>
            <li>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Unduh di Google Play
              </a>
            </li>
            <li><Link href="/register" className="hover:underline">Daftar gratis</Link></li>
            <li><Link href="/login" className="hover:underline">Masuk</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Informasi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
            <li><Link href="/syarat" className="hover:underline">Syarat dan Ketentuan</Link></li>
            <li><Link href="/refund" className="hover:underline">Kebijakan Refund</Link></li>
            <li><Link href="/privasi" className="hover:underline">Kebijakan Privasi</Link></li>
            <li><Link href="/hapus-akun" className="hover:underline">Hapus Akun</Link></li>
            <li><Link href="/kontak" className="hover:underline">Hubungi Kami</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Kontak</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            <a href="mailto:info@madani.id" className="hover:underline">info@madani.id</a>
            <br />
            <a href="mailto:info@rhgteknologiindonesia.id" className="hover:underline">
              info@rhgteknologiindonesia.id
            </a>
            <br />
            Jl. Kasnariansyah No 1500 Palembang Sumatera Selatan 30128
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Madani Berdaya. Hak cipta dilindungi.
      </div>
    </footer>
  )
}