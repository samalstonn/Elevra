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

  useEffect(() => {
    if (candidateId == null || Number.isNaN(candidateId)) {
      return; // guard against undefined causing 400
    }
    setLoading(true);
    setError(null);
    // debug
    // eslint-disable-next-line no-console
    console.debug("Fetching heatmap", { candidateId, days });
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
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: "40px repeat(24, 1fr)" }}
        >
          <div></div>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-center text-[10px] text-gray-500">
              {h}
            </div>
          ))}
          {matrix.map((row, day) => (
            <React.Fragment key={day}>
              <div className="text-[11px] font-medium text-gray-600 flex items-center">
                {dayLabels[day]}
              </div>
              {row.map((val, hour) => {
                const color = scaleColor(val);
                return (
                  <button
                    key={hour}
                    onMouseEnter={() => setHover({ day, hour, value: val })}
                    onMouseLeave={() => setHover(null)}
                    className="relative h-5 w-full rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500"
                    style={{ backgroundColor: color }}
                    aria-label={`${val} views on ${dayLabels[day]} at ${hour}:00`}
                  >
                    {hover &&
                      hover.day === day &&
                      hover.hour === hour &&
                      val > 0 && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white shadow">
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
