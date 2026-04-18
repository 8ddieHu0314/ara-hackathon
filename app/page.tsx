import Compose from "@/components/compose";

export default function Home() {
  return (
    <div className="w-full flex-1 px-12 py-12">
      <section className="mb-10 max-w-3xl animate-fade-up">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          Claude Sonnet 4.6 · via Ara
        </div>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
          Draft once.
          <br />
          <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
            Ship everywhere.
          </span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-[var(--muted)]">
          Paste your raw post. Signal tailors it for LinkedIn, X, and Reddit in
          their native voice. Review, edit, publish in one click.
        </p>
      </section>
      <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <Compose />
      </div>
    </div>
  );
}
