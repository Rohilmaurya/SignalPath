import type { Metadata } from "next";
import "./globals.css";
import "lenis/dist/lenis.css";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "SignalPath — Predictive Incident Observatory",
  description: "AI-assisted operations observatory for telemetry drift, predictive failure analysis, cascading blast radius, and simulated recovery tradeoffs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen bg-[#FAFAFA] text-[#18181B] selection:bg-[#FC4778] selection:text-white antialiased font-sans">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
