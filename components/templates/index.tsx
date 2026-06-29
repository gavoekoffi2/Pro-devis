import { type QuoteView } from "@/lib/quote-view";
import {
  Logo,
  Contacts,
  ItemsTable,
  Totals,
  Conditions,
  ImportedHeader,
  shade,
  contrastText,
} from "./parts";

type TProps = { view: QuoteView; compact?: boolean };

function ClientProject({ view, labelColor = "#94a3b8" }: { view: QuoteView; labelColor?: string }) {
  return (
    <div className="grid grid-cols-2 gap-6 mt-5 text-sm">
      <div>
        <div className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: labelColor }}>
          Client
        </div>
        <div className="font-semibold">{view.clientName || "—"}</div>
        {view.clientPhone && <div>{view.clientPhone}</div>}
        {view.siteAddress && <div className="text-slate-600">Chantier : {view.siteAddress}</div>}
      </div>
      <div>
        <div className="text-[10px] uppercase font-semibold tracking-wide" style={{ color: labelColor }}>
          Projet
        </div>
        <div className="font-medium">{view.workLabel}</div>
        {view.projectDescription && <div className="text-slate-600">{view.projectDescription}</div>}
      </div>
    </div>
  );
}

function TitleBlock({ view, color, align = "right" }: { view: QuoteView; color: string; align?: string }) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="text-2xl font-extrabold" style={{ color }}>
        {view.docTitle}
      </div>
      <div className="text-sm font-semibold">{view.number}</div>
      <div className="text-xs text-slate-500 mt-1">Date : {view.date}</div>
      <div className="text-xs text-slate-500">Valable jusqu'au {view.validUntil}</div>
    </div>
  );
}

/* ─────────────────── 1. SIMPLE PRO ─────────────────── */
function SimplePro({ view, compact }: TProps) {
  const c = view.company.brandColor;
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white" style={{ padding: compact ? 24 : 40 }}>
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div className="flex justify-between items-start gap-4 pb-5" style={{ borderBottom: `2px solid ${c}` }}>
          <div className="flex items-center gap-3">
            <Logo view={view} size={compact ? 48 : 64} />
            <div>
              <div className="text-xl font-extrabold">{view.company.name}</div>
              {view.company.activity && (
                <div className="text-xs text-slate-500">{view.company.activity}</div>
              )}
              <Contacts view={view} className="text-xs text-slate-500 mt-1" />
            </div>
          </div>
          <TitleBlock view={view} color={shade(c, -0.1)} />
        </div>
      )}
      <ClientProject view={view} />
      <div className="mt-6">
        <ItemsTable view={view} headBg={c} headFg="#fff" compact={compact} />
      </div>
      <div className="mt-4">
        <Totals view={view} accent={c} compact={compact} />
      </div>
      <Conditions view={view} accent={c} compact={compact} />
    </div>
  );
}

/* ─────────────────── 2. MODERNE PREMIUM ─────────────────── */
function ModernePremium({ view, compact }: TProps) {
  const c = view.company.brandColor;
  const fg = contrastText(c);
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white">
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div
          style={{
            background: `linear-gradient(120deg, ${c}, ${shade(c, -0.25)})`,
            color: fg,
            padding: compact ? "20px 24px" : "28px 40px",
          }}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo view={view} size={compact ? 52 : 68} styleOverride="badge" />
              <div>
                <div className="text-2xl font-extrabold leading-tight">{view.company.name}</div>
                {view.company.slogan && (
                  <div className="text-sm opacity-90 italic">« {view.company.slogan} »</div>
                )}
                {view.company.activity && (
                  <div className="text-xs opacity-80">{view.company.activity}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black tracking-tight">{view.docTitle}</div>
              <div className="text-sm font-semibold opacity-90">{view.number}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: compact ? 24 : 40, paddingTop: 16 }}>
        <div className="flex justify-between text-xs text-slate-500">
          <Contacts view={view} />
          <div className="text-right">
            <div>Date : {view.date}</div>
            <div>Valable jusqu'au {view.validUntil}</div>
          </div>
        </div>
        <ClientProject view={view} />
        <div className="mt-6 rounded-xl overflow-hidden" style={{ border: `1px solid ${shade(c, 0.35)}` }}>
          <ItemsTable view={view} headBg={c} headFg={fg} stripe={shade(c, 0.46)} compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={c} compact={compact} />
        </div>
        <Conditions view={view} accent={c} compact={compact} />
      </div>
    </div>
  );
}

