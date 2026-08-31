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
        <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-lime-300 bg-clip-text text-center text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          MERDEX
        </h1>
        <p className="mb-8 mt-3 max-w-2xl text-center text-sm text-white/60 sm:text-base">
          MERDEX is a secure and high-speed aggregate platform.
        </p>

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
            onClick={() => window.location.assign("https://perp.mer.finance")}
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

        {/* 底部 Bybit 广告横幅 */}
        <div className="mt-12 flex w-full max-w-[1000px] justify-center px-2">
          <a
            href="你的Bybit注册或邀请链接"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full transition-transform hover:scale-[1.01]"
          >
            <img
              src="/bybit-banner.JPG"
              alt="Bybit Promotion"
              className="w-full rounded-xl border border-white/10 object-cover shadow-lg"
            />
          </a>
        </div>
      </div>
    </>
  );
}
