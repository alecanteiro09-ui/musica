"use client";

import { Play, Pause } from "lucide-react";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  playing,
  currentTime,
  duration,
  onToggle,
  onSeek,
}: {
  playing: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (time: number) => void;
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-soft/80 p-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105 active:scale-95"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="mt-1 flex justify-between text-xs text-ink-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
