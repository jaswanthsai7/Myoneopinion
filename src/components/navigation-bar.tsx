import React from 'react';
import { Link } from '@tanstack/react-router';
import { Search, Sparkles, User as UserIcon } from 'lucide-react';
import flowerImg from '../assets/flower-canonical.png';

interface NavigationBarProps {
  onOpenPostDialog: () => void;
  onOpenSignInDialog?: () => void;
  user?: any;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  onOpenPostDialog,
  onOpenSignInDialog,
  user,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F3EBDD]/95 backdrop-blur-md border-b border-[#DAC6A4] px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#E6D7BD] border border-[#D7C29F] flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform">
            <img src={flowerImg} alt="MyOneOpinion" className="w-full h-full object-contain" />
          </div>
          <span className="font-editorial text-xl font-medium tracking-tight text-[#1A1612]">
            opinion
          </span>
        </Link>

        {/* Center Title */}
        <div className="hidden sm:flex items-center justify-center">
          <span className="font-editorial text-xs md:text-sm font-semibold tracking-[0.35em] text-[#1A1612] uppercase">
            M Y O N E O P I N I O N
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search opinions"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#746857] hover:text-[#1A1612] hover:bg-[#E6D7BD]/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {user ? (
            <Link
              to="/my-posts"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D7C29F] bg-[#EDE0CA] text-xs font-medium text-[#1A1612] hover:bg-[#E6D7BD] transition-colors"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-[#746857]" />
              )}
              <span>{user.handle || 'My Posts'}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenSignInDialog}
              className="px-4 py-1.5 rounded-full border border-[#D7C29F] bg-[#F7EFE1] text-xs font-medium text-[#1A1612] hover:bg-[#E6D7BD] transition-colors shadow-2xs"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPostDialog}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#312A22] transition-all shadow-sm hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8C94C]" />
            <span>Post Your One Opinion</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const NavTabs: React.FC<{ activeTab: 'top' | 'new' | 'my-posts' }> = ({ activeTab }) => {
  return (
    <nav className="flex items-center justify-center gap-8 md:gap-10 mb-4 z-10 relative">
      <Link
        to="/"
        className={`text-sm md:text-base font-medium pb-1 transition-all relative ${
          activeTab === 'top'
            ? 'text-[#1A1612] font-semibold after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1A1612]'
            : 'text-[#746857] hover:text-[#1A1612]'
        }`}
      >
        Top
      </Link>
      <Link
        to="/new"
        className={`text-sm md:text-base font-medium pb-1 transition-all relative ${
          activeTab === 'new'
            ? 'text-[#1A1612] font-semibold after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1A1612]'
            : 'text-[#746857] hover:text-[#1A1612]'
        }`}
      >
        New
      </Link>
      <Link
        to="/my-posts"
        className={`text-sm md:text-base font-medium pb-1 transition-all relative ${
          activeTab === 'my-posts'
            ? 'text-[#1A1612] font-semibold after:content-[""] after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1A1612]'
            : 'text-[#746857] hover:text-[#1A1612]'
        }`}
      >
        My Posts
      </Link>
    </nav>
  );
};
