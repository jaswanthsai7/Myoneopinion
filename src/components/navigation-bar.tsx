import React from 'react';
import { Link } from '@tanstack/react-router';
import { Search, Sparkles, User as UserIcon } from 'lucide-react';
import flowerImg from '../assets/flower-canonical.png';

interface NavigationBarProps {
  activeTab: 'top' | 'new' | 'my-posts';
  onOpenPostDialog: () => void;
  onOpenSignInDialog?: () => void;
  user?: any;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onOpenPostDialog,
  onOpenSignInDialog,
  user,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F8F5EE]/95 backdrop-blur-md border-b border-[#EADFCB] px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#EFE3CF] border border-[#DECDB6] flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform">
            <img src={flowerImg} alt="MyOneOpinion" className="w-full h-full object-contain" />
          </div>
          <span className="font-editorial text-xl font-medium tracking-tight text-[#191713]">
            opinion
          </span>
        </Link>

        {/* Center Title & Tabs */}
        <div className="hidden md:flex flex-col items-center">
          <span className="font-editorial text-xs font-semibold tracking-[0.3em] text-[#777168] uppercase mb-1">
            M Y O N E O P I N I O N
          </span>
          <nav className="flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-medium pb-0.5 transition-all relative ${
                activeTab === 'top'
                  ? 'text-[#191713] font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#191713]'
                  : 'text-[#777168] hover:text-[#191713]'
              }`}
            >
              Top
            </Link>
            <Link
              to="/new"
              className={`text-sm font-medium pb-0.5 transition-all relative ${
                activeTab === 'new'
                  ? 'text-[#191713] font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#191713]'
                  : 'text-[#777168] hover:text-[#191713]'
              }`}
            >
              New
            </Link>
            <Link
              to="/my-posts"
              className={`text-sm font-medium pb-0.5 transition-all relative ${
                activeTab === 'my-posts'
                  ? 'text-[#191713] font-semibold after:content-[""] after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:bg-[#191713]'
                  : 'text-[#777168] hover:text-[#191713]'
              }`}
            >
              My Posts
            </Link>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search opinions"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#777168] hover:text-[#191713] hover:bg-[#EFE3CF]/60 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {user ? (
            <Link
              to="/my-posts"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#DFCEB7] bg-[#F4ECDC] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-[#777168]" />
              )}
              <span>{user.handle || 'My Posts'}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenSignInDialog}
              className="px-4 py-1.5 rounded-full border border-[#DFCEB7] bg-[#FAF6EE] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors shadow-2xs"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPostDialog}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#191713] text-white text-xs font-semibold hover:bg-[#312E29] transition-all shadow-sm hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8C94C]" />
            <span>Post Your One Opinion</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden justify-center items-center gap-6 mt-2 pt-2 border-t border-[#EADFCB]/60">
        <Link
          to="/"
          className={`text-xs font-medium pb-1 ${
            activeTab === 'top' ? 'text-[#191713] font-semibold border-b-2 border-[#191713]' : 'text-[#777168]'
          }`}
        >
          Top
        </Link>
        <Link
          to="/new"
          className={`text-xs font-medium pb-1 ${
            activeTab === 'new' ? 'text-[#191713] font-semibold border-b-2 border-[#191713]' : 'text-[#777168]'
          }`}
        >
          New Feed
        </Link>
        <Link
          to="/my-posts"
          className={`text-xs font-medium pb-1 ${
            activeTab === 'my-posts' ? 'text-[#191713] font-semibold border-b-2 border-[#191713]' : 'text-[#777168]'
          }`}
        >
          My Posts
        </Link>
      </div>
    </header>
  );
};
