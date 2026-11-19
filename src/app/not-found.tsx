import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <p className="text-5xl">🔍</p>
      <h1 className="mt-2 text-xl font-extrabold">ページが見つかりません</h1>
      <p className="mt-1 text-sm text-ink-soft">問題セットが非公開になったか、URLがまちがっているかもしれません。</p>
      <Link href="/" className="btn-pop pop-pink mt-5">
        🏠 ホームへ
      </Link>
    </div>
  );
}
