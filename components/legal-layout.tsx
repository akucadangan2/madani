import Image from 'next/image'
import Link from 'next/link'

export default function LegalLayout({
  judul,
  diperbarui,
  children,
}: {
  judul: string
  diperbarui?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
            <Image src="/madani.png" alt="MADANI" width={28} height={28} />
            MADANI
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{judul}</h1>
        {diperbarui && <p className="mt-1 text-sm text-slate-500">Terakhir diperbarui: {diperbarui}</p>}
        <div className="mt-8 space-y-4 text-[15px] leading-7 text-slate-700 [&_a]:text-emerald-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </main>
    </div>
  )
}