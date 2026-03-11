import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/disputes', label: 'Disputes' },
    { href: '/admin/reports', label: 'Reports' },
    { href: '/admin/audit-log', label: 'Audit Log' },
    { href: '/admin/store', label: 'Store' },
    { href: '/admin/store/products', label: 'Products' },
    { href: '/admin/store/orders', label: 'Orders' },
  ];

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold">Admin Panel</h1>
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          Admin
        </span>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar nav */}
        <nav className="flex gap-2 overflow-x-auto lg:w-48 lg:flex-col lg:gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-50 hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
