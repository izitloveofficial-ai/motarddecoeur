import { DoubleHeartIcon } from "@/components/icons/DoubleHeartIcon";

type SuperLikeRevealProps = {
  firstName: string;
  onClose: () => void;
};

export function SuperLikeReveal({ firstName, onClose }: SuperLikeRevealProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="super-like-reveal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm animate-in fade-in-0"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#e2b45f]/40 bg-[#302425] p-8 text-center shadow-[0_0_80px_rgba(226,180,95,0.22)] animate-in zoom-in-95 fade-in-0">
        <DoubleHeartIcon
          className="mx-auto mb-6 h-24 w-24 animate-pulse text-[#e2b45f]"
          aria-hidden="true"
        />
        <span className="text-xs uppercase tracking-[0.35em] text-[#e8be6c]">
          Super coup de cœur reçu
        </span>
        <h2 id="super-like-reveal-title" className="mt-3 font-display text-3xl sm:text-4xl">
          {firstName} a eu un Super coup de cœur pour toi !
        </h2>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-8 rounded-full bg-gradient-red px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
        >
          Découvrir l'application
        </button>
      </div>
    </div>
  );
}
