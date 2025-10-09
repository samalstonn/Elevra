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
      <div className="text-xs text-muted-foreground">
        Waiting for candidate...
      </div>
    );
  }

  if (loading)
    return (
      <div className="text-xs text-muted-foreground">
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
  // Compute effective max for coloring. On mobile we bucket hours, so the max value should
  // reflect the bucketed sums (which can exceed the per-hour max). On desktop keep original max.
  const colorMax = isMobile
    ? displayMatrix.reduce(
        (acc, row) =>
          row.reduce((innerAcc, v) => (v > innerAcc ? v : innerAcc), acc),
        0
      )
    : max;
  const hoursCount = isMobile ? Math.ceil(24 / HOUR_GROUP) : 24;
  const scaleColor = (value: number) => {
    if (colorMax === 0) return "rgba(148, 163, 184, 0.12)";
    const ratioRaw = value / colorMax;
    const ratio = Math.min(1, Math.max(0, ratioRaw)); // clamp 0..1
    const start = { r: 148, g: 163, b: 184 };
    const end = { r: 168, g: 85, b: 247 };
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    const alpha = 0.18 + ratio * 0.5;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
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
                  className="text-center text-[10px] text-muted-foreground"
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
                className="text-center text-[10px] text-muted-foreground"
                title={`${startHour12}:00 - ${endHour12}:59`}
              >
                {label}
              </div>
            );
          })}
          {displayMatrix.map((row, day) => (
            <React.Fragment key={day}>
              <div className="text-[11px] font-medium text-muted-foreground flex items-center">
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
                    className="relative h-5 w-full rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-purple-400/60"
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
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div className="flex-1 h-2 bg-gradient-to-r from-purple-200/60 via-purple-500/60 to-purple-900/60 dark:from-purple-900/40 dark:via-purple-600/60 dark:to-purple-400/80 rounded" />
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
}
