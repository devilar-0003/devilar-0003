import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "WONK"],
  variable: "--font-display-loaded",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
});

export const metadata: Metadata = {
  title: "Retain — Exam Preparation in Record Time",
  description:
    "The spaced-repetition engine and record-pace quiz that turn cramming into retention. Flashcards, quizzes, and exam countdowns — built for record-time recall.",
  keywords: ["exam preparation", "spaced repetition", "flashcards", "quiz", "study time"],
};

export const viewport: Viewport = {
  themeColor: "#0b0a08",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="grain bg-ink text-cream antialiased selection:bg-acid selection:text-ink">
        {children}
      </body>
    </html>
  );
}
