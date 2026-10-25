import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import flowerImg from "@/assets/flower-canonical.png";
import { POST_PRICE_USD, formatUsd } from "@/lib/pricing";

interface SiteHeaderProps {
  activeTab: "top" | "new";
  onPost: () => void;
}

export function SiteHeader({ activeTab, onPost }: SiteHeaderProps) {
  const tabClass = (tab: SiteHeaderProps["activeTab"]) =>
    `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
      activeTab === tab
        ? "bg-white/10 text-[var(--spot-text)]"
        : "text-[var(--spot-muted)] hover:text-[var(--spot-text)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--spot-line)] bg-[var(--spot-bg)]/80 backdrop-blur-xl">
      <div className="max-w-[1120px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1">
            <img src={flowerImg} alt="" className="w-full h-full object-contain" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            MyOne<span className="text-gold-gradient">Opinion</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 rounded-full border border-[var(--spot-line)] bg-white/[0.02] p-1">
          <Link to="/" className={tabClass("top")}>
            Top
          </Link>
          <Link to="/new" className={tabClass("new")}>
            New
          </Link>
        </nav>

        <button type="button" onClick={onPost} className="btn-hype px-4 py-2 text-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post · {formatUsd(POST_PRICE_USD)}</span>
        </button>
      </div>

      <nav className="sm:hidden flex items-center justify-center gap-1 pb-3">
        <Link to="/" className={tabClass("top")}>
          Top
        </Link>
        <Link to="/new" className={tabClass("new")}>
          New
        </Link>
      </nav>
    </header>
  );
}
