"use client";
import React, { useEffect, useState } from "react";

interface HeatmapResponse {
  matrix: number[][]; // [day][hour]
  max: number;
  days: number;
}

interface ViewsHeatmapProps {
  candidateId: number;
  days?: number;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ViewsHeatmap({
  candidateId,
  days = 30,
}: ViewsHeatmapProps) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{
    day: number;
    hour: number;
    value: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (candidateId == null || Number.isNaN(candidateId)) {
      return; // guard against undefined causing 400
    }
    setLoading(true);
    setError(null);
    if (process.env.NODE_ENV === "development") {
      // Lightweight debug – only in dev
      console.debug("Fetching heatmap", { candidateId, days });
    }
    fetch(`/api/candidateViews/heatmap?candidateID=${candidateId}&days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load heatmap");
        return r.json();
      })
      .then((json) => setData(json))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [candidateId, days]);

  if (candidateId == null || Number.isNaN(candidateId)) {
    return (
      <div className="text-xs text-gray-500">Waiting for candidate...</div>
    );
  }

  if (loading)
    return (
      <div className="text-xs text-gray-500">
        Loading time-of-day activity...
      </div>
    );
  if (error) return <div className="text-xs text-red-500">{error}</div>;
  if (!data) return null;

  const { matrix, max } = data;
  // Group hours on mobile to reduce horizontal width (3-hour buckets => 8 columns)
  const HOUR_GROUP = 3;
  const displayMatrix = isMobile
    ? matrix.map((row) => {
        const grouped: number[] = [];
        for (let h = 0; h < 24; h += HOUR_GROUP) {
          let sum = 0;
          for (let inner = h; inner < h + HOUR_GROUP && inner < 24; inner++) {
            sum += row[inner];
          }
          grouped.push(sum);
        }
        return grouped;
      })
    : matrix;
  const hoursCount = isMobile ? Math.ceil(24 / HOUR_GROUP) : 24;
  const scaleColor = (value: number) => {
    if (max === 0) return "#f3f4f6"; // gray-100
    const ratio = value / max; // 0..1
    // interpolate light purple to deep purple
    const start = { r: 237, g: 233, b: 254 }; // indigo-50
    const end = { r: 91, g: 33, b: 182 }; // indigo-800
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Time of Day Activity (last {days} days)
        </h3>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `40px repeat(${hoursCount}, 1fr)` }}
        >
          <div></div>
          {Array.from({ length: hoursCount }, (_, idx) => {
            if (!isMobile) {
              const h = idx;
              const hour12 = ((h + 11) % 12) + 1; // 0 -> 12
              const isAM = h < 12;
              const label = `${hour12}${isAM ? "a" : "p"}`;
              return (
                <div
                  key={h}
                  className="text-center text-[10px] text-gray-500"
                  title={`${hour12}:00 ${isAM ? "AM" : "PM"}`}
                >
                  {label}
                </div>
              );
            }
            // Mobile grouped hour label
            const startHour = idx * HOUR_GROUP;
            const endHour = Math.min(startHour + HOUR_GROUP - 1, 23);
            const startHour12 = ((startHour + 11) % 12) + 1;
            const endHour12 = ((endHour + 11) % 12) + 1;
            const startAM = startHour < 12;
            const label = `${startHour12}${startAM ? "a" : "p"}`;
            return (
              <div
                key={idx}
                className="text-center text-[10px] text-gray-500"
                title={`${startHour12}:00 - ${endHour12}:59`}
              >
                {label}
              </div>
            );
          })}
          {displayMatrix.map((row, day) => (
            <React.Fragment key={day}>
              <div className="text-[11px] font-medium text-gray-600 flex items-center">
                {dayLabels[day]}
              </div>
              {row.map((val, colIdx) => {
                const color = scaleColor(val);
                let ariaTime: string;
                if (!isMobile) {
                  const hour12 = ((colIdx + 11) % 12) + 1;
                  const isAM = colIdx < 12;
                  ariaTime = `${hour12}:00 ${isAM ? "AM" : "PM"}`;
                } else {
                  const startHour = colIdx * HOUR_GROUP;
                  const endHour = Math.min(startHour + HOUR_GROUP - 1, 23);
                  const startHour12 = ((startHour + 11) % 12) + 1;
                  const endHour12 = ((endHour + 11) % 12) + 1;
                  const startAM = startHour < 12;
                  const endAM = endHour < 12;
                  ariaTime = `${startHour12}${
                    startAM ? "AM" : "PM"
                  }-${endHour12}${endAM ? "AM" : "PM"}`;
                }
                return (
                  <button
                    key={colIdx}
                    onMouseEnter={() =>
                      setHover({ day, hour: colIdx, value: val })
                    }
                    onMouseLeave={() => setHover(null)}
                    className="relative h-5 w-full rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
                    style={{ backgroundColor: color }}
                    aria-label={`${val} view${val !== 1 ? "s" : ""} on ${
                      dayLabels[day]
                    } at ${ariaTime}`}
                  >
                    {hover &&
                      hover.day === day &&
                      hover.hour === colIdx &&
                      val > 0 && (
                        <span
                          className={
                            `absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white shadow pointer-events-none z-20 ` +
                            (day === 0 ? "top-full mt-1" : "-top-7")
                          }
                          style={
                            {
                              // Fallback: if first row near top of viewport, still show below; otherwise above default branch covers rest
                            }
                          }
                        >
                          {val} view{val !== 1 && "s"}
                        </span>
                      )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Low</span>
        <div className="flex-1 h-2 bg-gradient-to-r from-indigo-50 to-indigo-800 rounded" />
        <span className="text-[10px] text-gray-500">High</span>
      </div>
    </div>
  );
}
