import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 text-center">
      <span className="text-[64px] leading-none">🔍</span>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Page introuvable</h1>
        <p className="text-sm text-muted-foreground">
          La page que vous cherchez n&apos;existe pas.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1B4332] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1B4332]/90"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