/* ─────────────────── 3. BÂTIMENT / BTP ─────────────────── */
function BtpTemplate({ view, compact }: TProps) {
  const slate = "#0f172a";
  const amber = "#f59e0b";
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white" style={{ padding: compact ? 0 : 0 }}>
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div style={{ background: slate, color: "#fff", padding: compact ? "18px 24px" : "24px 40px" }}>
          <div
            style={{
              height: 6,
              background: `repeating-linear-gradient(45deg, ${amber}, ${amber} 14px, ${slate} 14px, ${slate} 28px)`,
              marginBottom: 16,
            }}
          />
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo view={view} size={compact ? 50 : 66} styleOverride="square" />
              <div>
                <div className="text-2xl font-black uppercase tracking-wide">{view.company.name}</div>
                {view.company.activity && (
                  <div className="text-xs uppercase tracking-widest" style={{ color: amber }}>
                    {view.company.activity}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black uppercase" style={{ color: amber }}>
                {view.docTitle}
              </div>
              <div className="text-sm">{view.number}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: compact ? 24 : 40, paddingTop: 16 }}>
        <div className="flex justify-between text-xs text-slate-500">
          <Contacts view={view} />
          <div className="text-right">
            <div>Date : {view.date}</div>
            <div>Valable jusqu'au {view.validUntil}</div>
          </div>
        </div>
        <ClientProject view={view} labelColor={amber} />
        <div className="mt-6">
          <ItemsTable view={view} headBg={slate} headFg="#fff" stripe="#fff7ed" border="#e2e8f0" compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={shade(amber, -0.2)} compact={compact} />
        </div>
        <Conditions view={view} accent={slate} compact={compact} />
      </div>
    </div>
  );
}

/* ─────────────────── 4. ARCHITECTE ─────────────────── */
function ArchitecteTemplate({ view, compact }: TProps) {
  const ink = "#111827";
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white" style={{ padding: compact ? 26 : 48, fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div className="flex justify-between items-end pb-4" style={{ borderBottom: `1px solid ${ink}` }}>
          <div>
            <div className="text-2xl tracking-[0.2em] uppercase">{view.company.name}</div>
            {view.company.activity && (
              <div className="text-xs tracking-[0.25em] uppercase text-slate-500 mt-1">
                {view.company.activity}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm tracking-[0.3em] uppercase">{view.docTitle}</div>
            <div className="text-xs text-slate-500 mt-1">{view.number}</div>
          </div>
        </div>
      )}
      <div className="flex justify-between text-[11px] text-slate-500 mt-3">
        <Contacts view={view} />
        <div className="text-right">
          <div>{view.date}</div>
          <div>Valable jusqu'au {view.validUntil}</div>
        </div>
      </div>
      <ClientProject view={view} />
      <div className="mt-6">
        <ItemsTable view={view} headBg="#fff" headFg={ink} stripe="#fafafa" border="#d1d5db" compact={compact} />
        <div style={{ borderTop: `2px solid ${ink}` }} />
      </div>
      <div className="mt-4">
        <Totals view={view} accent={ink} compact={compact} />
      </div>
      <Conditions view={view} accent={ink} compact={compact} />
    </div>
  );
}

