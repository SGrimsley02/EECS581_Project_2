/**
 * File: src/app/layout.tsx
 * Module: User Interface – Root Layout (Next.js App Router)
 * Brief: Defines the global HTML shell (<html>, <body>), imports global CSS, and
 *        applies the Bitcount display font across the app.
 *
 * Inputs:
 *   - Props:
 *       children: React.ReactNode  // The route/page content rendered inside <body>
 *
 * Outputs:
 *   - Returns the root HTML structure with a global font class and antialiasing applied.
 *
 * Side Effects:
 *   - Loads global stylesheet from ./globals.css.
 *   - Registers/uses the Bitcount font via next/font/google (injects a CSS class).
 *
 * External Sources / Attribution:
 *   - Next.js App Router pattern and next/font/google usage per Next.js docs (general pattern).
 *   - Otherwise: None; 
 *
 * EECS 581 – Project 1 Compliance Notes:
 *   - This file provides the **UI shell** that hosts the Minesweeper interface.
 *   - The required game elements (10×10 grid with A–J and 1–10 labels, remaining flags,
 *     and status “Playing/Victory/Loss”) are rendered by child components within <body>.
 * Creation Date: 2025-09-09
 * Course: EECS 581 (Software Engineering II), Prof. Hossein Saiedian – Fall 2025
 */

import type { Metadata } from "next";
import { Bitcount } from "next/font/google";
import "./globals.css";

// [Original] Configure the Bitcount font and expose a CSS class for global typography.
const bitCount = Bitcount({
  weight: "400",
  subsets: ["latin"],
});

// [Original] Default app-wide metadata consumed by Next.js for <head>.
export const metadata: Metadata = {
  title: "Minesweeper - Team 28",
  description: "This is a minesweeper clone created for our EECS 581 class.",
};

// [Original] Root layout for all routes: provides <html> and <body> wrappers.
// Inputs: children — the component tree for the current route.
// Outputs: HTML document structure with font + antialiasing baseline.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // [Original] Set document language for accessibility and SEO.
    <html lang="en">
      <body
        // [Original] Apply Bitcount font class and a baseline text-rendering improvement.
        className={`${bitCount.className} antialiased`}
      >
        {/* [Original] All page content (grid, status bar, counters, modals) renders here. */}
        {children}
      </body>
    </html>
  );
}
