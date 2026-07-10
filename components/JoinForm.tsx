"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  MEMBER: "Collaborateur",
};

type Invite = { email: string; role: string; companyName: string };

export function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loadError, setLoadError] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/team/join?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) setLoadError(d.error || "Invitation invalide.");
        else setInvite(d);
      })
      .catch(() => setLoadError("Impossible de charger l'invitation."));
  }, [token]);

  const checks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
  };
  const valid = checks.length && checks.upper && checks.digit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/team/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Impossible de rejoindre l'équipe.");
    }
  }

  if (loadError) {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="text-3xl">⛔</div>
        <p className="text-slate-700 font-medium">{loadError}</p>
        <Link href="/login" className="btn-ghost">
          Aller à la connexion
        </Link>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="card p-6 text-center text-slate-500">Chargement…</div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="rounded-2xl bg-brand-50 p-4 text-center">
        <p className="text-sm text-slate-600">
          Vous êtes invité(e) à rejoindre
        </p>
        <p className="font-bold text-lg text-brand-700">{invite.companyName}</p>
        <span className="badge bg-white text-brand-700 mt-1">
          {ROLE_LABEL[invite.role] || invite.role}
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div>
        <label className="label">Votre email</label>
        <input className="input bg-slate-50" value={invite.email} readOnly />
      </div>

      <div>
        <label className="label">Choisissez un mot de passe</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={12}
          autoComplete="new-password"
        />
        {password.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <PwHint ok={checks.length}>12 caractères</PwHint>
            <PwHint ok={checks.upper}>1 majuscule</PwHint>
            <PwHint ok={checks.digit}>1 chiffre</PwHint>
          </ul>
        )}
      </div>

      <button className="btn-primary w-full" disabled={loading || !valid}>
        {loading ? "Création…" : "Rejoindre l'équipe"}
      </button>
    </form>
  );
}

function PwHint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "text-green-600" : "text-slate-400"}>
      {ok ? "✓" : "○"} {children}
    </li>
  );
}
