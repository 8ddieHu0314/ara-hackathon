import Compose from "@/components/compose";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">New post</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Draft once. We tailor it for LinkedIn, X, and Reddit — you review, then ship
          everywhere with one click.
        </p>
      </div>
      <Compose />
    </div>
  );
}
