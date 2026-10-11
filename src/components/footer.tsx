import React from 'react';
import flowerImg from '../assets/flower-canonical.png';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-[#E8DCBE] py-8 px-4 text-xs text-[#777168]">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Small Logo */}
        <div className="flex items-center gap-2">
          <img src={flowerImg} alt="" className="w-5 h-5 object-contain" />
        </div>

        {/* Center: Editorial Links */}
        <nav className="flex items-center gap-6 font-medium">
          <a href="#philosophy" className="hover:text-[#191713] transition-colors">The Philosophy</a>
          <span>·</span>
          <a href="#discovery" className="hover:text-[#191713] transition-colors">The Discovery</a>
          <span>·</span>
          <a href="#spotlight" className="hover:text-[#191713] transition-colors">The Spotlight</a>
          <span>·</span>
          <a href="#permanent" className="hover:text-[#191713] transition-colors">Your Permanent Page</a>
        </nav>

        {/* Right: Copyright */}
        <div className="text-[#8C8477]">
          © 2026 MyOneOpinion · One opinion. Forever.
        </div>
      </div>
    </footer>
  );
};
