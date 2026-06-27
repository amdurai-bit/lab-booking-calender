import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-parchment-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-8">
        {/* Logo / crest */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-ink-700 flex items-center justify-center shadow-lg">
            <span className="text-4xl text-parchment-100">✦</span>
          </div>
          <h1 className="text-4xl font-bold text-ink-800 tracking-tight font-serif">
            Missionary Archive
          </h1>
          <p className="text-ink-500 text-lg italic">
            Digitising &amp; Transcribing 19th-Century Missionary Letters
          </p>
        </div>

        <div className="border-t border-parchment-300 pt-6 text-ink-600 text-sm leading-relaxed max-w-xl mx-auto">
          <p>
            A platform for historians and researchers working with manuscripts from
            missionaries such as <em>Robert Caldwell</em>, <em>Samuel Mateer</em>,
            and others who served in Travancore, Tirunelveli, the Madras Presidency,
            and Ceylon.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-ink-700 text-parchment-100 rounded font-medium hover:bg-ink-600 transition-colors"
          >
            Open Archive
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-ink-400 text-ink-700 rounded font-medium hover:bg-parchment-100 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-ink-400 mt-8">
          Optimised for cursive handwriting · Supports English, Tamil &amp; Malayalam ·
          TEI-XML export
        </p>
      </div>
    </main>
  );
}
