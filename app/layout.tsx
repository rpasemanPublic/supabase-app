import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supabase App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-900">{children}</body>
    </html>
  );
}
