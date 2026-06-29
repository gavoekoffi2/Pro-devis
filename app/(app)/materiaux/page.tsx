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

  async function load() {
    const r = await fetch("/api/materials");
    const d = await r.json();
    setMaterials(d.materials || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const trades = useMemo(() => {
    const map = new Map<string, string>();
    materials.forEach((m) => {
      if (m.tradeId && m.tradeName) map.set(m.tradeId, m.tradeName);
    });
    return Array.from(map.entries());
  }, [materials]);

  const shown = materials.filter(
    (m) => filter === "all" || m.tradeId === filter
  );

  function edit(key: string, field: "unitPrice" | "margin", value: number) {
    setMaterials((ms) =>
      ms.map((m) => (m.key === key ? { ...m, [field]: value, custom: true } : m))
    );
  }

  async function save(m: Material) {
    setSavingKey(m.key);
    await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: m.key,
        unitPrice: m.unitPrice,
        margin: m.margin,
      }),
    });
    setSavingKey(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Matériaux & prix</h1>
        <p className="text-slate-500 text-sm">
          Ajustez vos prix locaux. Ils sont utilisés dans tous vos devis.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>
          Tous
        </Chip>
        {trades.map(([id, name]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {name}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Chargement…</div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {shown.map((m) => (
            <div key={m.key} className="px-4 py-3">
              <div className="flex justify-between items-center">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {KIND_LABEL[m.kind]} · /{m.unit}
                    {m.custom && (
                      <span className="ml-2 text-brand-600">· prix perso</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                  <label className="text-[11px] text-slate-400">
                    Prix (FCFA)
                  </label>
                  <input
                    type="number"
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
