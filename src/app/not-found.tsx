import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center"
      style={{ backgroundColor: "#F5F5F0" }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
      >
        <span className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif" }}>
          404
        </span>
      </div>
      <div className="space-y-2">
        <h1
          className="text-3xl font-semibold italic"
          style={{ fontFamily: "var(--font-montserrat), system-ui, sans-serif", color: "#3D3D3D" }}
        >
          Page introuvable
        </h1>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          La page que vous cherchez n&apos;existe pas dans l&apos;écosystème Nyama.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #F57C20, #E06A10)" }}
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