/* ─────────────────── 5. ARTISAN ─────────────────── */
function ArtisanTemplate({ view, compact }: TProps) {
  const green = "#15803d";
  const brown = "#92400e";
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white">
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div style={{ background: "#fffbeb", padding: compact ? "18px 24px" : "24px 40px", borderBottom: `3px solid ${brown}` }}>
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Logo view={view} size={compact ? 52 : 68} styleOverride="circle" />
              <div>
                <div className="text-2xl font-extrabold" style={{ color: brown }}>
                  {view.company.name}
                </div>
                {view.company.slogan && (
                  <div className="text-sm italic" style={{ color: green }}>
                    « {view.company.slogan} »
                  </div>
                )}
                {view.company.activity && (
                  <div className="text-xs text-slate-600">{view.company.activity}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: green }}>
                {view.docTitle}
              </div>
              <div className="text-sm font-semibold">{view.number}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: compact ? 24 : 40, paddingTop: 16 }}>
        <div className="flex justify-between text-xs text-slate-500">
          <Contacts view={view} />
          <div className="text-right">
            <div>Date : {view.date}</div>
            <div>Valable jusqu'au {view.validUntil}</div>
          </div>
        </div>
        <ClientProject view={view} labelColor={brown} />
        <div className="mt-6 rounded-xl overflow-hidden border border-amber-200">
          <ItemsTable view={view} headBg={green} headFg="#fff" stripe="#f0fdf4" compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={brown} compact={compact} />
        </div>
        <Conditions view={view} accent={green} compact={compact} />
      </div>
    </div>
  );
}

/* ─────────────────── 6. LUXE ─────────────────── */
function LuxeTemplate({ view, compact }: TProps) {
  const black = "#111111";
  const gold = "#c9a227";
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white" style={{ fontFamily: "Georgia, serif" }}>
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div style={{ background: black, color: "#fff", padding: compact ? "22px 24px" : "30px 40px" }}>
          <div className="flex flex-col items-center text-center gap-2">
            <Logo view={view} size={compact ? 50 : 64} styleOverride="circle" />
            <div className="text-2xl font-bold tracking-[0.15em] uppercase" style={{ color: gold }}>
              {view.company.name}
            </div>
            {view.company.slogan && (
              <div className="text-xs tracking-[0.25em] uppercase text-slate-300">
                {view.company.slogan}
              </div>
            )}
            <div style={{ width: 60, height: 2, background: gold, margin: "4px auto" }} />
            <div className="text-sm tracking-[0.4em] uppercase" style={{ color: gold }}>
              {view.docTitle}
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: compact ? 24 : 44, paddingTop: 18 }}>
        <div className="flex justify-between text-[11px] text-slate-500">
          <Contacts view={view} />
          <div className="text-right">
            <div>{view.number}</div>
            <div>{view.date}</div>
            <div>Valable jusqu'au {view.validUntil}</div>
          </div>
        </div>
        <ClientProject view={view} labelColor={gold} />
        <div className="mt-6" style={{ border: `1px solid ${gold}` }}>
          <ItemsTable view={view} headBg={black} headFg={gold} stripe="#faf8f0" border="#eadfb8" compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={shade(gold, -0.15)} compact={compact} />
        </div>
        <Conditions view={view} accent={black} compact={compact} />
      </div>
    </div>
  );
}

