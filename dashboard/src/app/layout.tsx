import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Alfred",
  description: "Alfred Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
