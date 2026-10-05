// Samakan dengan nilai enum di database
export const TOKO = {
  MENUNGGU: 'menunggu',
  SETUJU: 'terverifikasi',
  TOLAK: 'ditolak',
} as const;

export const KTP = {
  MENUNGGU: 'menunggu',
  SETUJU: 'terverifikasi',
  TOLAK: 'ditolak',
} as const;

export const PENARIKAN = {
  MENUNGGU: 'menunggu',
  SETUJU: 'disetujui',
  TOLAK: 'ditolak',
  SELESAI: 'selesai',
} as const;