"use client"; // Mark this component for client-side execution

import { useState, useEffect } from 'react';
// Import specific functions directly, ensuring correct names for date-fns-tz v3+
import { toZonedTime, format } from 'date-fns-tz';
import { getUnixTime } from 'date-fns'; // Needed for offset calculation
import { es } from 'date-fns/locale'; // Import Spanish locale for formatting
import { Calendar, Clock, AlertTriangle, User, ExternalLink } from 'lucide-react'; // Added User, ExternalLink

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button"; // Import Button
import { cn } from '@/lib/utils';

// Helper function to get offset in hours
const getOffsetHours = (date: Date, timeZone: string): number => {
  // format 'xxx' gives offset like +05:30 or -07:00 or Z
  const offsetString = format(date, 'xxx', { timeZone });
  if (offsetString === 'Z') return 0;
  const [hoursStr, minutesStr] = offsetString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || '0', 10);
  // Handle negative offsets correctly (e.g., -07:00 means hours is -7)
  const totalHours = hours < 0 ? hours - minutes / 60 : hours + minutes / 60;
  return totalHours;
};

export default function HomePage() {
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);
  const [eventTimeInUserZone, setEventTimeInUserZone] = useState<string | null>(null);
  const [timeDifferenceInfo, setTimeDifferenceInfo] = useState<string | null>(null); // State for difference info
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Event Definition ---
  const eventName = "SEMANA DE LA TERAPIA DEL DOLOR"; // Event Name
  const eventAuthor = "Gersson Lopez"; // Author Name
  const scheduleLink = "https://link.automscc.com/Ger-clase1"; // Schedule Link

  const eventDateStr = '2025-05-26T19:00:00'; // May 26, 2025, 7:00 PM
  const eventTimeZone = 'America/Bogota'; // Colombia Timezone (-05:00)
  const eventDisplayTimeColombia = "Lunes 26 de Mayo de 2025, 7:00 PM"; // Pre-formatted for display

  useEffect(() => {
    let detectedTimeZone: string | null = null; // Define here for use in catch block
    try {
       detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!detectedTimeZone) {
        throw new Error("No se pudo detectar la zona horaria automáticamente.");
      }
      setUserTimeZone(detectedTimeZone);

      const eventTimeInEventZone = toZonedTime(eventDateStr, eventTimeZone);
      const userZonedEventTime = toZonedTime(eventTimeInEventZone, detectedTimeZone);

      // Calculate Time Difference
      const eventOffsetHours = getOffsetHours(eventTimeInEventZone, eventTimeZone);
      const userOffsetHours = getOffsetHours(userZonedEventTime, detectedTimeZone);
      const differenceHours = userOffsetHours - eventOffsetHours;

      let diffInfo = "";
      if (differenceHours === 0) {
        diffInfo = "Estás en la misma zona horaria del evento.";
      } else if (differenceHours > 0) {
        diffInfo = `Tu zona horaria está ${differenceHours} hora${differenceHours !== 1 ? 's' : ''} adelante de la del evento.`;
      } else {
        diffInfo = `Tu zona horaria está ${Math.abs(differenceHours)} hora${Math.abs(differenceHours) !== 1 ? 's' : ''} detrás de la del evento.`;
      }
      setTimeDifferenceInfo(diffInfo);


      const formattedTime = format(
        userZonedEventTime,
        "EEEE d 'de' MMMM 'de' yyyy, h:mm a (zzzz)",
        { timeZone: detectedTimeZone, locale: es }
      );

      setEventTimeInUserZone(formattedTime);
      setError(null);

    } catch (err) {
      console.error("Error detecting timezone or calculating time:", err);
      let errorMessage = "No pudimos calcular la hora para tu ubicación.";
       if (err instanceof Error && err.message.includes("Invalid time zone specified")) {
           errorMessage += ` La zona horaria detectada (${detectedTimeZone || 'desconocida'}) podría no ser reconocida.`;
       } else {
           errorMessage += " Por favor, verifica la hora original.";
       }
      setError(errorMessage);
      // Don't set userTimeZone state here if it caused the error
      // setUserTimeZone(null); 
      setEventTimeInUserZone(null);
      setTimeDifferenceInfo(null);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }

  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="flex justify-center items-start pt-16 pb-16 min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100">
      <Card className="w-full max-w-lg shadow-xl border border-gray-200/50 rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5">
          {/* Updated Event Title */}
          <CardTitle className="text-2xl font-bold text-gray-800 tracking-tight">{eventName}</CardTitle>
          {/* Author Info */}
          <div className="flex items-center text-sm text-gray-600 pt-2">
            <User className="h-4 w-4 mr-1.5 text-gray-500" />
            <span>Por: {eventAuthor}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6 flex-grow"> {/* Added flex-grow */}
          {/* Section for Original Time */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Horario Original (Colombia)</h3>
            <div className="flex items-center space-x-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-800 font-medium text-sm md:text-base">{eventDisplayTimeColombia}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 pl-1">(Zona horaria: {eventTimeZone})</p>
          </div>

          <div className="border-t border-dashed border-gray-200"></div>

          {/* Section for User's Local Time */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Tu Horario Local</h3>
            {isLoading ? (
              <div className="space-y-3 p-3">
                <Skeleton className="h-5 w-3/4 bg-gray-200 rounded" />
                <Skeleton className="h-4 w-1/2 bg-gray-200 rounded" />
                <Skeleton className="h-4 w-3/5 bg-gray-200 rounded mt-1" />
              </div>
            ) : error ? (
              <div className="flex items-start space-x-3 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100">
                 <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                 <p className="text-sm font-medium">{error}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-3 bg-green-50/60 p-3 rounded-lg border border-green-100">
                  <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-sm md:text-base">{eventTimeInUserZone}</span>
                </div>
                {/* Display Time Difference Info */}
                {timeDifferenceInfo && (
                   <p className={cn(
                     "text-xs mt-2 pl-1",
                     timeDifferenceInfo.includes("misma") ? "text-indigo-600 font-semibold" : "text-gray-500"
                   )}>
                     {timeDifferenceInfo}
                   </p>
                )}
                {userTimeZone && (
                  <p className="text-xs text-gray-400 mt-1 pl-1">(Tu zona detectada: {userTimeZone})</p>
                 )}
               </>
            )}
          </div>
        </CardContent>
         {/* Schedule Button Section - Added Footer-like styling */} 
         <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 mt-auto"> {/* Added mt-auto */}
            <a href={scheduleLink} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3">
                Agendar Primera Clase
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>
        </div>
      </Card>
    </div>
  );
}
