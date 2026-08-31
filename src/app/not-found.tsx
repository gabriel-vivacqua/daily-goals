import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <p className="micro-label mb-3">404</p>
      <h1 className="headline mb-4 text-4xl sm:text-5xl">Page not found.</h1>
      <p className="mb-8 text-sm text-foreground/60">
        That page doesn&rsquo;t exist, or you don&rsquo;t have access to it.
      </p>
      <Link
        href="/goals"
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
      >
        Back to Today&rsquo;s Goals
      </Link>
    </div>
  );
}
