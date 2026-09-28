import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { ScrollScene } from "./scroll";

/**
 * A photograph that behaves like film: it is uncovered by a slow wipe the first
 * time it is seen, drifts against the scroll (parallax), and settles from a
 * slight push-in. All motion is transform/clip-path only and is removed under
 * reduced motion; without JavaScript the image is simply shown.
 */
export function CinematicImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className,
  imageClassName,
  parallax = 10,
  wipe = true,
  position,
  style,
  fill = false,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Parallax travel, in percent of the frame height. 0 disables it. */
  parallax?: number;
  wipe?: boolean;
  /** CSS object-position, e.g. "70% 50%". */
  position?: string;
  style?: CSSProperties;
  /** Fill the nearest positioned ancestor instead of sizing itself. */
  fill?: boolean;
}) {
  return (
    <ScrollScene
      className={cn(
        "cinematic-frame overflow-hidden bg-ink-900",
        fill ? "absolute inset-0" : "relative",
        className,
      )}
      data-wipe={wipe || undefined}
      style={{ ...style, ["--parallax" as string]: `${parallax}%` }}
    >
      <div className="cinematic-layer absolute inset-x-0" aria-hidden={alt ? undefined : true}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
          style={position ? { objectPosition: position } : undefined}
        />
      </div>
    </ScrollScene>
  );
}
