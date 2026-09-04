"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/calc";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  quoteCount: number;
  quoteTotal: number;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const r = await fetch("/api/clients");
      const d = await r.json();
      setClients(d.clients || []);
    } catch {
      setError("Impossible de charger les clients. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || "Enregistrement impossible.");
        return;
      }
      setForm({ name: "", phone: "", address: "", notes: "" });
      setShowForm(false);
      load();
    } catch {
      setError("Enregistrement impossible. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce client ? Ses devis existants seront conservés.")) return;
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

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

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
                className="flex items-center justify-between px-5 py-4 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-slate-500">
                    {c.phone} {c.address ? `· ${c.address}` : ""}
                  </div>
                  {c.quoteCount > 0 ? (
                    <Link
                      href={`/devis?client=${c.id}`}
                      className="text-xs text-brand-600 font-medium"
                    >
                      {c.quoteCount} devis · {formatMoney(c.quoteTotal)} →
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">Aucun devis</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/devis/nouveau?client=${c.id}`}
                    className="btn-ghost btn-sm"
                    title="Nouveau devis pour ce client"
                  >
                    📄+
                  </Link>
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost btn-sm"
                      title="WhatsApp"
                    >
                      📲
                    </a>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    className="btn-ghost btn-sm !text-red-600"
                    title="Supprimer"
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
