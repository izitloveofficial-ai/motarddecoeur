import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { requireAdminPage } from "@/lib/require-admin";
import { QUIZ_PROFILES, QUIZ_QUESTIONS } from "@/lib/love-quiz";

import { DATING_QUESTIONS, DATING_QUIZ_VERSION } from "@/lib/dating-quiz";

export const Route = createFileRoute("/admin/quiz")({ ssr: false, beforeLoad: requireAdminPage, component: AdminQuiz });
type Participation = { id: string; first_name: string; email: string; answers: number[]; result_profile: keyof typeof QUIZ_PROFILES | "bilan"; quiz_version: string; preinscribe: boolean; consented_at: string; consent_version: string; email_status: string; created_at: string };

function AdminQuiz() {
  const [rows, setRows] = useState<Participation[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [notice, setNotice] = useState("Chargement…");
  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) return setNotice("Service indisponible.");
      setNotice("Chargement…");
      const { data, error, count } = await supabase.from("love_quiz_participations")
        .select("id,first_name,email,answers,result_profile,quiz_version,preinscribe,consented_at,consent_version,email_status,created_at", { count: "exact" })
        .order("created_at", { ascending: false }).order("id").range(page * 100, page * 100 + 99);
      if (!alive) return;
      if (error) { setRows([]); setNotice("Impossible de charger les participations. Vérifiez votre connexion administrateur."); return; }
      setRows(data as Participation[]); setTotal(count ?? 0); setNotice(data.length ? "" : "Aucune participation enregistrée.");
    }
    void load(); return () => { alive = false; };
  }, [page]);
  function questionsFor(row: Participation) { return row.quiz_version === DATING_QUIZ_VERSION ? DATING_QUESTIONS : QUIZ_QUESTIONS; }
  function titleFor(row: Participation) { return row.result_profile === "bilan" ? "Bilan personnalisé de rencontre" : QUIZ_PROFILES[row.result_profile]?.title ?? row.result_profile; }
  function exportPage() {
    const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? "'" + v : v).replaceAll('"','""')}"`;
    const lines = [["Prénom","E-mail","Portrait","Préinscription demandée","E-mail résultat","Date","Accord","Version accord","Version quiz",...Array.from({length: 6}, (_,i) => [`Question ${i+1}`,`Réponse ${i+1}`]).flat()],
      ...rows.map(r => [r.first_name,r.email,titleFor(r),r.preinscribe ? "Oui" : "Non",r.email_status,r.created_at,r.consented_at,r.consent_version,r.quiz_version,...Array.from({length: 6}, (_,i) => [questionsFor(r)[i]?.title ?? "",questionsFor(r)[i]?.options[r.answers[i]]?.label ?? ""]).flat()])];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `participations-quiz-page-${page+1}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  return <main className="min-h-screen bg-background px-4 py-12 text-foreground"><div className="mx-auto max-w-7xl">
    <Link to="/admin/preinscriptions" className="text-primary underline">Préinscriptions</Link>
    <h1 className="mt-4 font-display text-4xl">Participations au quiz</h1>
    <p className="mt-3 text-base">{total} participation(s) enregistrée(s). Les réponses des personnes ayant choisi Non ne constituent pas un accord pour recevoir des actualités.</p>
    <p className="mt-2 text-base">Les bilans reprennent les choix déclarés. Les anciennes participations conservent les questions auxquelles elles ont répondu.</p>
    <button onClick={exportPage} disabled={!rows.length} className="my-5 min-h-12 rounded-xl bg-primary px-5 text-primary-foreground disabled:opacity-40">Exporter cette page en CSV</button>
    {notice && <p role="status" className="my-4">{notice}</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-base"><thead><tr>{["Participant","Portrait","Préinscription","E-mail résultat","Réponses","Date"].map(t => <th className="p-3" key={t}>{t}</th>)}</tr></thead><tbody>
      {rows.map(r => <tr className="border-t" key={r.id}><td className="p-3">{r.first_name}<br />{r.email}</td><td className="p-3">{titleFor(r)}</td><td className="p-3">{r.preinscribe ? "Oui" : "Non"}</td><td className="p-3">{{ sent: "Envoyé", failed: "Échec", pending: "En attente", sending: "En cours" }[r.email_status] ?? r.email_status}</td><td className="min-w-72 p-3"><ol className="list-decimal pl-5">{r.answers.map((a,i) => <li key={i}><strong>{questionsFor(r)[i]?.title}</strong><br />{questionsFor(r)[i]?.options[a]?.label}</li>)}</ol></td><td className="p-3">{new Date(r.created_at).toLocaleString("fr-FR")}</td></tr>)}
    </tbody></table></div>
    <div className="mt-6 flex items-center gap-5"><button className="min-h-12 rounded-xl border px-4 disabled:opacity-40" disabled={page===0} onClick={() => setPage(page-1)}>Précédente</button><span>Page {page+1}</span><button className="min-h-12 rounded-xl border px-4 disabled:opacity-40" disabled={(page+1)*100>=total} onClick={() => setPage(page+1)}>Suivante</button></div>
  </div></main>;
}
