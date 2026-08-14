import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import { generatePageTitle } from "@/utils/utils";

const WooFiWidget = lazy(() => import("@/components/WooFiWidget"));

export default function SwapIndex() {
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle("Swap");

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="flex h-full w-full flex-col items-center p-4 pt-8">
        <h1 className="mb-8 max-w-2xl text-center text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
          MERDEX is a secure and high-speed aggregate platform.
        </h1>

        <div className="mb-4 grid w-full max-w-[590px] grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2">
          <button
            type="button"
            className="h-14 rounded-xl border border-emerald-300/30 bg-white/[0.05] text-base font-semibold text-white"
            aria-current="page"
          >
            Swap
          </button>
          <button
            type="button"
            className="flex h-14 items-center justify-center gap-3 rounded-xl text-base text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
            onClick={() => window.location.assign("https://google.com")}
          >
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]" />
            Perps
          </button>
        </div>

        <div className="flex w-full justify-center">
          <Suspense fallback={<LoadingSpinner />}>
            <WooFiWidget />
          </Suspense>
        </div>
      </div>
    </>
  );
}
