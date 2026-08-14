export default function WooFiWidgetUnavailable() {
  return (
    <div className="flex min-h-48 w-full max-w-lg items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      <div>
        <h2 className="text-lg font-semibold text-white">Swap unavailable</h2>
        <p className="mt-2 text-sm text-white/60">
          The swap service is temporarily unavailable on this deployment.
        </p>
      </div>
    </div>
  );
}
