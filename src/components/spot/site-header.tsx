import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import flowerImg from "@/assets/flower-canonical.png";
import { POST_PRICE_USD, formatUsd } from "@/lib/pricing";

interface SiteHeaderProps {
  onPost: () => void;
}

export function SiteHeader({ onPost }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#F3EBDD]/95 backdrop-blur-md border-b border-[#DAC6A4] px-4 md:px-8 py-3.5">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#E6D7BD] border border-[#D7C29F] flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform">
            <img src={flowerImg} alt="MyOneOpinion" className="w-full h-full object-contain" />
          </div>
          <span className="font-editorial text-xl font-medium tracking-tight text-[#1A1612]">
            opinion
          </span>
        </Link>

        <div className="hidden md:flex items-center justify-center">
          <span className="font-editorial text-sm font-semibold tracking-[0.35em] text-[#1A1612] uppercase">
            M Y O N E O P I N I O N
          </span>
        </div>

        <button
          type="button"
          onClick={onPost}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#312A22] transition-all shadow-sm hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#E8C94C]" />
          <span>Post Your Opinion · {formatUsd(POST_PRICE_USD)}</span>
        </button>
      </div>
    </header>
  );
}

export function SpotTabs({ activeTab }: { activeTab: "top" | "new" }) {
  const tabClass = (tab: "top" | "new") =>
    `text-sm md:text-base font-medium pb-1 transition-all relative ${
      activeTab === tab
        ? 'text-[#1A1612] font-semibold after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1A1612]'
        : "text-[#746857] hover:text-[#1A1612]"
    }`;

  return (
    <nav className="flex items-center justify-center gap-8 md:gap-10 mb-4 relative z-10">
      <Link to="/" className={tabClass("top")}>
        Top
      </Link>
      <Link to="/new" className={tabClass("new")}>
        New
      </Link>
    </nav>
  );
}
