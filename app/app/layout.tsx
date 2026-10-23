import PingAktif from '@/components/ping-aktif';
import BottomNav from './_components/BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-28">
      <PingAktif />
        {children}
      <BottomNav />
    </div>
  );
}