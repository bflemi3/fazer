export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          You're offline
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Check your connection and try again.
        </p>
      </div>
    </div>
  );
}
