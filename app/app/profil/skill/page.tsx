import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { tambahSkill, hapusSkill } from '@/lib/actions/profil';

export default async function ProfilSkillPage() {
  const current = await getCurrentUser();
  if (!current) return <div className="p-6">Silakan login</div>;

  const supabase = await createClient();
  const { data: profil } = await supabase.from('profiles').select('skills').eq('id', current.id).single();
  const skills: string[] = profil?.skills ?? [];

  const { data: ratingList } = await supabase
    .from('rating').select('rating, komentar').eq('untuk_user_id', current.id);

  const jumlahRating = ratingList?.length ?? 0;
  const rataRata = ratingList && ratingList.length > 0
    ? (ratingList.reduce((a, r) => a + r.rating, 0) / ratingList.length).toFixed(1)
    : null;

  return (
    <div className="p-6 max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-neutral-900">Profil & Skill</h1>

      <div className="rounded-lg border border-neutral-200 p-4">
        <h2 className="font-medium text-neutral-900 mb-1">Rating</h2>
        {rataRata ? (
          <p className="text-sm text-neutral-600">
            <span className="text-primary-700 font-semibold">{rataRata} ★</span> dari {jumlahRating} ulasan
          </p>
        ) : (
          <p className="text-sm text-neutral-400">Belum ada rating</p>
        )}
      </div>

      <div>
        <h2 className="font-medium text-neutral-900 mb-2">Skill Saya</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((s) => (
            <form key={s} action={hapusSkill.bind(null, s)}>
              <button className="flex items-center gap-1 rounded-full bg-secondary-50 text-secondary-700 px-3 py-1 text-sm">
                {s} <span className="text-secondary-400">×</span>
              </button>
            </form>
          ))}
          {skills.length === 0 && <p className="text-neutral-400 text-sm">Belum ada skill ditambahkan</p>}
        </div>

        <form action={tambahSkill} className="flex gap-2">
          <input name="skill" placeholder="Tambah skill, mis. Tukang Kayu"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-lg bg-primary-500 px-4 py-2 text-white text-sm">Tambah</button>
        </form>
      </div>

      {jumlahRating > 0 && (
        <div>
          <h2 className="font-medium text-neutral-900 mb-2">Ulasan</h2>
          <div className="space-y-2">
            {ratingList?.filter((r) => r.komentar).map((r, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 p-3 text-sm">
                <span className="text-primary-700 font-semibold">{r.rating} ★</span>
                <p className="text-neutral-600 mt-1">{r.komentar}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}