'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/invoices', label: 'Invoices', icon: '📄' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/revenue', label: 'Revenue', icon: '💰' },
  { href: '/recurring', label: 'Recurring', icon: '🔄' },
  { href: '/reports', label: 'Reports', icon: '📈' },
  { href: '/pricing', label: 'Pricing', icon: '⭐' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className={styles.mobileHeader}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.menuBtn}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <button className={styles.menuBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
        </div>
        
        <div className={styles.mobileLogo}>
          <div className={styles.mobileLogoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#gradientMobile)"/>
              <defs>
                <linearGradient id="gradientMobile" x1="3" y1="2" x2="13" y2="14">
                  <stop stopColor="#e94560"/>
                  <stop offset="1" stopColor="#ff7b93"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.mobileBrand}>Cyber InvoiceFlow</span>
        </div>
      </header>
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="url(#gradient)"/>
                <defs>
                  <linearGradient id="gradient" x1="3" y1="2" x2="13" y2="14" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#e94560"/>
                    <stop offset="1" stopColor="#ff7b93"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className={styles.logoText}>
              <span className={styles.brandName}>Cyber InvoiceFlow</span>
              <span className={styles.brandTagline}>Invoice Manager</span>
            </div>
          </div>
          <button 
            className={styles.closeBtn}
            onClick={() => setIsOpen(false)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navLabel}>MENU</div>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabelText}>{item.label}</span>
              {pathname === item.href && <span className={styles.activeDot} />}
            </Link>
          ))}
        </nav>
        
        <div className={styles.footer}>
          <div className={styles.footerCard}>
            <div className={styles.footerIcon}>🚀</div>
            <div className={styles.footerText}>
              <strong>Cyber InvoiceFlow</strong>
              <span>GRA E-VAT Compliant</span>
            </div>
          </div>
          <div className={styles.version}>v1.0.0</div>
        </div>
      </aside>
      
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </>
  )
}