/* ─────────────────── 7. ÉCONOMIQUE A5 ─────────────────── */
function EcoTemplate({ view }: TProps) {
  const ink = "#374151";
  const hasHeader = !!view.company.headerImageUrl;
  return (
    <div className="bg-white" style={{ padding: 20, fontSize: 11 }}>
      <ImportedHeader view={view} />
      {!hasHeader && (
        <div className="flex justify-between items-start pb-2" style={{ borderBottom: `1.5px solid ${ink}` }}>
          <div>
            <div className="text-lg font-bold">{view.company.name}</div>
            {view.company.activity && (
              <div className="text-[10px] text-slate-500">{view.company.activity}</div>
            )}
            <Contacts view={view} className="text-[10px] text-slate-500" />
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{view.docTitle}</div>
            <div className="text-[11px]">{view.number}</div>
            <div className="text-[10px] text-slate-500">{view.date}</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mt-2 text-[11px]">
        <div>
          <span className="text-slate-400">Client : </span>
          <span className="font-semibold">{view.clientName}</span>
          {view.clientPhone && <div className="text-slate-500">{view.clientPhone}</div>}
        </div>
        <div>
          <span className="text-slate-400">Projet : </span>
          {view.workLabel}
        </div>
      </div>
      <div className="mt-3">
        <ItemsTable view={view} headBg="#e5e7eb" headFg={ink} stripe="#f9fafb" compact />
      </div>
      <div className="mt-2">
        <Totals view={view} accent={ink} compact />
      </div>
      <Conditions view={view} accent={ink} compact />
    </div>
  );
}

/* ─────────────────── 8. IDENTITÉ FORTE ─────────────────── */
function IdentiteTemplate({ view, compact }: TProps) {
  const c = view.company.brandColor;
  const fg = contrastText(c);
  const hasHeader = !!view.company.headerImageUrl;
  if (hasHeader) {
    return (
      <div className="bg-white" style={{ padding: compact ? 24 : 40 }}>
        <ImportedHeader view={view} />
        <ClientProject view={view} />
        <div className="mt-6">
          <ItemsTable view={view} headBg={c} headFg={fg} compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={c} compact={compact} />
        </div>
        <Conditions view={view} accent={c} compact={compact} />
      </div>
    );
  }
  return (
    <div className="bg-white flex" style={{ minHeight: compact ? 420 : 700 }}>
      {/* Bandeau latéral couleur */}
      <div style={{ background: c, color: fg, width: compact ? 150 : 210, padding: compact ? 18 : 28 }} className="flex flex-col">
        <Logo view={view} size={compact ? 56 : 76} styleOverride="badge" />
        <div className="mt-4 text-xl font-black leading-tight">{view.company.name}</div>
        {view.company.slogan && (
          <div className="mt-1 text-xs italic opacity-90">« {view.company.slogan} »</div>
        )}
        {view.company.activity && (
          <div className="mt-2 text-[11px] opacity-90">{view.company.activity}</div>
        )}
        <div className="mt-auto pt-6 text-[11px] opacity-90">
          <Contacts view={view} />
        </div>
      </div>
      {/* Corps */}
      <div className="flex-1" style={{ padding: compact ? 22 : 36 }}>
        <div className="flex justify-between items-start">
          <div className="text-3xl font-black" style={{ color: c }}>
            {view.docTitle}
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold text-sm text-slate-700">{view.number}</div>
            <div>Date : {view.date}</div>
            <div>Valable jusqu'au {view.validUntil}</div>
          </div>
        </div>
        <ClientProject view={view} />
        <div className="mt-5">
          <ItemsTable view={view} headBg={c} headFg={fg} stripe={shade(c, 0.46)} compact={compact} />
        </div>
        <div className="mt-4">
          <Totals view={view} accent={c} compact={compact} />
        </div>
        <Conditions view={view} accent={c} compact={compact} />
      </div>
    </div>
  );
}

const REGISTRY: Record<string, (p: TProps) => JSX.Element> = {
  simple: SimplePro,
  modern: ModernePremium,
  btp: BtpTemplate,
  architecte: ArchitecteTemplate,
  artisan: ArtisanTemplate,
  luxe: LuxeTemplate,
  eco: EcoTemplate,
  identite: IdentiteTemplate,
};

/** Largeur d'une page selon le format (96 dpi). */
export const PAPER_WIDTH: Record<string, number> = { A4: 794, A5: 559 };

export function QuoteDocument({
  view,
  templateId,
  paper = "A4",
}: {
  view: QuoteView;
  templateId: string;
  paper?: string;
}) {
  const Tpl = REGISTRY[templateId] || SimplePro;
  const compact = paper === "A5" || templateId === "eco";
  return <Tpl view={view} compact={compact} />;
}
