import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="card p-8 max-w-md text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h1 className="text-2xl font-bold">Page introuvable</h1>
        <p className="text-slate-600">
          Cette page n'existe pas, ou le devis que vous cherchez a été supprimé.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
