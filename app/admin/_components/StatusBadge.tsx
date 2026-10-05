export default function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = 'bg-neutral-100 text-neutral-700';
  if (/menunggu|pending|proses/.test(s)) cls = 'bg-amber-100 text-amber-800';
  else if (/tolak|gagal|batal|expired/.test(s)) cls = 'bg-red-100 text-red-700';
  else if (/verif|sukses|selesai|berhasil|setuju|dibayar|paid|aktif/.test(s)) cls = 'bg-green-100 text-green-800';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}