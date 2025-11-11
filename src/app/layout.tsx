import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NHL AI News",
  description: "Automated NHL news with AI-generated articles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
