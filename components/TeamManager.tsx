"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  email: string;
  companyRole: string;
  createdAt: string;
};
type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Collaborateur",
};
const ROLE_CLS: Record<string, string> = {
  OWNER: "bg-brand-100 text-brand-700",
  ADMIN: "bg-amber-100 text-amber-700",
  MEMBER: "bg-slate-100 text-slate-600",
};

export function TeamManager({
  initialMembers,
  initialInvitations,
  me,
  canManage,
  maxMembers,
}: {
  initialMembers: Member[];
  initialInvitations: Invitation[];
  me: { id: string; companyRole: string };
  canManage: boolean;
  maxMembers: number;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const usedSlots = members.length + invitations.length;
  const full = usedSlots >= maxMembers;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteLink(null);
    setBusy(true);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d.error || "Invitation impossible.");
      return;
    }
    const link = `${window.location.origin}/rejoindre/${d.token}`;
    setInviteLink(link);
    setInvitations((inv) => [
      { id: "pending-" + d.token, email: email.toLowerCase(), role, expiresAt: "" },
      ...inv,
    ]);
    setEmail("");
    router.refresh();
  }

  async function revoke(id: string) {
    if (id.startsWith("pending-")) {
      router.refresh();
      return;
    }
    setBusy(true);
    await fetch(`/api/team/invite/${id}`, { method: "DELETE" });
    setBusy(false);
    setInvitations((inv) => inv.filter((i) => i.id !== id));
    router.refresh();
  }

  async function removeMember(id: string) {
    if (!confirm("Retirer ce membre de l'équipe ?")) return;
    setBusy(true);
    const res = await fetch(`/api/team/member/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setMembers((m) => m.filter((x) => x.id !== id));
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Suppression impossible.");
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Inviter */}
      {canManage && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Inviter un collaborateur</h2>
            <span className="text-xs text-slate-400">
              {usedSlots} / {maxMembers} membres
            </span>
          </div>

          {inviteLink && (
            <div className="rounded-xl bg-green-50 p-3 space-y-2">
              <p className="text-sm text-green-800">
                Invitation créée ! Envoyez ce lien à votre collaborateur :
              </p>
              <div className="flex gap-2">
                <input className="input text-xs" readOnly value={inviteLink} />
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="btn-ghost btn-sm shrink-0"
                >
                  {copied ? "✓" : "Copier"}
                </button>
              </div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Rejoignez notre équipe sur Pro Devis : ${inviteLink}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn-accent btn-sm w-full"
              >
                📲 Envoyer par WhatsApp
              </a>
            </div>
          )}

          <form onSubmit={invite} className="space-y-3">
            <div>
              <label className="label">Email du collaborateur</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborateur@email.com"
                required
                disabled={full}
              />
            </div>
            <div>
              <label className="label">Rôle</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={full}
              >
                <option value="MEMBER">Collaborateur (créer/éditer les devis)</option>
                <option value="ADMIN">Administrateur (gérer aussi l'équipe)</option>
              </select>
            </div>
            <button
              className="btn-primary w-full"
              disabled={busy || full || !email}
            >
              {full ? "Limite de membres atteinte" : "Créer l'invitation"}
            </button>
          </form>
        </div>
      )}

      {/* Membres */}
      <div className="card">
        <div className="px-5 py-3 border-b border-slate-100 font-semibold">
          Membres ({members.length})
        </div>
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {m.email}
                  {m.id === me.id && (
                    <span className="text-xs text-slate-400"> (vous)</span>
                  )}
                </div>
                <span className={`badge ${ROLE_CLS[m.companyRole]} mt-1`}>
                  {ROLE_LABEL[m.companyRole]}
                </span>
              </div>
              {canManage &&
                m.id !== me.id &&
                m.companyRole !== "OWNER" && (
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={busy}
                    className="text-sm text-red-500 hover:text-red-700 shrink-0"
                  >
                    Retirer
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>

      {/* Invitations en attente */}
      {invitations.length > 0 && (
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-100 font-semibold">
            Invitations en attente ({invitations.length})
          </div>
          <ul className="divide-y divide-slate-100">
            {invitations.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{i.email}</div>
                  <span className={`badge ${ROLE_CLS[i.role]} mt-1`}>
                    {ROLE_LABEL[i.role]} · en attente
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => revoke(i.id)}
                    disabled={busy}
                    className="text-sm text-slate-400 hover:text-red-600 shrink-0"
                  >
                    Annuler
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
