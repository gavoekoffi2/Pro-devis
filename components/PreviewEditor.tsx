"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteDocument, PAPER_WIDTH } from "@/components/templates";
import { TEMPLATES, money, type QuoteView, type ViewItem } from "@/lib/quote-view";
import { amountInWords } from "@/lib/number-words";

type Props = {
  quoteId: string;
  initialView: QuoteView;
  templateId: string;
  paper: string;
};

export function PreviewEditor({ quoteId, initialView, templateId, paper }: Props) {
  const router = useRouter();
  const [tpl, setTpl] = useState(templateId);
  const [size, setSize] = useState(paper);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [fields, setFields] = useState({
    clientName: initialView.clientName ?? "",
    clientPhone: initialView.clientPhone ?? "",
    siteAddress: initialView.siteAddress ?? "",
    projectDescription: initialView.projectDescription ?? "",
    workLabel: initialView.workLabel ?? "",
    specialInstructions: initialView.specialInstructions ?? "",
    paymentTerms: initialView.paymentTerms ?? "",
    validityDays: initialView.validityDays,
  });
  const [discount, setDiscount] = useState(initialView.discount);
  const [taxRate, setTaxRate] = useState(initialView.taxRate);
  const [lines, setLines] = useState<ViewItem[]>(initialView.items);

  const set = (k: keyof typeof fields, v: string | number) =>
    setFields((f) => ({ ...f, [k]: v }));

  const totals = useMemo(() => {
    let subtotal = 0,
      labor = 0,
      transport = 0;
    for (const l of lines) {
      const t = Math.round(l.quantity * l.unitPrice);
      if (l.kind === "LABOR") labor += t;
      else if (l.kind === "TRANSPORT") transport += t;
      else subtotal += t;
    }
    const baseHT = Math.max(0, subtotal + labor + transport - discount);
    const taxAmount = Math.round((baseHT * taxRate) / 100);
    return {
      subtotal,
      laborTotal: labor,
      transport,
      discount,
      taxRate,
      taxAmount,
      total: baseHT + taxAmount,
    };
  }, [lines, discount, taxRate]);

  const view: QuoteView = useMemo(
    () => ({
      ...initialView,
      ...fields,
      items: lines.map((l) => ({ ...l, total: Math.round(l.quantity * l.unitPrice) })),
      ...totals,
      amountInWords: amountInWords(totals.total, initialView.currency),
      balance: Math.max(0, totals.total - (initialView.amountPaid || 0)),
    }),
    [initialView, fields, lines, totals]
  );

  function editLine(i: number, field: "designation" | "quantity" | "unitPrice", v: string | number) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: v } : l)));
  }
  function removeLine(i: number) {
    setLines((ls) => ls.filter((_, idx) => idx !== i));
  }
  function addLine() {
    setLines((ls) => [
      ...ls,
      { designation: "Nouvelle ligne", unit: "pièce", quantity: 1, unitPrice: 0, total: 0, kind: "MATERIAL" },
    ]);
  }

  async function save(thenPrint = false) {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: tpl,
          paperSize: size,
          ...fields,
          discount,
          taxRate,
          lines,
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        if (thenPrint) setTimeout(() => window.print(), 250);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Enregistrement impossible.");
      }
    } catch {
      setError("Enregistrement impossible. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  }

  const width = PAPER_WIDTH[size] ?? PAPER_WIDTH.A4;

  return (
    <div className="lg:flex lg:gap-6 lg:items-start">
      {/* Panneau de contrôle */}
      <div className="no-print lg:w-80 lg:shrink-0 space-y-4 mb-5 lg:mb-0">
        <div className="card p-4">
          <div className="font-semibold mb-2">Modèle de devis</div>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTpl(t.id)}
                className={`rounded-xl border p-2 text-left transition ${
                  tpl === t.id
                    ? "border-brand-500 ring-2 ring-brand-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex gap-1 mb-1">
                  <span className="h-4 w-4 rounded" style={{ background: t.swatch[0] }} />
                  <span className="h-4 w-4 rounded" style={{ background: t.swatch[1] }} />
                </div>
                <div className="text-xs font-semibold flex items-center gap-1">
                  {t.name}
                  {t.badge && (
                    <span className="badge bg-amber-100 text-amber-700 !px-1.5 !py-0 text-[9px]">
                      {t.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="font-semibold mb-2">Format</div>
          <div className="grid grid-cols-2 gap-2">
            {["A4", "A5"].map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`btn-sm rounded-lg border ${
                  size === s
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                {s} {s === "A5" && "🌿"}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            A5 = moitié d'une feuille A4, économise l'encre et le papier.
          </p>
        </div>

        <button
          onClick={() => setShowEdit((s) => !s)}
          className="btn-ghost w-full"
        >
          {showEdit ? "▲ Masquer l'édition" : "✏️ Modifier le contenu"}
        </button>

        {showEdit && (
          <div className="card p-4 space-y-3">
            <Field label="Client" value={fields.clientName} onChange={(v) => set("clientName", v)} />
            <Field label="Téléphone" value={fields.clientPhone} onChange={(v) => set("clientPhone", v)} />
            <Field label="Adresse chantier" value={fields.siteAddress} onChange={(v) => set("siteAddress", v)} />
            <Field label="Intitulé des travaux" value={fields.workLabel} onChange={(v) => set("workLabel", v)} />
            <Area label="Description du projet" value={fields.projectDescription} onChange={(v) => set("projectDescription", v)} />
            <Area
              label="Instructions spéciales (délais, garantie, paiement…)"
              value={fields.specialInstructions}
              onChange={(v) => set("specialInstructions", v)}
            />
            <Field label="Conditions de paiement" value={fields.paymentTerms} onChange={(v) => set("paymentTerms", v)} />
            <div className="grid grid-cols-3 gap-2">
              <NumField label="Validité (j)" value={fields.validityDays} onChange={(v) => set("validityDays", v)} />
              <NumField label="Remise" value={discount} onChange={setDiscount} />
              <NumField label="TVA %" value={taxRate} onChange={setTaxRate} />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="font-semibold text-sm mb-2">Lignes</div>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-2">
                    <div className="flex gap-2 items-center">
                      <input
                        className="input !py-1.5 !px-2 text-xs flex-1"
                        value={l.designation}
                        onChange={(e) => editLine(i, "designation", e.target.value)}
                      />
                      <button
                        onClick={() => removeLine(i)}
                        className="text-slate-400 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        step="any"
                        className="input !py-1.5 !px-2 text-xs"
                        value={l.quantity}
                        onChange={(e) => editLine(i, "quantity", parseFloat(e.target.value) || 0)}
                      />
                      <input
                        type="number"
                        step="any"
                        className="input !py-1.5 !px-2 text-xs"
                        value={l.unitPrice}
                        onChange={(e) => editLine(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addLine} className="btn-ghost btn-sm w-full mt-2">
                + Ajouter une ligne
              </button>
            </div>
            <div className="text-right text-sm font-bold">
              Total : {money(totals.total, view.currency)}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <button onClick={() => save(false)} disabled={saving} className="btn-primary w-full">
            {saving ? "Enregistrement…" : saved ? "✓ Enregistré" : "💾 Enregistrer"}
          </button>
          <button onClick={() => save(true)} disabled={saving} className="btn-accent w-full">
            🖨️ Enregistrer & Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Aperçu en direct */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-center">
          <div
            className="print-page bg-white shadow-xl rounded-md overflow-hidden"
            style={{ width, maxWidth: "100%" }}
          >
            <QuoteDocument view={view} templateId={tpl} paper={size} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label !mb-0.5 !text-xs">{label}</label>
      <input className="input !py-2 !px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label !mb-0.5 !text-xs">{label}</label>
      <textarea
        rows={2}
        className="input !py-2 !px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label !mb-0.5 !text-xs">{label}</label>
      <input
        type="number"
        className="input !py-2 !px-2 text-sm"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}
