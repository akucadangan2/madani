import { NextResponse } from 'next/server'
import { createClient as createJs } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RpcHasil = { data: unknown; error: { message: string } | null }
type PanggilRpc = (fn: string) => PromiseLike<RpcHasil>

const gagal = (error: string, status: number) => NextResponse.json({ error }, { status })

// Pengguna dikenali dari header Bearer (aplikasi) atau cookie (web).
async function kenali(req: Request) {
  const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()

  if (bearer) {
    const { data, error } = await createAdminClient().auth.getUser(bearer)
    if (error || !data.user) return null
    const db = createJs(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    )
    const rpc: PanggilRpc = (fn) => db.rpc(fn)
    return { id: data.user.id, rpc, keluar: async () => {} }
  }

  const sb = await createClient()
  const { data } = await sb.auth.getUser()
  if (!data.user) return null
  const rpc: PanggilRpc = (fn) => sb.rpc(fn)
  return {
    id: data.user.id,
    rpc,
    keluar: async () => {
      try {
        await sb.auth.signOut()
      } catch {
        // sesi sudah tidak valid, abaikan
      }
    },
  }
}

export async function POST(req: Request) {
  const u = await kenali(req)
  if (!u) return gagal('Kamu belum masuk atau sesi sudah berakhir.', 401)

  const body = (await req.json().catch(() => ({}))) as { konfirmasi?: string }
  if (body.konfirmasi !== 'HAPUS') return gagal('Ketik HAPUS untuk mengonfirmasi.', 400)

  // 1. Saldo harus nol (gagal tertutup bila tidak bisa dicek)
  const s = await u.rpc('app_saldo')
  if (s.error) return gagal('Saldo belum bisa diperiksa. Coba lagi sebentar lagi.', 500)
  const r = (Array.isArray(s.data) ? s.data[0] : s.data) as Record<string, unknown> | null
  const saldo = Number(r?.saldo ?? 0)
  const menunggu = Number(r?.penarikan_menunggu ?? 0)
  if (saldo > 0) {
    return gagal(`Saldo kamu masih Rp${saldo.toLocaleString('id-ID')}. Tarik dulu saldonya, baru hapus akun.`, 409)
  }
  if (menunggu > 0) return gagal('Masih ada penarikan dana yang diproses. Tunggu selesai dulu.', 409)

  // 2. Anonimkan data (cek pesanan/pekerjaan aktif ada di dalam fungsi SQL)
  const admin = createAdminClient()
  const { data: hasil, error } = await admin.rpc('hapus_akun_inti', { p_uid: u.id })
  if (error) return gagal(error.message, 409)

  // 3. Hapus berkas (best effort)
  try {
    const ktp = ((hasil as { ktp?: string[] } | null)?.ktp ?? [])
      .map((p) => p.replace(/\?.*$/, '').replace(/^.*\/ktp\//, ''))
      .filter(Boolean)
    if (ktp.length) await admin.storage.from('ktp').remove(ktp)

    const { data: foto } = await admin.storage.from('produk-foto').list(u.id, { limit: 1000 })
    if (foto?.length) {
      await admin.storage.from('produk-foto').remove(foto.map((f) => `${u.id}/${f.name}`))
    }
  } catch {
    // tidak menggagalkan penghapusan akun
  }

  // 4. Tutup akun login (soft delete: id tetap ada agar riwayat tidak putus)
  const { error: errDel } = await admin.auth.admin.deleteUser(u.id, true)
  if (errDel) {
    return gagal(
      'Data sudah dihapus tetapi akun belum tertutup sepenuhnya. Coba lagi atau hubungi info@rhgteknologiindonesia.id.',
      500,
    )
  }

  await u.keluar()
  return NextResponse.json({ ok: true })
}