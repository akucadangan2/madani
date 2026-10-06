'use client'

import { useState } from 'react'

export default function HapusAkunForm() {
  const [teks, setTeks] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function kirim() {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/akun/hapus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ konfirmasi: teks.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j.error ?? 'Gagal menghapus akun.')
        setBusy(false)
        return
      }
      window.location.href = '/hapus-akun?selesai=1'
    } catch {
      setErr('Tidak bisa terhubung ke server. Coba lagi.')
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-semibold text-red-900">Ketik HAPUS untuk mengonfirmasi</p>
      <input
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder="HAPUS"
        className="mt-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-slate-900"
      />
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
      <button
        onClick={kirim}
        disabled={busy || teks.trim() !== 'HAPUS'}
        className="mt-3 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-40"
      >
        {busy ? 'Menghapus...' : 'Hapus akun saya'}
      </button>
    </div>
  )
}