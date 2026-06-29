"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
};
type Totals = {
  subtotal: number;
  laborTotal: number;
  transport: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
};

const STEPS = ["Client", "Métier", "Travail", "Mesures", "Devis"];

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Étape 1 — client
  const [client, setClient] = useState({
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    siteAddress: "",
    projectDescription: "",
    saveClient: true,
  });

  // Étape 2/3 — sélection
  const [trade, setTrade] = useState<Trade | null>(null);
  const [work, setWork] = useState<WorkType | null>(null);

  // Étape 4 — mesures
  const [values, setValues] = useState<Record<string, number>>({});

  // Étape 5 — calcul
  const [lines, setLines] = useState<Line[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/trades")
      .then((r) => r.json())
      .then((d) => setTrades(d.trades || []))
      .finally(() => setLoading(false));
  }, []);

  function pickTrade(t: Trade) {
    setTrade(t);
    setWork(null);
    setStep(2);
  }

  function pickWork(w: WorkType) {
    setWork(w);
    const init: Record<string, number> = {};
    for (const inp of w.inputs) init[inp.key] = inp.default ?? 0;
    setValues(init);
    setStep(3);
  }

  async function compute() {
    if (!work) return;
    setComputing(true);
    setError("");
    const res = await fetch("/api/quotes/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workTypeKey: work.key, values, discount, taxRate }),
    });
    setComputing(false);
    if (!res.ok) {
      setError("Calcul impossible.");
      return;
    }
    const d = await res.json();
    setLines(d.lines);
    setTotals(d.totals);
    setStep(4);
  }

  function recalcTotals(nextLines: Line[], disc = discount, tax = taxRate) {
    let subtotal = 0,
      labor = 0,
      transport = 0;
    for (const l of nextLines) {
      const t = Math.round(l.quantity * l.unitPrice);
      if (l.kind === "LABOR") labor += t;
      else if (l.kind === "TRANSPORT") transport += t;
      else subtotal += t;
    }
    const baseHT = Math.max(0, subtotal + labor + transport - disc);
    const taxAmount = Math.round((baseHT * tax) / 100);
    setTotals({
      subtotal,
      laborTotal: labor,
      transport,
      discount: disc,
      taxRate: tax,
      taxAmount,
      total: baseHT + taxAmount,
    });
  }

  function editLine(i: number, field: "quantity" | "unitPrice", v: number) {
    const next = lines.map((l, idx) =>
      idx === i ? { ...l, [field]: v, total: 0 } : l
    );
    next[i].total = Math.round(next[i].quantity * next[i].unitPrice);
    setLines(next);
    recalcTotals(next);
  }

  function removeLine(i: number) {
    const next = lines.filter((_, idx) => idx !== i);
    setLines(next);
    recalcTotals(next);
  }

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...client,
        tradeKey: trade?.key,
        workLabel: work?.name,
        workTypeId: work?.id,
        lines,
        discount,
        taxRate,
      }),
    });
    setSaving(false);
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/devis/${d.id}`);
    } else {
      setError(d.error || "Enregistrement impossible.");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement…</div>;
  }

  return (
    <div className="space-y-5">
      {/* Progression */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                i <= step ? "bg-brand-500" : "bg-slate-200"
              }`}
            />
            <div
              className={`mt-1 text-[11px] ${
                i === step ? "text-brand-600 font-semibold" : "text-slate-400"
              }`}
            >
              {s}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Étape 1 — Client */}
      {step === 0 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">Informations du client</h2>
          <div>
            <label className="label">Nom du client *</label>
            <input
              className="input"
              value={client.clientName}
              onChange={(e) =>
                setClient({ ...client, clientName: e.target.value })
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
                onChange={(e) =>
                  setClient({ ...client, clientPhone: e.target.value })
                }
                placeholder="+228 …"
              />
            </div>
            <div>
              <label className="label">Adresse du chantier</label>
              <input
                className="input"
                value={client.siteAddress}
                onChange={(e) =>
                  setClient({ ...client, siteAddress: e.target.value })
                }
                placeholder="Quartier, ville"
              />
            </div>
          </div>
          <div>
            <label className="label">Description du projet</label>
            <textarea
              className="input"
              rows={2}
              value={client.projectDescription}
              onChange={(e) =>
                setClient({ ...client, projectDescription: e.target.value })
              }
              placeholder="Construction d'un mur de clôture…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={client.saveClient}
              onChange={(e) =>
                setClient({ ...client, saveClient: e.target.checked })
              }
            />
            Enregistrer ce client dans mon carnet
          </label>
          <button
            className="btn-primary w-full"
            disabled={!client.clientName}
            onClick={() => setStep(1)}
          >
            Continuer
          </button>
        </div>
      )}

      {/* Étape 2 — Métier */}
      {step === 1 && (
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
          <button className="btn-ghost" onClick={() => setStep(0)}>
            ← Retour
          </button>
        </div>
      )}

      {/* Étape 3 — Type de travail */}
      {step === 2 && trade && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">
            {trade.icon} Type de travail
          </h2>
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
          <button className="btn-ghost" onClick={() => setStep(1)}>
            ← Changer de métier
          </button>
        </div>
      )}

      {/* Étape 4 — Mesures */}
      {step === 3 && work && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-bold">{work.name}</h2>
          <p className="text-sm text-slate-500">
            Entrez les dimensions ou quantités.
          </p>
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
                    setValues({
                      ...values,
                      [inp.key]: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(2)}>
              ← Retour
            </button>
            <button
              className="btn-primary flex-1"
              onClick={compute}
              disabled={computing}
            >
              {computing ? "Calcul…" : "Calculer le devis"}
            </button>
          </div>
        </div>
      )}

      {/* Étape 5 — Devis calculé */}
      {step === 4 && totals && (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 font-semibold">
              Détail du devis ({lines.length} lignes)
            </div>
            <div className="divide-y divide-slate-100">
              {lines.map((l, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-sm font-medium">{l.designation}</div>
                    <button
                      onClick={() => removeLine(i)}
                      className="text-slate-400 hover:text-red-500 text-sm"
                      title="Retirer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="text-[11px] text-slate-400">
                        Qté ({l.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="input !py-2 !px-3 text-sm"
                        value={l.quantity}
                        onChange={(e) =>
                          editLine(i, "quantity", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">P.U.</label>
                      <input
                        type="number"
                        step="any"
                        className="input !py-2 !px-3 text-sm"
                        value={l.unitPrice}
                        onChange={(e) =>
                          editLine(i, "unitPrice", parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="text-right text-sm font-semibold pb-2">
                      {formatMoney(l.total, "")}
                    </div>
                  </div>
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
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setDiscount(v);
                    recalcTotals(lines, v, taxRate);
                  }}
                />
              </div>
              <div>
                <label className="label">TVA (%)</label>
                <input
                  type="number"
                  className="input"
                  value={taxRate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setTaxRate(v);
                    recalcTotals(lines, discount, v);
                  }}
                />
              </div>
            </div>

            <dl className="space-y-1 text-sm pt-2 border-t border-slate-100">
              <Row label="Sous-total matières" value={totals.subtotal} />
              <Row label="Main-d'œuvre" value={totals.laborTotal} />
              <Row label="Transport" value={totals.transport} />
              {totals.discount > 0 && (
                <Row label="Remise" value={-totals.discount} />
              )}
              {totals.taxAmount > 0 && (
                <Row label={`TVA (${totals.taxRate}%)`} value={totals.taxAmount} />
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setStep(3)}>
              ← Mesures
            </button>
            <button
              className="btn-accent flex-1"
              onClick={save}
              disabled={saving || lines.length === 0}
            >
              {saving ? "Enregistrement…" : "✓ Créer le devis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <dt>{label}</dt>
      <dd>{formatMoney(value, "")}</dd>
    </div>
  );
}
