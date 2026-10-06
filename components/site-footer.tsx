'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteFooter() {
  const path = usePathname() ?? ''
  const dalamApp =
    path === '/app' || path.startsWith('/app/') || path === '/admin' || path.startsWith('/admin/')
  if (dalamApp) return null

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Image src="/madani.png" alt="MADANI" width={28} height={28} />
            MADANI
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Marketplace kecamatan untuk pekerjaan dan barang. Dikelola oleh PT RHG Teknologi Indonesia.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Informasi</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/privasi" className="hover:underline">Kebijakan Privasi</Link></li>
            <li><Link href="/syarat" className="hover:underline">Syarat dan Ketentuan</Link></li>
            <li><Link href="/hapus-akun" className="hover:underline">Hapus Akun</Link></li>
            <li><Link href="/kontak" className="hover:underline">Hubungi Kami</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Kontak</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            <a href="mailto:info@rhgteknologiindonesia.id" className="hover:underline">
              info@rhgteknologiindonesia.id
            </a>
            <br />
            Menara The Plaza, Jl. M.H. Thamrin No.28-30, Menteng, Jakarta Pusat 10350
          </p>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} PT RHG Teknologi Indonesia. Hak cipta dilindungi.
      </div>
    </footer>
  )
}