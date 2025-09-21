import type { Metadata } from "next";

import { Bitcount } from "next/font/google";
import "./globals.css";

const bitCount = Bitcount({
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: "Minesweeper - Team 28",
  description: "This is a minesweeper clone created for our EECS 581 class.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bitCount.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
