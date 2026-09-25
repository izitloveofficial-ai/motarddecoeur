import { ChevronLeft, ChevronRight, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GALLERY_HISTORY_STATE_KEY = "__profilePhotoGallery";

export type GalleryProfile = {
  firstName: string;
  bio?: string | null;
  motoBrand?: string | null;
  motoModel?: string | null;
  prompts?: { question: string; answer: string }[];
};

type ProfilePhotoGalleryProps = {
  open: boolean;
  onClose: () => void;
  photos: string[];
  profile: GalleryProfile;
  initialIndex?: number;
};

export function ProfilePhotoGallery({
  open,
  onClose,
  photos,
  profile,
  initialIndex = 0,
}: ProfilePhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const start = Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0));
    setActiveIndex(start);
    const frame = requestAnimationFrame(() => {
      const carousel = carouselRef.current;
      if (carousel) carousel.scrollLeft = start * carousel.clientWidth;
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const entryId = `${Date.now()}-${Math.random()}`;
    const currentState = window.history.state;
    const galleryState =
      currentState && typeof currentState === "object"
        ? { ...currentState, [GALLERY_HISTORY_STATE_KEY]: entryId }
        : { [GALLERY_HISTORY_STATE_KEY]: entryId };
    let entryIsActive = true;

    window.history.pushState(galleryState, "");

    const closeOnBack = () => {
      entryIsActive = false;
      onClose();
    };

    window.addEventListener("popstate", closeOnBack);

    return () => {
      window.removeEventListener("popstate", closeOnBack);

      if (entryIsActive && window.history.state?.[GALLERY_HISTORY_STATE_KEY] === entryId) {
        entryIsActive = false;
        window.history.back();
      }
    };
  }, [onClose, open]);

  if (!open) return null;

  function goTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), photos.length - 1);
    setActiveIndex(nextIndex);
    carouselRef.current?.scrollTo({
      left: nextIndex * carouselRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  const bike = [profile.motoBrand, profile.motoModel].filter(Boolean).join(" ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos de ${profile.firstName}`}
      className="fixed inset-0 z-50 flex bg-[#21191a] text-[#fff9f0]"
    >
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <header className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#e8be6c]">Profil</p>
            <h2 className="font-display text-2xl">{profile.firstName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la galerie"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#302526] shadow-sm transition hover:border-[#d6a85c]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 border border-[#d6a85c]/20 bg-[#302425] sm:mx-6 sm:overflow-hidden sm:rounded-3xl">
          {photos.length > 0 ? (
            <>
              <div
                ref={carouselRef}
                onScroll={(event) => {
                  const width = event.currentTarget.clientWidth;
                  if (width) setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
                }}
                className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {photos.map((photo, index) => (
                  <div key={photo} className="h-full w-full shrink-0 snap-center">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1} de ${profile.firstName}`}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#302526]/90 text-[#fff9f0] shadow-md disabled:opacity-30 sm:flex"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex + 1)}
                    disabled={activeIndex === photos.length - 1}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#302526]/90 text-[#fff9f0] shadow-md disabled:opacity-30 sm:flex"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div
                    className="absolute inset-x-0 bottom-4 flex justify-center gap-2"
                    aria-label={`${activeIndex + 1} sur ${photos.length}`}
                  >
                    {photos.map((photo, index) => (
                      <button
                        key={photo}
                        type="button"
                        onClick={() => goTo(index)}
                        aria-label={`Afficher la photo ${index + 1}`}
                        className={`h-2.5 rounded-full shadow-sm transition-all ${index === activeIndex ? "w-7 bg-[#d29b3d]" : "w-2.5 bg-white/80"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-[#a99b95]">
              <UserRound className="h-16 w-16" />
              <p>Aucune photo disponible</p>
            </div>
          )}
        </div>

        {(profile.bio || bike || profile.prompts?.length) && (
          <div className="max-h-[40vh] shrink-0 space-y-3 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
            {bike && <p className="font-medium text-[#e8be6c]">{bike}</p>}
            {profile.bio && <p className="text-sm leading-relaxed text-[#d4c6bf]">{profile.bio}</p>}
            {profile.prompts?.map((prompt) => (
              <div key={prompt.question} className="text-sm leading-relaxed text-[#d4c6bf]">
                <p className="font-semibold text-[#fff9f0]">{prompt.question}</p>
                <p>{prompt.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
