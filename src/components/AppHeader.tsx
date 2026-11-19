import Link from "next/link";

export function AppHeader() {
  return (
    <header className="safe-top sticky top-0 z-30 border-b-2 border-candy-purple-soft/60 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center px-4 py-2.5">
        <Link href="/" className="flex items-center gap-1 text-base font-extrabold" aria-label="ホームへ">
          <span aria-hidden>🛡️</span>
          <span>
            再試<span className="text-candy-pink">回避</span>委員会
          </span>
        </Link>
      </div>
    </header>
  );
}
