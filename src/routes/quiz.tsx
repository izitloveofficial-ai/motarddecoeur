import { createFileRoute } from "@tanstack/react-router";
import { PrelaunchLayout } from "@/components/PrelaunchLayout";
import { LoveQuiz } from "@/components/LoveQuiz";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Qu’as-tu envie de vivre à deux ? | Motards de Cœur" },
      {
        name: "description",
        content:
          "Six questions sur tes attentes, l’attirance et les rencontres. Ton bilan personnalisé est gratuit, avec envoi par e-mail facultatif.",
      },
      { property: "og:title", content: "Qu’as-tu envie de vivre à deux ?" },
      {
        property: "og:description",
        content:
          "Découvre ce que tu recherches dans une rencontre avec un bilan construit à partir de tes six réponses.",
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
