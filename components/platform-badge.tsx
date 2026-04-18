import { PLATFORM_META } from "@/lib/platforms";
import type { Platform } from "@/lib/types";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: meta.hex }}
      />
      {meta.label}
    </span>
  );
}
