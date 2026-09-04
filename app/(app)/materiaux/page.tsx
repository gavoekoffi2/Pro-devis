"use client";

import { useEffect, useMemo, useState } from "react";

type Material = {
  id: string;
  key: string;
  name: string;
  kind: string;
  unit: string;
  unitPrice: number;
  margin: number;
  tradeId: string | null;
  tradeName?: string;
  custom: boolean;
  ownedOnly: boolean;
};

const KIND_LABEL: Record<string, string> = {
  MATERIAL: "Matériau",
  LABOR: "Main-d'œuvre",
  TRANSPORT: "Transport",
  OTHER: "Frais",
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    unit: "pièce",
    kind: "MATERIAL",
    unitPrice: 0,
  });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [loadError, setLoadError] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/materials");
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLoadError(d.error || "Impossible de charger les matériaux.");
        return;
      }
      setLoadError("");
      setMaterials(d.materials || []);
    } catch {
      setLoadError("Impossible de charger les matériaux. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // Chargement initial : les setState sont déclenchés par la réponse
    // réseau, pas de façon synchrone pendant le rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => setAiAvailable(!!d.enabled))
      .catch(() => {});
  }, []);

  const trades = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => {
      if (m.tradeId && m.tradeName) map.set(m.tradeId, m.tradeName);
    });
    return Array.from(map.entries());
  }, [materials]);

  const hasCustom = materials.some((m) => m.ownedOnly);

  const shown = materials.filter((m) => {
    if (filter === "mine" && !m.ownedOnly) return false;
    if (filter !== "all" && filter !== "mine" && m.tradeId !== filter)
      return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  function edit(key: string, field: "unitPrice" | "margin", value: number) {
    setMaterials((ms) =>
      ms.map((m) => (m.key === key ? { ...m, [field]: value } : m))
    );
  }

  async function estimateWithAI() {
    const target = shown.filter((m) => m.kind !== "LABOR").slice(0, 40);
    if (target.length === 0) {
      setAiMsg("Aucun matériau à estimer dans la sélection courante.");
      return;
    }
    setAiBusy(true);
    setAiMsg("");
    let d: { prices?: Record<string, number>; error?: string } = {};
    try {
      const res = await fetch("/api/ai/estimate-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: target.map((m) => ({ key: m.key, name: m.name, unit: m.unit })),
        }),
      });
      d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAiMsg(d.error || "Estimation impossible.");
        return;
      }
    } catch {
      setAiMsg("Estimation impossible. Vérifiez votre connexion.");
      return;
    } finally {
      setAiBusy(false);
    }
    const prices: Record<string, number> = d.prices || {};
    let n = 0;
    setMaterials((ms) =>
      ms.map((m) => {
        if (prices[m.key]) {
          n++;
          return { ...m, unitPrice: prices[m.key] };
        }
        return m;
      })
    );
    setAiMsg(
      n > 0
        ? `✨ ${n} prix estimés. Vérifiez puis enregistrez (✓) ceux qui vous conviennent.`
        : "Aucune estimation obtenue."
    );
  }

  async function save(m: Material) {
    setSavingKey(m.key);
    setLoadError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: m.key,
          unitPrice: m.unitPrice,
          margin: m.margin,
        }),
      });
      if (!res.ok) {
        // L'ancienne version marquait le prix comme « enregistré » sans
        // regarder la réponse : l'artisan croyait son prix sauvegardé.
        const d = await res.json().catch(() => ({}));
        setLoadError(d.error || "Enregistrement du prix impossible.");
        return;
      }
      setMaterials((ms) =>
        ms.map((x) => (x.key === m.key ? { ...x, custom: true } : x))
      );
    } catch {
      setLoadError("Enregistrement du prix impossible. Vérifiez votre connexion.");
    } finally {
      setSavingKey(null);
    }
  }

  async function resetOrDelete(m: Material) {
    const msg = m.ownedOnly
      ? "Supprimer ce matériau personnalisé ?"
      : "Revenir au prix du catalogue pour ce matériau ?";
    if (!confirm(msg)) return;
    setSavingKey(m.key);
    setLoadError("");
    try {
      const res = await fetch(`/api/materials?key=${encodeURIComponent(m.key)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setLoadError(d.error || "Suppression impossible.");
        return;
      }
      await load();
    } catch {
      setLoadError("Suppression impossible. Vérifiez votre connexion.");
    } finally {
      setSavingKey(null);
    }
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    setAddError("");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setAddError(d.error || "Création impossible.");
        return;
      }
      setAddForm({ name: "", unit: "pièce", kind: "MATERIAL", unitPrice: 0 });
      setShowAdd(false);
      await load();
    } catch {
      setAddError("Création impossible. Vérifiez votre connexion.");
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matériaux & prix</h1>
          <p className="text-slate-500 text-sm">
            Ajustez vos prix locaux. Ils sont utilisés dans tous vos devis.
          </p>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-accent">
          {showAdd ? "Fermer" : "+ Matériau"}
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {loadError}
        </div>
      )}

      {showAdd && (
        <form onSubmit={addMaterial} className="card p-5 space-y-3">
          <h2 className="font-semibold">Nouveau matériau personnalisé</h2>
          {addError && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-2">
              {addError}
            </div>
          )}
          <div>
            <label className="label">Nom *</label>
            <input
              className="input"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="Ex : Pavé autobloquant 6 cm"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Unité</label>
              <input
                className="input"
                value={addForm.unit}
                onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={addForm.kind}
                onChange={(e) => setAddForm({ ...addForm, kind: e.target.value })}
              >
                {Object.entries(KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prix (FCFA)</label>
              <input
                type="number"
                min={0}
                className="input"
                value={addForm.unitPrice}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    unitPrice: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <button className="btn-primary w-full" disabled={addBusy}>
            {addBusy ? "Création…" : "Créer le matériau"}
          </button>
        </form>
      )}

      {aiAvailable && (
        <div className="card p-4 space-y-2">
          <button
            onClick={estimateWithAI}
            disabled={aiBusy}
            className="btn-primary w-full"
          >
            {aiBusy ? "Recherche des prix…" : "✨ Estimer les prix du marché (IA)"}
          </button>
          {aiMsg && <p className="text-xs text-slate-500">{aiMsg}</p>}
        </div>
      )}

      <input
        className="input"
        placeholder="Rechercher un matériau…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Tous
        </Chip>
        {hasCustom && (
          <Chip active={filter === "mine"} onClick={() => setFilter("mine")}>
            Mes matériaux
          </Chip>
        )}
        {trades.map(([id, name]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {name}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Chargement…</div>
      ) : shown.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Aucun matériau trouvé.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {shown.map((m) => (
            <div key={m.key} className="px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {KIND_LABEL[m.kind]} · /{m.unit}
                    {m.ownedOnly ? (
                      <span className="ml-2 text-accent-600">· personnalisé</span>
                    ) : m.custom ? (
                      <span className="ml-2 text-brand-600">· prix perso</span>
                    ) : null}
                  </div>
                </div>
                {(m.custom || m.ownedOnly) && (
                  <button
                    onClick={() => resetOrDelete(m)}
                    className="text-slate-400 hover:text-red-500 text-sm shrink-0"
                    title={
                      m.ownedOnly
                        ? "Supprimer ce matériau"
                        : "Revenir au prix catalogue"
                    }
                  >
                    {m.ownedOnly ? "🗑️" : "↺"}
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                  <label className="text-[11px] text-slate-400">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="input !py-2 !px-3 text-sm"
                    value={m.unitPrice}
                    onChange={(e) =>
                      edit(m.key, "unitPrice", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Marge %</label>
                  <input
                    type="number"
                    min={0}
                    className="input !py-2 !px-3 text-sm"
                    value={m.margin}
                    onChange={(e) =>
                      edit(m.key, "margin", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <button
                  onClick={() => save(m)}
                  disabled={savingKey === m.key}
                  className="btn-primary btn-sm h-[42px]"
                >
                  {savingKey === m.key ? "…" : "✓"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm border ${
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
