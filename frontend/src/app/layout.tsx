import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vikings Barber",
    template: "%s | Vikings Barber",
  },
  description: "Barbearia Vikings Barber: veja os horários livres de cada barbeiro e os serviços.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable} h-full antialiased`}>
      <body className="bg-runes flex min-h-full flex-col">{children}</body>
    </html>
  );
}
