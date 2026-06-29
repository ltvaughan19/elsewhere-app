import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-jungle-600">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy-950">Page not found</h1>
      <p className="mt-4 text-navy-800/80">
        This route does not exist yet, or the country page may have moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-jungle-600 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to home
        </Link>
        <Link
          href="/countries"
          className="rounded-full border border-sand-200 px-5 py-2.5 text-sm font-medium text-navy-950"
        >
          Browse countries
        </Link>
      </div>
    </div>
  );
}
