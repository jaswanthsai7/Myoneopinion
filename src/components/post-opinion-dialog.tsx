import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import flowerImg from '../assets/flower-canonical.png';

interface PostOpinionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<{ success: boolean; error?: string }>;
  postCountToday: number;
  maxDailyPosts: number;
}

export const PostOpinionDialog: React.FC<PostOpinionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  postCountToday,
  maxDailyPosts = 10,
}) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const charCount = text.length;
  const remaining = 280 - charCount;
  const isOverLimit = remaining < 0;
  const isLimitReached = postCountToday >= maxDailyPosts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isOverLimit || isLimitReached || loading) return;

    setLoading(true);
    setErrorMsg('');
    const res = await onSubmit(text.trim());
    setLoading(false);

    if (res.success) {
      setText('');
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to publish opinion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F8F5EE] border border-[#DECDB6] p-6 shadow-2xl overflow-hidden">
        {/* Subtle decorative flower in top-right */}
        <img
          src={flowerImg}
          alt=""
          className="absolute -top-10 -right-10 w-36 h-36 opacity-15 pointer-events-none object-contain"
        />

        <div className="flex items-center justify-between pb-3 border-b border-[#E8DCBE]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFE3CF] border border-[#DECDB6] flex items-center justify-center p-1">
              <img src={flowerImg} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#191713]">
                Post Your One Opinion
              </h2>
              <p className="text-xs text-[#777168]">
                Say it. Keep it forever. Immutable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#777168] hover:text-[#191713] hover:bg-[#EFE3CF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily limit badge */}
        <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-[#EFE4D2]/70 border border-[#E0D1BB] text-xs">
          <span className="text-[#5A554D]">
            Daily allowance: <strong className="text-[#191713]">{postCountToday} / {maxDailyPosts}</strong> opinions used today
          </span>
          <span className="text-[11px] text-[#8C8477]">
            Resets at 00:00 UTC
          </span>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isLimitReached && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              You have reached your daily quota of 10 opinions. Your quota resets at 00:00 UTC.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What is the one truth or thought you want to leave behind?"
              disabled={isLimitReached || loading}
              rows={4}
              maxLength={320}
              className="w-full rounded-xl bg-white border border-[#DFCEB7] p-3.5 text-sm text-[#191713] placeholder-[#9E978C] focus:outline-hidden focus:ring-2 focus:ring-[#D4A32A] resize-none disabled:bg-[#F3ECE0] disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center px-1 text-xs mt-1">
              <span className="text-[#8C8477] text-[11px]">
                24 hours to reach 1,000 Hype Points for permanent leaderboard.
              </span>
              <span
                className={`font-mono font-medium ${
                  isOverLimit ? 'text-red-600 font-bold' : remaining < 20 ? 'text-amber-600' : 'text-[#8C8477]'
                }`}
              >
                {charCount} / 280
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-full border border-[#DFCEB7] bg-[#FAF6EE] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isOverLimit || isLimitReached || loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#191713] text-white text-xs font-semibold hover:bg-[#312E29] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E8C94C]" />
              <span>{loading ? 'Publishing...' : 'Publish Opinion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
