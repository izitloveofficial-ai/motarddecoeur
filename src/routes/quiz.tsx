import { createFileRoute } from "@tanstack/react-router";
import { PrelaunchLayout } from "@/components/PrelaunchLayout";
import { LoveQuiz } from "@/components/LoveQuiz";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quel est votre profil amoureux à moto ? — Motards de Cœur" },
      {
        name: "description",
        content:
          "Cinq questions pour découvrir votre profil amoureux à moto. Un quiz gratuit, sans inscription, à partager avec vos amis.",
      },
      { property: "og:title", content: "Quel est votre profil amoureux à moto ?" },
      {
        property: "og:description",
        content:
          "Aventure, complicité ou escapades gourmandes ? Découvrez votre résultat en cinq questions, sans inscription.",
      },
      { property: "og:url", content: `${SITE_URL}/quiz` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/quiz` }],
  }),
  component: () => (
    <PrelaunchLayout>
      <LoveQuiz />
    </PrelaunchLayout>
  ),
});
