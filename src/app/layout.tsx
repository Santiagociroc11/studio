import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed to Inter for a clean look
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Use CSS variable for easier application
});

export const metadata: Metadata = {
  title: 'Time Traveler - Event Time Converter', // Updated title
  description: 'Descubre la hora de nuestro evento en tu zona horaria local.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Set language to Spanish */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable // Apply the font variable
        )}
      >
        {children}
        <Toaster /> {/* Add Toaster component for potential future notifications */}
      </body>
    </html>
  );
}
