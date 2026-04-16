'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/invoices', label: 'Invoices', icon: '📄' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/recurring', label: 'Recurring', icon: '🔄' },
  { href: '/reports', label: 'Reports', icon: '📈' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⚡</span>
        <span className={styles.logoText}>InvoiceFlow</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}