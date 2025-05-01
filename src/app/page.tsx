"use client";

import { useState, useEffect } from "react";
import { toZonedTime, format } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, ExternalLink, MapPin } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  // — Datos fijos del evento —
  const eventName = "SEMANA DE LA TERAPIA DEL DOLOR";
  const eventAuthor = "Gersson Lopez";
  const scheduleLink = "https://link.automscc.com/Ger-clase1";
  const eventDateWithOffset = "2025-05-26T19:00:00-05:00"; // ISO con UTC-5
  const eventDisplayTimeColombia = "Lunes 26 de Mayo de 2025, 7:00 PM";

  // — Estado local —
  const [userTimeZone, setUserTimeZone] = useState<string>("");
  const [localEventTime, setLocalEventTime] = useState<string>("");

  useEffect(() => {
    // 1. Detectar zona horaria del navegador
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setUserTimeZone(tz);

    // 2. Parsear la fecha del evento (ya incluye -05:00) y convertirla a la zona del usuario
    const eventDate = new Date(eventDateWithOffset);
    const zonedDate = toZonedTime(eventDate, tz);

    // 3. Formatear en español
    const formatted = format(
      zonedDate,
      "EEEE d 'de' MMMM 'de' yyyy, h:mm a (zzzz)",
      { locale: es, timeZone: tz }
    );
    setLocalEventTime(formatted);
  }, []);

  return (
    <div className="flex justify-center items-start pt-16 pb-16 min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100">
      <Card className="w-full max-w-lg shadow-xl border border-gray-200/50 rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-5">
          <CardTitle className="text-2xl font-bold text-gray-800 tracking-tight">
            {eventName}
          </CardTitle>
          <div className="flex items-center text-sm text-gray-600 pt-2">
            <User className="h-4 w-4 mr-1.5 text-gray-500" />
            <span>Por: {eventAuthor}</span>
          </div>
        </CardHeader>

        {/* Contenido */}
        <CardContent className="p-6 md:p-8 space-y-6 flex-grow">
          {/* Horario original */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Horario Original (Colombia)
            </h3>
            <div className="flex items-center space-x-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="text-gray-800 font-medium text-sm md:text-base">
                {eventDisplayTimeColombia}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2 pl-1">(UTC-5)</p>
          </div>

          <div className="border-t border-dashed border-gray-200"></div>

          {/* Horario local */}
          <div className="p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-indigo-500" />
              Tu Horario Local
            </h3>
            <div className="flex items-center space-x-3 bg-green-50/60 p-3 rounded-lg border border-green-100">
              <Clock className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-gray-800 font-medium text-sm md:text-base">
                {localEventTime || "Cargando..."}
              </span>
            </div>
            {userTimeZone && (
              <p className="text-xs text-gray-400 mt-1 pl-1 font-light">
                Zona detectada: {userTimeZone}
              </p>
            )}
          </div>
        </CardContent>

        {/* Footer / Botón */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-200 mt-auto">
          <a
            href={scheduleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
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
