import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "InvoiceFlow - Invoice Management",
  description: "Create and manage invoices with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div style={{ marginLeft: 'var(--sidebar-width)', minHeight: '100vh', padding: '32px' }}>
          {children}
        </div>
      </body>
    </html>
  );
}