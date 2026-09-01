import Image from "next/image";

export default function SponsoredBanner() {
  return (
    <a
      href="https://gymgame.net"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-10 flex items-center gap-4 rounded-card border border-line px-5 py-4 transition-colors hover:border-foreground/25"
    >
      <Image
        src="/gymgame-icon.png"
        alt="GymGame"
        width={40}
        height={40}
        className="shrink-0 rounded-lg object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="micro-label !text-[10px]">Anúncio</p>
        <p className="truncate text-sm font-medium text-foreground/80">
          Transforme seu treino em jogo — conheça o GymGame
        </p>
      </div>
      <span className="micro-label !text-[10px] shrink-0 text-foreground/40">gymgame.net ↘</span>
    </a>
  );
}
