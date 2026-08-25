import clsx from "clsx";
import type { Player } from "@/lib/types";
import { POSITIONS } from "@/lib/types";

export function PlayerAvatar({
  player,
  size = "md",
}: {
  player: Pick<Player, "name" | "photo_url">;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg";

  if (player.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={clsx(dim, "rounded-full object-cover ring-2 ring-white/20")}
      />
    );
  }

  return (
    <div
      className={clsx(
        dim,
        "flex items-center justify-center rounded-full bg-pitch font-display font-bold text-gold ring-2 ring-gold/30"
      )}
    >
      {player.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PositionBadge({ position }: { position: Player["position"] }) {
  const label = POSITIONS.find((p) => p.value === position)?.label ?? position;
  return <span className="badge-pos">{label}</span>;
}

export function EmptyPitch({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center border-dashed p-10 text-center">
      <span className="mb-3 text-5xl">⚽</span>
      <p className="mb-4 text-muted">{message}</p>
      {action}
    </div>
  );
}
