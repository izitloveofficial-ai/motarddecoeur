export type QuizProfile = "aventure" | "complicite" | "epicurien";
export const QUIZ_PROFILES = {
  aventure: {
    title: "L’aventurier romantique",
    emoji: "🌄",
    description:
      "Une petite route inconnue, un détour imprévu et quelqu’un avec qui s’émerveiller : pour vous, la complicité se découvre au fil des kilomètres.",
    date: "Votre idée de rendez-vous : une balade choisie à deux, avec une pause devant un beau panorama.",
  },
  complicite: {
    title: "Le complice des petites routes",
    emoji: "🏍️",
    description:
      "Ce qui compte, c’est de se sentir bien ensemble. Un sourire sous le casque, une conversation qui dure, un rythme partagé : vous aimez les liens qui prennent leur temps.",
    date: "Votre idée de rendez-vous : une courte balade et une longue pause pour faire connaissance.",
  },
  epicurien: {
    title: "L’épicurien à deux",
    emoji: "☀️",
    description:
      "Le plaisir de la route continue une fois la moto garée. Un village à découvrir, une bonne table et des rires : vous aimez savourer chaque moment à deux.",
    date: "Votre idée de rendez-vous : découvrir un village et prolonger la rencontre en terrasse.",
  },
} as const;
export const QUIZ_QUESTIONS = [
  {
    title: "Votre balade idéale à deux ?",
    emoji: "🛣️",
    options: [
      { label: "Un nouvel itinéraire, au gré des envies", profile: "aventure" },
      { label: "Des petites routes pour profiter ensemble", profile: "complicite" },
      { label: "Une jolie destination et une bonne table", profile: "epicurien" },
    ],
  },
  {
    title: "Pour un premier rendez-vous, vous choisissez…",
    emoji: "❤️",
    options: [
      { label: "Un verre pour apprendre à se connaître", profile: "complicite" },
      { label: "Une terrasse dans un village de charme", profile: "epicurien" },
      { label: "Une petite balade vers un beau panorama", profile: "aventure" },
    ],
  },
  {
    title: "Votre première escapade ensemble ?",
    emoji: "🧭",
    options: [
      { label: "La mer et ses haltes gourmandes", profile: "epicurien" },
      { label: "La montagne et ses paysages à découvrir", profile: "aventure" },
      { label: "Peu importe le lieu, pourvu qu’on soit bien à deux", profile: "complicite" },
    ],
  },
  {
    title: "Ce qui vous fait craquer ?",
    emoji: "✨",
    options: [
      { label: "L’envie d’oser de nouvelles aventures", profile: "aventure" },
      { label: "Un humour qui rend chaque moment plus léger", profile: "epicurien" },
      { label: "L’attention et un sourire sincère", profile: "complicite" },
    ],
  },
  {
    title: "À la fin du rendez-vous, votre plus belle envie ?",
    emoji: "💬",
    options: [
      { label: "Continuer la conversation, encore un peu", profile: "complicite" },
      { label: "Choisir ensemble notre prochaine escapade", profile: "aventure" },
      { label: "Trouver une nouvelle adresse à découvrir à deux", profile: "epicurien" },
    ],
  },
] as const;

/** Five answers only. On a tie, the latest answer among the tied profiles wins. */
export function getQuizResult(answers: readonly number[]): QuizProfile | null {
  if (answers.length !== QUIZ_QUESTIONS.length) return null;
  const scores: Record<QuizProfile, number> = { aventure: 0, complicite: 0, epicurien: 0 };
  const choices: QuizProfile[] = [];
  for (let i = 0; i < answers.length; i++) {
    const index = answers[i];
    if (!Number.isInteger(index) || index < 0 || index >= QUIZ_QUESTIONS[i].options.length)
      return null;
    const profile = QUIZ_QUESTIONS[i].options[index].profile;
    scores[profile]++;
    choices.push(profile);
  }
  const max = Math.max(...Object.values(scores));
  return choices.reverse().find((profile) => scores[profile] === max) ?? null;
}
