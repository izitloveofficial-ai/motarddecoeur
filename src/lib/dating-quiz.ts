export const DATING_QUIZ_VERSION = "2026-11-25-v2";
export const DATING_QUIZ_CONSENT_VERSION = "quiz-2026-11-25-v2";

// Each answer has its own wording. No personality score or inferred compatibility.
export const DATING_QUESTIONS = [
  {
    title: "Aujourd’hui, qu’aimerais-tu trouver sur un site de rencontre ?",
    topic: "Ce que tu recherches",
    options: [
      { label: "Une relation sérieuse.", summary: "Tu recherches une relation sérieuse, avec la possibilité de construire quelque chose ensemble." },
      { label: "Une rencontre sans pression, pour voir où elle mène.", summary: "Tu aimerais faire une rencontre sans pression et laisser le lien évoluer au fil des échanges." },
      { label: "Je ne sais pas encore, je fonctionne au feeling.", summary: "Tu n’as pas encore défini la relation que tu recherches. Tu préfères te laisser guider par le feeling." },
    ],
  },
  {
    title: "Sur un profil, qu’est-ce qui te donne envie d’envoyer un message ?",
    topic: "Ce qui attire ton attention",
    options: [
      { label: "Le physique et le sourire.", summary: "Le physique et le sourire attirent d’abord ton attention et te donnent envie d’entamer la conversation." },
      { label: "Une présentation qui me fait rire ou m’intrigue.", summary: "Une présentation drôle ou intrigante te donne envie d’en savoir plus sur la personne." },
      { label: "Des envies et des valeurs qui me correspondent.", summary: "Tu t’intéresses aux profils dans lesquels tu retrouves des envies ou des valeurs proches des tiennes." },
    ],
  },
  {
    title: "Quand quelqu’un te plaît, tu préfères…",
    topic: "Le premier pas",
    options: [
      { label: "Faire le premier pas.", summary: "Quand quelqu’un te plaît, tu préfères prendre l’initiative du premier message.", advice: "Pour ouvrir la conversation, appuie-toi sur un détail de son profil et pose une question qui te donne vraiment envie de connaître la réponse." },
      { label: "Recevoir un premier message.", summary: "Tu préfères recevoir un premier message avant de te lancer dans la conversation.", advice: "Pour faciliter un premier échange, ajoute à ta présentation un détail personnel auquel on peut répondre, comme une passion ou une envie de sortie." },
      { label: "Peu importe qui commence, tant que l’intérêt est réciproque.", summary: "L’initiative compte moins pour toi que le sentiment d’un intérêt réciproque.", advice: "Dans les premiers échanges, regarde si la personne pose aussi des questions et laisse de la place à ce que tu racontes." },
    ],
  },
  {
    title: "Après quelques échanges qui se passent bien, tu as envie de…",
    topic: "Ton rythme pour faire connaissance",
    options: [
      { label: "Proposer un rendez-vous.", summary: "Après quelques échanges agréables, tu as envie de proposer une rencontre en personne.", advice: "Si l’envie est partagée, propose un premier rendez-vous simple dans un lieu public où vous pourrez discuter." },
      { label: "S’appeler pour entendre sa voix.", summary: "Tu aimerais entendre sa voix lors d’un appel avant de décider d’un rendez-vous.", advice: "Propose un court appel à un moment qui vous convient à tous les deux, puis voyez si vous avez envie de vous rencontrer." },
      { label: "Continuer à discuter avant de se rencontrer.", summary: "Tu préfères poursuivre la conversation avant de décider de rencontrer la personne.", advice: "Dis simplement que tu souhaites prendre un peu de temps pour discuter, tout en restant à l’écoute du rythme de l’autre." },
    ],
  },
  {
    title: "Qu’est-ce qui te donne envie de revoir quelqu’un ?",
    topic: "Ce qui te donne envie de continuer",
    options: [
      { label: "Une attirance qui se confirme en vrai.", summary: "Une attirance qui se confirme lors du rendez-vous te donne envie de revoir la personne.", advice: "Après le rendez-vous, demande-toi si tu as envie de retrouver cette personne en particulier, au-delà de la première impression sur son profil." },
      { label: "Le sentiment de pouvoir être moi-même.", summary: "Tu as envie de revoir quelqu’un quand tu te sens libre d’être toi-même en sa présence.", advice: "Observe si tu peux exprimer tes goûts et tes envies sans te sentir obligé de jouer un rôle." },
      { label: "Une conversation que je n’avais pas envie de terminer.", summary: "Une conversation que tu n’avais pas envie de terminer te donne envie de prolonger la rencontre.", advice: "Pour reprendre contact, fais référence à un sujet que vous aviez plaisir à aborder et propose de poursuivre la conversation." },
    ],
  },
  {
    title: "Dans une relation, qu’aimerais-tu vivre en priorité ?",
    topic: "Ce que tu aimerais partager",
    options: [
      { label: "De la tendresse et une présence au quotidien.", summary: "Tu aimerais partager de la tendresse et sentir une présence dans les petits moments du quotidien." },
      { label: "Une relation passionnée, avec du désir.", summary: "Tu aimerais vivre une relation passionnée, dans laquelle le désir a sa place." },
      { label: "Un engagement et des projets à deux.", summary: "Tu aimerais une relation dans laquelle chacun souhaite s’engager et construire des projets à deux." },
    ],
  },
] as const;

