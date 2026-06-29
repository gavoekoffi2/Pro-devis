"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  async function load() {
    const r = await fetch("/api/clients");
    const d = await r.json();
    setClients(d.clients || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm({ name: "", phone: "", address: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce client ?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button onClick={() => setShowForm((s) => !s)} className="btn-accent">
          {showForm ? "Fermer" : "+ Client"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} className="card p-5 space-y-3">
          <div>
            <label className="label">Nom *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Téléphone / WhatsApp</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Adresse</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button className="btn-primary w-full" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}

      {!loading && clients.length > 0 && (
        <input
          className="input"
          placeholder="Rechercher un client…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500">Chargement…</div>
      ) : clients.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Aucun client enregistré.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {clients
            .filter((c) => {
              const s = query.toLowerCase();
              return (
                !s ||
                c.name.toLowerCase().includes(s) ||
                (c.phone || "").toLowerCase().includes(s) ||
                (c.address || "").toLowerCase().includes(s)
              );
            })
            .map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="min-w-0">
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-slate-500">
                  {c.phone} {c.address ? `· ${c.address}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.phone && (
                  <a
                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost btn-sm"
                  >
                    📲
                  </a>
                )}
                <button
                  onClick={() => remove(c.id)}
                  className="btn-ghost btn-sm !text-red-600"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
