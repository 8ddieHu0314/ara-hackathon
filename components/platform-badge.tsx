import { PLATFORM_META } from "@/lib/platforms";
import type { Platform } from "@/lib/types";
import { PlatformIcon } from "./platform-icon";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-md text-white"
        style={{ background: meta.hex }}
      >
        <PlatformIcon platform={platform} size={12} />
      </span>
      {meta.label}
    </span>
  );
}
