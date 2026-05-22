import Sidebar from '@/components/layout/Sidebar';
import RightPanel from '@/components/layout/RightPanel';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#080016]">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden min-h-screen border-r border-unseen-800/30">
        {children}
      </main>
      {/* Security + Activity Dashboard — right panel */}
      <aside className="hidden xl:block w-[340px] flex-shrink-0 bg-[#080016] border-l border-unseen-800/20">
        <RightPanel />
      </aside>
    </div>
  );
}
