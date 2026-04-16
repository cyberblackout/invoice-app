export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    clients: 'Clients',
    payments: 'Payments',
    recurring: 'Recurring',
    reports: 'Reports',
    welcome: 'Welcome Back!',
    totalRevenue: 'Total Revenue',
    pendingPayments: 'Pending Payments',
    overdueInvoices: 'Overdue Invoices',
    activeClients: 'Active Clients',
    newInvoice: 'New Invoice',
    addClient: 'Add Client',
    recordPayment: 'Record Payment',
    taxRate: 'Tax Rate',
    save: 'Save',
    cancel: 'Cancel'
  },
  tw: {
    dashboard: 'Nkyekyere',
    invoices: 'Ntoasoa',
    clients: 'Awurafo',
    payments: 'Mmrane',
    recurring: 'Biakoyɛ',
    reports: 'Amannefo',
    welcome: 'Woaserɛ!',
    totalRevenue: 'Nea wode sika yɛɛ no',
    pendingPayments: 'Wɔrekɔpen sika no',
    overdueInvoices: 'Ntoasoa a wɔapene',
    activeClients: 'Awurafo a wɔwɔ hɔ',
    newInvoice: 'Ntoasoa foforo',
    addClient: 'Yɛ Awura foforo',
    recordPayment: 'Kaa sika no wɔ nkosuo',
    taxRate: 'Dwendwuma tɛkeyɛ',
    save: 'Gyinaase',
    cancel: 'Gyae'
  },
  ee: {
    dashboard: 'Nuŋɔŋlɔ',
    invoices: 'Faks',
    clients: 'Mewulɔ̃wo',
    payments: 'Tsedzra',
    recurring: 'Nuwoleetɔ̃wo',
    reports: 'Akɔntabuba',
    welcome: 'Woaʋu!',
    totalRevenue: 'Gbeqe aɖe si woʋ',
    pendingPayments: 'Tsedzra siwo womeɖo na o',
    overdueInvoices: 'Faks siwo dze',
    activeClients: 'Mewulɔ̃wo siwo womena o',
    newInvoice: 'Faks aɖe',
    addClient: 'Xɔ mewulɔ̃ aɖe',
    recordPayment: 'Kɔna tsedzra',
    taxRate: 'Kɔm gbogbo',
    save: 'Fõ',
    cancel: 'Tši'
  },
  ha: {
    dashboard: 'Dashboard',
    invoices: 'Rajista',
    clients: 'Abokanci',
    payments: 'Biyan Kuɗi',
    recurring: 'Maimaitawa',
    reports: 'Rahotanni',
    welcome: 'Barkai da zuwa!',
    totalRevenue: 'Duka Kudin Samun',
    pendingPayments: 'Biyan Kuɗi Mai jiran',
    overdueInvoices: 'Rajista Masu tsayawa',
    activeClients: 'Abokan Ciniki Masu aiki',
    newInvoice: 'Sabuwar Rajista',
    addClient: 'Ƙara Abokin Ciniki',
    recordPayment: 'Rikodin Biyan Kuɗi',
    taxRate: 'Harajin',
    save: 'Ajiye',
    cancel: 'Goge'
  }
} as const

export type Language = keyof typeof TRANSLATIONS
export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'tw', name: 'Twi' },
  { code: 'ee', name: 'Ewe' },
  { code: 'ha', name: 'Hausa' }
]

export function t(key: keyof typeof TRANSLATIONS.en, lang: Language = 'en'): string {
  return TRANSLATIONS[lang][key] || TRANSLATIONS.en[key] || key
}
