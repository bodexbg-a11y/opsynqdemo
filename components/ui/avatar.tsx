import { cn, initials } from "@/lib/utils";

const PALETTE = [
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-blue-700",
  "from-sky-400 to-blue-600",
  "from-blue-500 to-navy-700",
  "from-cyan-400 to-blue-600",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const palette = PALETTE[hash(name) % PALETTE.length];
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white",
        palette,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((n) => (
        <Avatar key={n} name={n} size={26} />
      ))}
      {rest > 0 && (
        <div className="rounded-full bg-ink-100 text-ink-500 flex items-center justify-center text-[10px] font-semibold ring-2 ring-white w-[26px] h-[26px]">
          +{rest}
        </div>
      )}
    </div>
  );
}
