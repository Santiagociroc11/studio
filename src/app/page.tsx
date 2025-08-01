"use client";

import { useState, useEffect, useMemo } from "react";
import { toZonedTime, format } from "date-fns-tz";
import { differenceInSeconds, intervalToDuration } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Play } from "lucide-react";

// Convierte offset "+05:00" a horas numéricas
function parseOffset(offsetStr: string): number {
  const sign = offsetStr.startsWith("-") ? -1 : 1;
  const [hrs, mins] = offsetStr.slice(1).split(":").map(Number);
  return sign * (hrs + mins / 60);
}

// Contador estilizado
function CountdownDisplay({ targetDate }: { targetDate: Date }) {
  const [dur, setDur] = useState(() => intervalToDuration({ start: new Date(), end: targetDate }));
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = differenceInSeconds(targetDate, now);
      if (diff <= 0) {
        setDur({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(id);
        return;
      }
      setDur(intervalToDuration({ start: now, end: targetDate }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const parts = [
    { label: "DÍAS", v: dur.days || 0 },
    { label: "HORAS", v: dur.hours || 0 },
    { label: "MIN", v: dur.minutes || 0 },
    { label: "SEG", v: dur.seconds || 0 },
  ];
  return (
    <div className="text-center">
      <span className="text-sm uppercase text-gray-500 font-semibold">FALTAN</span>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {parts.map(p => (
          <div key={p.label} className="p-2 bg-red-50 rounded-lg">
            <span className="block text-2xl font-bold text-red-600">{p.v.toString().padStart(2, '0')}</span>
            <span className="block text-xs text-red-500 mt-1 uppercase">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const eventDate = new Date("2025-08-25T19:00:00-05:00");
  const bogotaTz = "America/Bogota";

  // Estados de zona y override
  const [tz, setTz] = useState<string>("UTC");
  const [by, setBy] = useState<string>("navegador");
  const [overrideTz, setOverrideTz] = useState<string>("");
  const [showOv, setShowOv] = useState(false);

  // Horas actuales
  const [nowCol, setNowCol] = useState<string>("");
  const [nowLoc, setNowLoc] = useState<string>("");
  const [offsetDiff, setOffsetDiff] = useState<number>(0);
  const [lang, setLang] = useState<string>("en-US");
  const locale = useMemo(() => (lang.startsWith("es") ? es : enUS), [lang]);

  // Detección de zona
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nav = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    setTz(nav);
    setBy("navegador");
    setLang(navigator.language || "en-US");
    fetch("https://worldtimeapi.org/api/ip")
      .then(r => r.json())
      .then((d: { timezone?: string }) => {
        if (d.timezone && d.timezone !== nav) {
          setTz(d.timezone);
          setBy("IP");
        }
      })
      .catch(() => {});
  }, []);

  const activeTz = overrideTz || tz;

  // Actualizar horas cada segundo en formato AM/PM
  useEffect(() => {
    const fmt = (d: Date, tzStr: string) =>
      format(toZonedTime(d, tzStr), "hh:mm:ss a", { timeZone: tzStr });
    const update = () => {
      const now = new Date();
      setNowCol(fmt(now, bogotaTz));
      setNowLoc(fmt(now, activeTz));
      const offB = parseOffset(
        format(now, 'xxx', { timeZone: bogotaTz })
      );
      const offL = parseOffset(
        format(now, 'xxx', { timeZone: activeTz })
      );
      setOffsetDiff(parseFloat((offL - offB).toFixed(1)));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [activeTz]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <Card className="w-full max-w-lg rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-red-600 p-8 text-white text-center">
          <h1 className="text-4xl font-black uppercase">El evento será el</h1>
          <p className="mt-2 text-3xl font-bold">LUNES 25 DE AGOSTO A LAS 7:00 PM</p>
          <p className="mt-1 text-base">Hora Colombia (UTC-5)</p>
        </div>
        <CardContent className="p-6 bg-white space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg shadow flex items-center space-x-4">
            <Calendar className="text-blue-600 w-6 h-6" />
            <div>
              <p className="text-sm text-blue-700 uppercase font-semibold">Hora actual en Colombia</p>
              <p className="text-xl font-bold text-blue-800">{nowCol || <Skeleton className="h-6 w-24 inline-block" />}</p>
            </div>
          </div>
          {offsetDiff !== 0 ? (
            <div className="bg-green-50 p-4 rounded-lg shadow flex items-center space-x-4">
              <Clock className="text-green-600 w-6 h-6" />
              <div>
                <p className="text-sm text-green-700 uppercase font-semibold">Hora actual (tu zona)</p>
                <p className="text-xl font-bold text-green-800">{nowLoc || <Skeleton className="h-6 w-24 inline-block" />}</p>
                <p className="mt-1 text-sm text-gray-600">{Math.abs(offsetDiff)} {Math.abs(offsetDiff) === 1 ? 'hora' : 'horas'} {offsetDiff > 0 ? 'de adelanto' : 'de retraso'} con Colombia</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg shadow text-center">
              <p className="text-sm text-green-700 uppercase font-semibold">Tu hora coincide con Colombia</p>
              <p className="text-xl font-bold text-green-800">{nowLoc || <Skeleton className="h-6 w-24 inline-block" />}</p>
            </div>
          )}
          <CountdownDisplay targetDate={eventDate} />
        </CardContent>
        <div className="p-6 bg-white border-t space-y-4 text-center">
          <p className="text-gray-600 text-sm">Si quieres tener certeza de a qué hora es... activa el recordatorio en YouTube.</p>
          <a href="https://link.automscc.com/GERL8-CLASE1" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white uppercase font-bold py-4 text-lg rounded-lg shadow-lg flex items-center justify-center">
              <Play className="mr-2" size={20} /> ACTIVAR RECORDATORIO
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
