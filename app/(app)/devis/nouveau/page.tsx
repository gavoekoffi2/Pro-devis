"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/calc";

type WorkInput = { key: string; label: string; unit?: string; default?: number };
type WorkType = { id: string; key: string; name: string; inputs: WorkInput[] };
type Trade = { id: string; key: string; name: string; icon: string; workTypes: WorkType[] };
type Line = {
  designation: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  kind: "MATERIAL" | "LABOR" | "TRANSPORT" | "OTHER";
  section?: string;
};
type Poste = {
  id: string;
  label: string;
  tradeKey?: string;
  workTypeId?: string;
  lines: Line[];
};

type View =
  | "client"
  | "postes"
  | "ai"
  | "pickTrade"
  | "pickWork"
  | "measure"
  | "freeLine"
  | "finalize";

/**
 * Identifiant local d'un poste.
 *
 * `crypto.randomUUID()` n'existe que dans un contexte sécurisé : sur une
 * page servie en HTTP (test depuis un téléphone sur le réseau local) il vaut
 * `undefined` et l'ajout d'un poste plantait.
 */
function localId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type SavedClient = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
};

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-slate-500">Chargement…</div>}
    >
      <NewQuoteWizard />
    </Suspense>
  );
}

function NewQuoteWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("client");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [client, setClient] = useState({
    clientId: "",
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    siteAddress: "",
    projectDescription: "",
    saveClient: true,
  });

  function pickSavedClient(id: string, list?: SavedClient[]) {
    const found = (list ?? savedClients).find((c) => c.id === id);
    setClient((cl) => ({
      ...cl,
      clientId: found ? found.id : "",
      clientName: found?.name ?? cl.clientName,
      clientPhone: found?.phone ?? cl.clientPhone,
      clientAddress: found?.address ?? cl.clientAddress,
      saveClient: found ? false : cl.saveClient,
    }));
  }

  const [postes, setPostes] = useState<Poste[]>([]);

  // sous-flux "ajout poste calculé"
  const [trade, setTrade] = useState<Trade | null>(null);
  const [work, setWork] = useState<WorkType | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [computing, setComputing] = useState(false);

  // ligne libre
  const [free, setFree] = useState<Line>({
    designation: "",
    unit: "forfait",
    quantity: 1,
    unitPrice: 0,
    total: 0,
    kind: "OTHER",
  });

  // finalisation
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  // Assistant IA
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d.trades)) throw new Error("bad payload");
        setTrades(d.trades);
      })
      .catch(() =>
        setError(
          "Impossible de charger les métiers. Vérifiez votre connexion puis rechargez la page."
        )
      )
      .finally(() => setLoading(false));
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setAiAvailable(!!d.enabled))
      .catch(() => {});
    // Clients enregistrés : sélection rapide + pré-remplissage via ?client=
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => {
        const list: SavedClient[] = d.clients || [];
        setSavedClients(list);
        const preselect = searchParams.get("client");
        if (preselect) pickSavedClient(preselect, list);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateWithAI() {
    if (aiText.trim().length < 5) return;
    setAiBusy(true);
    setAiError("");
    let d: { lines?: Line[]; error?: string } = {};
    try {
      const res = await fetch("/api/ai/draft-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiText }),
      });
      d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiError(d.error || "Génération impossible.");
        return;
      }
    } catch {
      setAiError("Génération impossible. Vérifiez votre connexion.");
      return;
    } finally {
      setAiBusy(false);
    }
    if (!Array.isArray(d.lines) || d.lines.length === 0) {
      setAiError("L'IA n'a proposé aucune ligne. Reformulez la description.");
      return;
    }
    // Regroupe les lignes IA par poste (section)
    const bySection = new Map<string, Line[]>();
    for (const l of d.lines) {
      const sec = l.section || "Devis";
      const line: Line = { ...l, total: Math.round(l.quantity * l.unitPrice), section: sec };
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec)!.push(line);
    }
    const newPostes: Poste[] = Array.from(bySection.entries()).map(([label, lines]) => ({
      id: localId(),
      label,
      lines,
    }));
    setPostes((ps) => [...ps, ...newPostes]);
    setAiText("");
    setView("postes");
  }

  const allLines = postes.flatMap((p) => p.lines);
  const totals = computeTotals(allLines, discount, taxRate);

  function pickTrade(t: Trade) {
    setTrade(t);
    setWork(null);
    setView("pickWork");
  }
  function pickWork(w: WorkType) {
    setWork(w);
    const init: Record<string, number> = {};
    for (const inp of w.inputs) init[inp.key] = inp.default ?? 0;
    setValues(init);
    setView("measure");
  }

  async function computePoste() {
    if (!work || !trade) return;
    setComputing(true);
    setError("");
    let d: { lines?: Line[]; error?: string } = {};
    try {
      const res = await fetch("/api/quotes/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workTypeKey: work.key, values }),
      });
      d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Calcul impossible.");
        return;
      }
    } catch {
      setError("Calcul impossible. Vérifiez votre connexion.");
      return;
    } finally {
      setComputing(false);
    }
    if (!Array.isArray(d.lines) || d.lines.length === 0) {
      // Recette sans matériau correspondant, ou toutes les dimensions à zéro.
      setError(
        "Aucune ligne calculée : vérifiez les dimensions saisies (elles doivent être supérieures à zéro)."
      );
      return;
    }
    const lines: Line[] = d.lines.map((l) => ({ ...l, section: work.name }));
    setPostes((ps) => [
      ...ps,
      { id: localId(), label: work.name, tradeKey: trade.key, workTypeId: work.id, lines },
    ]);
    setView("postes");
  }

  function addFreeLine() {
    if (!free.designation || free.unitPrice < 0) return;
    const line: Line = {
      ...free,
      total: Math.round(free.quantity * free.unitPrice),
      section: "Divers",
    };
    setPostes((ps) => {
      const existing = ps.find((p) => p.label === "Divers");
      if (existing) {
        return ps.map((p) =>
          p.id === existing.id ? { ...p, lines: [...p.lines, line] } : p
        );
      }
      return [...ps, { id: localId(), label: "Divers", lines: [line] }];
    });
    setFree({ designation: "", unit: "forfait", quantity: 1, unitPrice: 0, total: 0, kind: "OTHER" });
    setView("postes");
  }

  function removePoste(id: string) {
    setPostes((ps) => ps.filter((p) => p.id !== id));
  }

  async function save() {
    setSaving(true);
    setError("");
    const lines = postes.flatMap((p) =>
      p.lines.map((l) => ({ ...l, section: l.section || p.label }))
    );
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...client,
          tradeKey: postes[0]?.tradeKey,
          workLabel:
            postes.length === 1 ? postes[0].label : `${postes.length} postes`,
          workTypeId: postes.find((p) => p.workTypeId)?.workTypeId,
          lines,
          discount,
          taxRate,
          specialInstructions,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || "Enregistrement impossible.");
        return;
      }
      router.push(`/devis/${d.id}/apercu`);
    } catch {
      setError("Enregistrement impossible. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement…</div>;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">{error}</div>
      )}

      {/* ÉTAPE CLIENT */}
      {view === "client" && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">1. Informations du client</h2>
          {savedClients.length > 0 && (
            <div>
              <label className="label">Client existant (optionnel)</label>
              <select
                className="input"
                value={client.clientId}
                onChange={(e) => pickSavedClient(e.target.value)}
              >
                <option value="">— Nouveau client —</option>
                {savedClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Nom du client *</label>
            <input
              className="input"
              value={client.clientName}
              onChange={(e) =>
                // Modifier le nom = repartir sur un nouveau client.
                setClient({ ...client, clientName: e.target.value, clientId: "" })
              }
              placeholder="M. Adjo Komlan"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone / WhatsApp</label>
              <input
                className="input"
                value={client.clientPhone}
                onChange={(e) => setClient({ ...client, clientPhone: e.target.value })}
                placeholder="+228 …"
              />
            </div>
            <div>
              <label className="label">Adresse du chantier</label>
              <input
                className="input"
                value={client.siteAddress}
                onChange={(e) => setClient({ ...client, siteAddress: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Description du projet</label>
            <textarea
              className="input"
              rows={2}
              value={client.projectDescription}
              onChange={(e) => setClient({ ...client, projectDescription: e.target.value })}
              placeholder="Construction d'une maison, rénovation…"
            />
          </div>
          {!client.clientId && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={client.saveClient}
                onChange={(e) =>
                  setClient({ ...client, saveClient: e.target.checked })
                }
              />
              Enregistrer ce client
            </label>
          )}
          <button
            className="btn-primary w-full"
            disabled={!client.clientName}
            onClick={() => setView("postes")}
          >
            Continuer
          </button>
        </div>
      )}

      {/* LISTE DES POSTES */}
      {view === "postes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">2. Postes du devis</h2>
            <span className="text-sm text-slate-500">{client.clientName}</span>
          </div>

          {postes.length === 0 ? (
            <div className="card p-6 text-center text-slate-500">
              Ajoutez un ou plusieurs postes à votre devis (ex : mur, porte,
              peinture…).
            </div>
          ) : (
            <div className="space-y-3">
              {postes.map((p) => {
                const t = p.lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPrice), 0);
                return (
                  <div key={p.id} className="card p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold">{p.label}</div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{formatMoney(t, "")}</span>
                        <button
                          onClick={() => removePoste(p.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {p.lines.length} ligne(s)
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {aiAvailable && (
            <button
              className="btn-primary w-full"
              onClick={() => setView("ai")}
            >
              ✨ Assistant IA — décrire le chantier
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost" onClick={() => setView("pickTrade")}>
              ➕ Poste calculé
            </button>
            <button className="btn-ghost" onClick={() => setView("freeLine")}>
              ✏️ Ligne libre
            </button>
          </div>

          {postes.length > 0 && (
            <div className="card p-4 flex items-center justify-between">
              <span className="text-slate-600">Total estimé</span>
              <span className="text-xl font-extrabold">
                {formatMoney(totals.total)}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setView("client")}>
              ← Client
            </button>
            <button
              className="btn-primary flex-1"
              disabled={postes.length === 0}
              onClick={() => setView("finalize")}
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ASSISTANT IA */}
      {view === "ai" && (
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">✨ Assistant IA</h2>
            <p className="text-sm text-slate-500">
              Décrivez le chantier en quelques phrases. L'IA propose les postes,
              quantités et prix — vous pourrez tout vérifier et corriger ensuite.
            </p>
          </div>
          {aiError && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
              {aiError}
            </div>
          )}
          <textarea
            className="input"
            rows={5}
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Ex : Construire un mur de clôture de 25 m de long et 2,2 m de haut en parpaings, avec une porte métallique de 3 m, et peindre le mur côté rue."
          />
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setView("postes")}>
              ← Retour
            </button>
            <button
              className="btn-primary flex-1"
              onClick={generateWithAI}
              disabled={aiBusy || aiText.trim().length < 5}
            >
              {aiBusy ? "Génération en cours…" : "Générer le devis"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            ⚠️ Les prix proposés sont des estimations. Vérifiez-les toujours avant
            d'envoyer le devis.
          </p>
        </div>
      )}

      {/* CHOIX MÉTIER */}
      {view === "pickTrade" && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">Choisissez le métier</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {trades.map((t) => (
              <button
                key={t.id}
                onClick={() => pickTrade(t)}
                className="rounded-2xl border border-slate-200 p-4 text-center hover:border-brand-400 hover:bg-brand-50"
              >
                <div className="text-3xl">{t.icon}</div>
                <div className="mt-2 font-medium text-sm">{t.name}</div>
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setView("postes")}>
            ← Retour
          </button>
        </div>
      )}

      {/* CHOIX TYPE DE TRAVAIL */}
      {view === "pickWork" && trade && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">{trade.icon} Type de travail</h2>
          <div className="grid gap-3">
            {trade.workTypes.map((w) => (
              <button
                key={w.id}
                onClick={() => pickWork(w)}
                className="rounded-xl border border-slate-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50"
              >
                <div className="font-medium">{w.name}</div>
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => setView("pickTrade")}>
            ← Changer de métier
          </button>
        </div>
      )}

      {/* MESURES */}
      {view === "measure" && work && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">{work.name}</h2>
          <p className="text-sm text-slate-500">Entrez les dimensions / quantités.</p>
          <div className="grid grid-cols-2 gap-3">
            {work.inputs.map((inp) => (
              <div key={inp.key}>
                <label className="label">
                  {inp.label}
                  {inp.unit ? ` (${inp.unit})` : ""}
                </label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={values[inp.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [inp.key]: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setView("pickWork")}>
              ← Retour
            </button>
            <button className="btn-primary flex-1" onClick={computePoste} disabled={computing}>
              {computing ? "Calcul…" : "✓ Ajouter ce poste"}
            </button>
          </div>
        </div>
      )}

      {/* LIGNE LIBRE */}
      {view === "freeLine" && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">Ligne libre</h2>
          <div>
            <label className="label">Désignation</label>
            <input
              className="input"
              value={free.designation}
              onChange={(e) => setFree({ ...free, designation: e.target.value })}
              placeholder="Ex : Évacuation des gravats"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantité</label>
              <input
                type="number"
                step="any"
                className="input"
                value={free.quantity}
                onChange={(e) => setFree({ ...free, quantity: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label">Unité</label>
              <input
                className="input"
                value={free.unit}
                onChange={(e) => setFree({ ...free, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Prix unitaire</label>
              <input
                type="number"
                step="any"
                className="input"
                value={free.unitPrice}
                onChange={(e) => setFree({ ...free, unitPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={free.kind}
              onChange={(e) => setFree({ ...free, kind: e.target.value as Line["kind"] })}
            >
              <option value="MATERIAL">Matériau</option>
              <option value="LABOR">Main-d'œuvre</option>
              <option value="TRANSPORT">Transport</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setView("postes")}>
              ← Retour
            </button>
            <button
              className="btn-primary flex-1"
              onClick={addFreeLine}
              disabled={!free.designation}
            >
              ✓ Ajouter
            </button>
          </div>
        </div>
      )}

      {/* FINALISATION */}
      {view === "finalize" && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold">
              Récapitulatif ({allLines.length} lignes)
            </div>
            <div className="divide-y divide-slate-100">
              {postes.map((p) => (
                <div key={p.id} className="px-5 py-3">
                  <div className="text-sm font-semibold text-brand-700">{p.label}</div>
                  {p.lines.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm text-slate-600 mt-1">
                      <span>
                        {l.designation} · {l.quantity} {l.unit}
                      </span>
                      <span>{formatMoney(Math.round(l.quantity * l.unitPrice), "")}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Remise (FCFA)</label>
                <input
                  type="number"
                  className="input"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">TVA (%)</label>
                <input
                  type="number"
                  className="input"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <label className="label">Instructions spéciales (optionnel)</label>
              <textarea
                className="input"
                rows={2}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Délai d'exécution, garantie, conditions de paiement…"
              />
            </div>
            <dl className="space-y-1 text-sm pt-2 border-t border-slate-100">
              <Row label="Sous-total matières" value={totals.subtotal} />
              <Row label="Main-d'œuvre" value={totals.laborTotal} />
              <Row label="Transport" value={totals.transport} />
              {discount > 0 && <Row label="Remise" value={-discount} />}
              {totals.taxAmount > 0 && (
                <Row label={`TVA (${taxRate}%)`} value={totals.taxAmount} />
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setView("postes")}>
              ← Postes
            </button>
            <button
              className="btn-accent flex-1"
              onClick={save}
              disabled={saving || allLines.length === 0}
            >
              {saving ? "Création…" : "→ Aperçu & choix du modèle"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function computeTotals(lines: Line[], discount: number, taxRate: number) {
  let subtotal = 0,
    laborTotal = 0,
    transport = 0;
  for (const l of lines) {
    const t = Math.round(l.quantity * l.unitPrice);
    if (l.kind === "LABOR") laborTotal += t;
    else if (l.kind === "TRANSPORT") transport += t;
    else subtotal += t;
  }
  const baseHT = Math.max(0, subtotal + laborTotal + transport - discount);
  const taxAmount = Math.round((baseHT * taxRate) / 100);
  return { subtotal, laborTotal, transport, taxAmount, total: baseHT + taxAmount };
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{label}</dt>
      <dd>{formatMoney(value, "")}</dd>
    </div>
  );
}
