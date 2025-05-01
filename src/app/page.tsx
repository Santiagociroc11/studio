"use client"; // Mark this component for client-side execution

import { useState, useEffect } from 'react';
import { toZonedTime, format } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { Calendar, Clock, AlertTriangle, User, ExternalLink, MapPin, Loader2 } from 'lucide-react'; // Added MapPin, Loader2

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

// --- Interfaces for API Response ---
interface WorldTimeApiResponse {
  timezone: string;
  utc_offset: string;
  // Add other fields if needed, like client_ip
}

// --- Helper Function for Offset (Remains the same) ---
const getOffsetHours = (date: Date, timeZone: string): number => {
  try {
    const offsetString = format(date, 'xxx', { timeZone });
    if (offsetString === 'Z') return 0;
    const [hoursStr, minutesStr] = offsetString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || '0', 10);
    const totalHours = hours < 0 ? hours - minutes / 60 : hours + minutes / 60;
    return totalHours;
  } catch (e) {
    // Handle potential errors if format fails with an invalid timezone from API
    console.error(`Error formatting offset for timezone ${timeZone}:`, e);
    // Fallback or re-throw, depending on desired behavior. Returning NaN indicates failure.
    return NaN;
  }
};


export default function HomePage() {
  const [userTimeZone, setUserTimeZone] = useState<string | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<'ip' | 'browser' | null>(null); // Track detection source
  const [eventTimeInUserZone, setEventTimeInUserZone] = useState<string | null>(null);
  const [timeDifferenceInfo, setTimeDifferenceInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Event Definition (Remains the same) ---
  const eventName = "SEMANA DE LA TERAPIA DEL DOLOR";
  const eventAuthor = "Gersson Lopez";
  const scheduleLink = "https://link.automscc.com/Ger-clase1";
  const eventDateStr = '2025-05-26T19:00:00';
  const eventTimeZone = 'America/Bogota';
  const eventDisplayTimeColombia = "Lunes 26 de Mayo de 2025, 7:00 PM";

  useEffect(() => {
    const fetchTimeZoneAndCalculate = async () => {
      setIsLoading(true);
      setError(null);
      let detectedTimeZone: string | null = null;
      let method: 'ip' | 'browser' = 'browser'; // Default to browser

      try {
        // 1. Attempt IP-based Geolocation
        try {
          const response = await fetch('https://worldtimeapi.org/api/ip');
          if (!response.ok) {
            // Throw an error to be caught by the outer catch block if API fails
             throw new Error(`IP Geolocation API failed with status: ${response.status}`);
          }
          const data: WorldTimeApiResponse = await response.json();
          if (data.timezone) {
            detectedTimeZone = data.timezone;
            method = 'ip';
            console.log(`Timezone detected via IP: ${detectedTimeZone}`);
          } else {
             // If API returns OK but no timezone, fall back gracefully
             console.warn("IP Geolocation API did not return a timezone.");
          }
        } catch (ipApiError) {
           console.error("IP Geolocation API error:", ipApiError);
           // Fallback to browser detection if IP lookup fails
        }

        // 2. Fallback to Browser/OS detection if IP lookup failed or didn't provide a timezone
        if (!detectedTimeZone) {
            console.log("Falling back to browser/OS timezone detection.");
            detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            method = 'browser';
             if (!detectedTimeZone) {
                // This is unlikely but possible
                 throw new Error("No se pudo detectar la zona horaria (ni por IP ni por navegador).");
             }
             console.log(`Timezone detected via browser/OS: ${detectedTimeZone}`);
        }

        setUserTimeZone(detectedTimeZone);
        setDetectionMethod(method);

        // 3. Perform Time Calculations (moved inside the async function)
        const eventTimeInEventZone = toZonedTime(eventDateStr, eventTimeZone);
        const userZonedEventTime = toZonedTime(eventTimeInEventZone, detectedTimeZone);

        // Calculate Time Difference
        const eventOffsetHours = getOffsetHours(eventTimeInEventZone, eventTimeZone);
        const userOffsetHours = getOffsetHours(userZonedEventTime, detectedTimeZone);

        // Check if offset calculation failed (returned NaN)
        if (isNaN(eventOffsetHours) || isNaN(userOffsetHours)) {
             throw new Error(`Error calculating timezone offsets. Detected timezone "${detectedTimeZone}" might be invalid.`);
        }

        const differenceHours = userOffsetHours - eventOffsetHours;

        let diffInfo = "";
        if (differenceHours === 0) {
          diffInfo = "Estás en la misma zona horaria del evento.";
        } else if (differenceHours > 0) {
           const hoursText = differenceHours === 1 ? 'hora' : 'horas';
           diffInfo = `Tu zona horaria está ${differenceHours} ${hoursText} adelante (${method === 'ip' ? 'detectada por IP' : 'según navegador/OS'}).`;
        } else {
           const hoursText = Math.abs(differenceHours) === 1 ? 'hora' : 'horas';
           diffInfo = `Tu zona horaria está ${Math.abs(differenceHours)} ${hoursText} detrás (${method === 'ip' ? 'detectada por IP' : 'según navegador/OS'}).`;
        }
        setTimeDifferenceInfo(diffInfo);

        // Format time for display
        const formattedTime = format(
          userZonedEventTime,
          "EEEE d 'de' MMMM 'de' yyyy, h:mm a (zzzz)",
          { timeZone: detectedTimeZone, locale: es }
        );
        setEventTimeInUserZone(formattedTime);
        setError(null); // Clear previous errors if successful

      } catch (err) {
        console.error("Error during timezone detection or calculation:", err);
        let errorMessage = "No pudimos determinar tu hora local.";
        if (err instanceof Error) {
            if (err.message.includes("Invalid time zone specified") || err.message.includes("invalid timezone")) {
                errorMessage += ` La zona horaria "${userTimeZone || 'desconocida'}" podría no ser válida.`;
            } else if (err.message.includes("API failed")) {
                 errorMessage += " Hubo un problema al contactar el servicio de geolocalización. Se intentó usar la hora del navegador.";
            } else {
                errorMessage += ` (${err.message})`; // Include generic error message
            }
        }
        setError(errorMessage);
        // Clear potentially incorrect state
        setUserTimeZone(null);
        setDetectionMethod(null);
        setEventTimeInUserZone(null);
        setTimeDifferenceInfo(null);
      } finally {
        // Use a slightly longer delay to allow API call + rendering
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchTimeZoneAndCalculate();

  }, []); // Empty dependency array: Fetch and calculate only once on mount

  return (
    <div className="flex justify-center items-start pt-16 pb-16 min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100">
      <Card className="w-full max-w-lg shadow-xl border border-gray-200/50 rounded-2xl overflow-hidden flex flex-col">
        {/* Header Section */}
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5">
          <CardTitle className="text-2xl font-bold text-gray-800 tracking-tight">{eventName}</CardTitle>
          <div className="flex items-center text-sm text-gray-600 pt-2">
            <User className="h-4 w-4 mr-1.5 text-gray-500" />
            <span>Por: {eventAuthor}</span>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="p-6 md:p-8 space-y-6 flex-grow">
          {/* Original Time Display */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Horario Original (Colombia)</h3>
            <div className="flex items-center space-x-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-800 font-medium text-sm md:text-base">{eventDisplayTimeColombia}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 pl-1">(Zona horaria: {eventTimeZone})</p>
          </div>

          <div className="border-t border-dashed border-gray-200"></div>

          {/* Local Time Display */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-indigo-500" /> {/* Icon for local time */}
              Tu Horario Local Estimado
            </h3>
            {isLoading ? (
              <div className="flex items-center space-x-3 p-3">
                 <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                 <span className="text-gray-500 text-sm">Detectando tu zona horaria...</span>
              </div>
            ) : error ? (
              <div className="flex items-start space-x-3 bg-red-50 text-red-700 p-3 rounded-lg border border-red-100">
                 <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                 <p className="text-sm font-medium">{error}</p>
              </div>
            ) : eventTimeInUserZone ? ( // Check if eventTimeInUserZone is available
              <>
                <div className="flex items-center space-x-3 bg-green-50/60 p-3 rounded-lg border border-green-100">
                  <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-800 font-medium text-sm md:text-base">{eventTimeInUserZone}</span>
                </div>
                {timeDifferenceInfo && (
                   <p className={cn(
                     "text-xs mt-2 pl-1",
                     timeDifferenceInfo.includes("misma") ? "text-indigo-600 font-semibold" : "text-gray-500"
                   )}>
                     {timeDifferenceInfo}
                   </p>
                )}
                 {userTimeZone && (
                  <p className="text-xs text-gray-400 mt-1 pl-1 font-light">
                      (Zona: {userTimeZone} - Método: {detectionMethod === 'ip' ? 'IP Geolocation' : 'Navegador/OS'})
                  </p>
                 )}
               </>
            ) : (
                 // Fallback if no error but time couldn't be calculated (shouldn't normally happen)
                 <div className="flex items-start space-x-3 bg-yellow-50 text-yellow-700 p-3 rounded-lg border border-yellow-100">
                     <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                     <p className="text-sm font-medium">No se pudo calcular la hora local después de detectar la zona horaria.</p>
                 </div>
            )}
          </div>
        </CardContent>

        {/* Footer/Button Section */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 mt-auto">
          <a href={scheduleLink} target="_blank" rel="noopener noreferrer" className="block w-full">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 shadow-md hover:shadow-lg transition-shadow duration-200">
              Agendar Primera Clase
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
