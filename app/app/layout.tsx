import BottomNav from './_components/BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-28">
      {children}
      <BottomNav />
    </div>
  );
}