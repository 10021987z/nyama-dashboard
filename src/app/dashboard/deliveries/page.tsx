export default function DeliveriesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <span className="text-[56px] leading-none">🚚</span>
      <div>
        <h1 className="text-3xl font-semibold italic" style={{ fontFamily: "var(--font-newsreader), Georgia, serif", color: "#1b1c1a" }}>
          Deliveries
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#7c7570" }}>
          Suivi des livraisons en temps réel — bientôt disponible.
        </p>
      </div>
      <span className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, #a03c00, #c94d00)" }}>
        Bientôt disponible
      </span>
    </div>
  );
}
