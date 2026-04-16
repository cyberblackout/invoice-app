import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Cyber InvoiceFlow - Ghana Invoice Management",
  description: "GRA E-VAT compliant invoice management for Ghana",
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
        <div className="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}