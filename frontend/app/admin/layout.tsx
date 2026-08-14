import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <nav className="bg-white border-b border-surface-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-electric bg-clip-text text-transparent">
              ICH Admin Admin
            </span>
          </Link>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">{children}</main>
    </div>
  );
}
