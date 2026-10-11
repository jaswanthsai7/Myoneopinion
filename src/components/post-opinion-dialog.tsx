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
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F3EBDD] border border-[#D7C29F] p-6 shadow-2xl overflow-hidden">
        {/* Subtle decorative flower in top-right */}
        <img
          src={flowerImg}
          alt=""
          className="absolute -top-10 -right-10 w-36 h-36 opacity-15 pointer-events-none object-contain"
        />

        <div className="flex items-center justify-between pb-3 border-b border-[#DEC9A8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E6D7BD] border border-[#D7C29F] flex items-center justify-center p-1">
              <img src={flowerImg} alt="" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#1A1612]">
                Post Your One Opinion
              </h2>
              <p className="text-xs text-[#746857]">
                Say it. Keep it forever. Immutable.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#746857] hover:text-[#1A1612] hover:bg-[#E6D7BD] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Daily limit badge */}
        <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-[#E8DCBE]/70 border border-[#D7C29F] text-xs">
          <span className="text-[#564C3F]">
            Daily allowance: <strong className="text-[#1A1612]">{postCountToday} / {maxDailyPosts}</strong> opinions used today
          </span>
          <span className="text-[11px] text-[#867966]">
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
              className="w-full rounded-xl bg-white border border-[#D7C29F] p-3.5 text-sm text-[#1A1612] placeholder-[#948878] focus:outline-hidden focus:ring-2 focus:ring-[#BD841A] resize-none disabled:bg-[#ECE1CD] disabled:cursor-not-allowed"
            />
            <div className="flex justify-between items-center px-1 text-xs mt-1">
              <span className="text-[#867966] text-[11px]">
                24 hours to reach 1,000 Hype Points for permanent leaderboard.
              </span>
              <span
                className={`font-mono font-medium ${
                  isOverLimit ? 'text-red-600 font-bold' : remaining < 20 ? 'text-amber-600' : 'text-[#867966]'
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
              className="px-4 py-2 rounded-full border border-[#D7C29F] bg-[#F7EFE1] text-xs font-medium text-[#1A1612] hover:bg-[#E6D7BD] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isOverLimit || isLimitReached || loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1A1612] text-white text-xs font-semibold hover:bg-[#312A22] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
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
