"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { relationshipPhoto } from "@/lib/gift/relationshipPhoto";

export function PhotoSlideshow({
  photos,
  relationship,
}: {
  photos: { id: string; imageUrl: string }[];
  relationship: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % photos.length), 4500);
    return () => clearInterval(t);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-base-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={relationshipPhoto(relationship)} alt="" className="h-full w-full object-cover grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-base-soft">
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.id}
          src={p.imageUrl}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
            i === active ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i === active ? "bg-accent" : "bg-ink/30")} />
          ))}
        </div>
      )}
    </div>
  );
}
