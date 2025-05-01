
"use client"; // Mark this component for client-side execution

import { useState, useEffect } from 'react';
// Import specific functions directly, ensuring correct names for date-fns-tz v3+
import { zonedTimeToUtc, toZonedTime, format } from 'date-fns-tz';
import { es } from 'date-fns/locale'; // Import Spanish locale for formatting
import { Calendar, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);
  const [eventTimeInUserZone, setEventTimeInUserZone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Event Definition ---
  const eventDateStr = '2025-05-26T19:00:00'; // May 26, 2025, 7:00 PM
  const eventTimeZone = 'America/Bogota'; // Colombia Timezone
  const eventDisplayTimeColombia = "Lunes 26 de Mayo de 2025, 7:00 PM"; // Pre-formatted for display

  useEffect(() => {
    // This effect runs only in the client's browser
    try {
      // 1. Detect user's timezone
      const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!detectedTimeZone) {
        throw new Error("No se pudo detectar la zona horaria automáticamente.");
      }
      setUserTimeZone(detectedTimeZone);

      // 2. Convert event time (in Colombia zone) to UTC using the imported function
      const eventTimeUtc = zonedTimeToUtc(eventDateStr, eventTimeZone);

      // 3. Convert UTC time to the user's detected timezone using the imported function
      const userZonedEventTime = toZonedTime(eventTimeUtc, detectedTimeZone);

      // 4. Format the date and time for display in Spanish using the imported function
      const formattedTime = format(
        userZonedEventTime,
        "EEEE d 'de' MMMM 'de' yyyy, h:mm a (zzzz)",
        { timeZone: detectedTimeZone, locale: es } // Use Spanish locale
      );

      setEventTimeInUserZone(formattedTime);
      setError(null); // Clear any previous error

    } catch (err) {
      console.error("Error detecting timezone or calculating time:", err);
      setError("No pudimos calcular la hora para tu ubicación. Por favor, verifica la hora original.");
      // Optionally clear other state if needed
      setUserTimeZone(null);
      setEventTimeInUserZone(null);
    } finally {
      // Add a small delay for visual effect of loading
      setTimeout(() => setIsLoading(false), 500);
    }

  }, []); // Empty dependency array ensures this runs once on mount

  // This part needs to run client-side after hydration to avoid mismatch
  const [footerYear, setFooterYear] = useState<number | null>(null);
  useEffect(() => {
    setFooterYear(new Date().getFullYear());
  }, []);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <Card className="w-full max-w-lg shadow-lg rounded-lg border border-border overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-6">
          <CardTitle className="text-center text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
            <Calendar className="w-6 h-6" />
            ¡Prepárate para Nuestro Evento!
          </CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 pt-1">
            La primera clase está a la vuelta de la esquina.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 text-center">

          {/* Original Event Time */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Hora Original del Evento
            </h3>
            <p className="text-muted-foreground">
              {eventDisplayTimeColombia}
            </p>
            <p className="text-sm text-muted-foreground/80">
              (Hora de Colombia - {eventTimeZone})
            </p>
          </div>

          <hr className="border-border" />

          {/* Converted Time Section */}
          <div className="space-y-2 min-h-[120px] flex flex-col justify-center items-center">
            <h3 className="text-lg font-semibold text-foreground">
              Tu Hora Local Estimada
            </h3>
            {isLoading ? (
              <div className="space-y-2 w-full max-w-xs mx-auto">
                <Skeleton className="h-6 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-3 w-1/3 mx-auto mt-1" />
              </div>
            ) : error ? (
              <p className="text-destructive font-medium px-4">{error}</p>
            ) : eventTimeInUserZone ? (
               <div className="transition-all duration-500 ease-out transform scale-100 opacity-100">
                <p className={cn(
                    "text-xl md:text-2xl font-bold text-accent mt-1 px-2 py-1 rounded-md",
                    // "bg-accent/10" // Optional subtle background for highlight
                  )}>
                  {eventTimeInUserZone}
                </p>
                 {userTimeZone && (
                   <p className="text-xs text-muted-foreground mt-1">
                     (Zona horaria detectada: {userTimeZone})
                   </p>
                 )}
               </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
       {footerYear ? `Time Traveler App © ${footerYear}` : 'Loading year...'}
      </footer>
    </main>
  );
}
