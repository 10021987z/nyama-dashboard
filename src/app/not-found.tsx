import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ backgroundColor: "#fbf9f5" }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
      >
        <span className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}>
          404
        </span>
      </div>
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold italic"
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}
        >
          Page introuvable
        </h1>
        <p className="text-sm" style={{ color: "#7c7570" }}>
          La page que vous cherchez n&apos;existe pas dans l&apos;écosystème Nyama.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}
      >
        Retour au dashboard
      </Link>
      <p
        className="text-[10px] font-medium tracking-[0.12em] uppercase mt-8"
        style={{ color: "#b8b3ad" }}
      >
        NYAMA TECH SYSTEMS &copy; 2026 &bull; PROPULSION DE L&apos;EXCELLENCE CULINAIRE CAMEROUNAISE
      </p>
    </div>
  );
}
