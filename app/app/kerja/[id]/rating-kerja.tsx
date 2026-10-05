import { Star } from 'lucide-react';
import { beriRating } from '@/lib/actions/rating';

type Rt = { rating: number; komentar: string | null } | null;

function Bintang({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
        />
      ))}
    </span>
  );
}

export default function RatingKerja({
  taskId,
  lawanNama,
  diberi,
  diterima,
}: {
  taskId: string;
  lawanNama: string;
  diberi: Rt;
  diterima: Rt;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4">
      <h2 className="font-semibold">Penilaian</h2>

      {diberi ? (
        <div className="mt-3">
          <p className="text-xs text-neutral-500">Penilaianmu untuk {lawanNama}</p>
          <div className="mt-1">
            <Bintang n={diberi.rating} />
          </div>
          {diberi.komentar && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{diberi.komentar}</p>}
        </div>
      ) : (
        <form action={beriRating.bind(null, taskId)} className="mt-3 space-y-3">
          <p className="text-sm text-neutral-700">Bagaimana pengalamanmu dengan {lawanNama}?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex-1 cursor-pointer">
                <input type="radio" name="rating" value={n} required className="peer sr-only" />
                <span className="flex flex-col items-center gap-0.5 rounded-xl border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-700 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-300">
                  <Star className="h-5 w-5" />
                  {n}
                </span>
              </label>
            ))}
          </div>
          <textarea
            name="komentar"
            rows={3}
            maxLength={500}
            placeholder="Komentar (opsional)"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <button className="inline-flex w-full items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            Kirim penilaian
          </button>
        </form>
      )}

      {diterima && (
        <div className="mt-4 border-t border-neutral-100 pt-3">
          <p className="text-xs text-neutral-500">Penilaian dari {lawanNama} untukmu</p>
          <div className="mt-1">
            <Bintang n={diterima.rating} />
          </div>
          {diterima.komentar && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{diterima.komentar}</p>
          )}
        </div>
      )}
    </section>
  );
}