export function validDatingAnswers(answers: readonly number[]): boolean {
  return answers.length === DATING_QUESTIONS.length && answers.every(
    (answer, i) => Number.isInteger(answer) && answer >= 0 && answer < DATING_QUESTIONS[i].options.length,
  );
}

export function buildDatingReport(answers: readonly number[]) {
  if (!validDatingAnswers(answers)) return null;
  const sections = DATING_QUESTIONS.map((question, i) => ({
    title: question.topic,
    question: question.title,
    answer: question.options[answers[i]].label,
    text: question.options[answers[i]].summary,
  }));
  const advice = [2, 3, 4].map(i => {
    const option = DATING_QUESTIONS[i].options[answers[i]];
    return "advice" in option ? option.advice : "";
  });
  const nuance = answers[0] === 0 && answers[5] === 1
    ? "Chercher une relation sérieuse et souhaiter de la passion peuvent aller ensemble. L’important sera de parler de vos attentes respectives."
    : answers[0] !== 0 && answers[5] === 2
      ? "Tu souhaites laisser la rencontre évoluer, tout en gardant l’envie de projets à deux. Tu peux exprimer les deux sans promettre un engagement immédiat."
      : null;
  return { title: "Ton bilan de rencontre", sections, advice, nuance };
}

export function buildDatingEmail(firstName: string, answers: readonly number[], preinscribe: boolean) {
  const report = buildDatingReport(answers);
  if (!report) return null;
  const ending = preinscribe
    ? "Tu as également demandé ta préinscription gratuite à Motards de Cœur pour être informé de l’ouverture. Si ton adresse est déjà connue, son statut est conservé. Aucune carte bancaire n’est demandée et aucun compte membre n’a été créé."
    : "Tu n’as pas demandé de préinscription. Cet envoi ne t’abonne à aucune actualité. Si tu changes d’avis, la préinscription gratuite reste accessible sur https://motardsdecoeur.com/join, sans carte bancaire.";
  const blocks = [
    `Bonjour ${firstName},`,
    "Voici ton bilan, construit à partir des six réponses que tu as choisies.",
    ...report.sections.map(s => `${s.title}\n${s.text}`),
    ...(report.nuance ? [report.nuance] : []),
    "Quelques pistes pour faire connaissance\n" + report.advice.join("\n\n"),
    "Tes réponses\n" + report.sections.map(s => `${s.question}\n${s.answer}`).join("\n\n"),
    ending,
    "Ce bilan reprend tes envies déclarées. Il ne prédit pas ta personnalité, ne calcule pas de compatibilité et ne signifie pas qu’une personne correspondant à tes attentes est déjà disponible.",
    "Motards de Cœur prépare un site de rencontre pour motards et motardes.\nhttps://motardsdecoeur.com",
    "Une question ou une demande de suppression de tes données ? Réponds à ce mail ou écris à contact@motardsdecoeur.com.",
  ];
  const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  return {
    subject: "Ton bilan personnalisé | Motards de Cœur",
    text: blocks.join("\n\n"),
    html: `<html lang="fr"><body style="margin:0;background:#21191a;color:#fff9f0;font-family:Arial,sans-serif;padding:24px"><div style="max-width:580px;margin:auto"><img src="https://motardsdecoeur.com/logo-motards-de-coeur-hd.png" width="100" alt="Motards de Cœur"><h1 style="color:#efbf87;font-size:28px">${escape(report.title)}</h1>${blocks.map(p => `<p style="font-size:16px;line-height:1.65">${escape(p).replaceAll("\n", "<br>")}</p>`).join("")}</div></body></html>`,
  };
}
