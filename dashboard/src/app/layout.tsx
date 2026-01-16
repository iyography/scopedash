import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScopeDash",
  description: "TikTok Analytics Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
