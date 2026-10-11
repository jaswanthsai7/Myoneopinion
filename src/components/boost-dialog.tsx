import React, { useState } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import type { Opinion, PointBalance } from '../lib/db';
import flowerImg from '../assets/flower-canonical.png';

interface BoostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  opinion: Opinion | null;
  balance: PointBalance;
  onConfirmBoost: (opinionId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
}

export const BoostDialog: React.FC<BoostDialogProps> = ({
  isOpen,
  onClose,
  opinion,
  balance,
  onConfirmBoost,
}) => {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !opinion) return null;

  const totalBalance = balance.freeBalance + balance.purchasedBalance;
  const isInsufficient = totalBalance < selectedAmount;

  const handleBoost = async () => {
    if (isInsufficient || loading) return;
    setLoading(true);
    setErrorMsg('');
    const res = await onConfirmBoost(opinion.id, selectedAmount);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to boost opinion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-[#F3EBDD] border border-[#D7C29F] p-6 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DEC9A8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E6D7BD] border border-[#D7C29F] flex items-center justify-center text-[#BD841A]">
              <Zap className="w-4 h-4 fill-[#D49622]" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#1A1612]">
                Boost This Opinion
              </h2>
              <p className="text-xs text-[#746857]">
                Help it rise to the permanent leaderboard
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

        {/* Selected Opinion Preview */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#E8DCBE] border border-[#D8C3A0]">
          <p className="text-xs text-[#746857] mb-1 font-medium">{opinion.authorName}</p>
          <p className="font-editorial text-sm italic text-[#1A1612] leading-snug">
            "{opinion.text}"
          </p>
          <div className="mt-2 text-[11px] text-[#867966] flex items-center gap-2">
            <span>Currently: <strong>{opinion.hypePoints}</strong> / 1,000 pts</span>
            <span>·</span>
            <span>{opinion.supporterCount} supporters</span>
          </div>
        </div>

        {/* User Balance Breakdown */}
        <div className="mt-4 p-3 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8] flex justify-between items-center text-xs">
          <div>
            <div className="text-[#746857]">Your Available Balance</div>
            <div className="font-semibold text-[#1A1612] flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-[#D49622] fill-[#D49622]" />
              <span>{balance.freeBalance} free</span>
              <span className="text-[#867966] font-normal">+</span>
              <span>{balance.purchasedBalance} purchased</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#746857]">Total</div>
            <div className="font-bold text-sm text-[#1A1612]">{totalBalance} pts</div>
          </div>
        </div>

        {/* Amount Selector */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-[#564C3F] mb-2">
            Select Boost Amount (Hype Points):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 50, 100, 250].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSelectedAmount(amt)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  selectedAmount === amt
                    ? 'bg-[#BD841A] text-white border-[#BD841A] shadow-xs scale-102'
                    : 'bg-[#F6EEDA] text-[#1A1612] border-[#D7C29F] hover:bg-[#EAE0CA]'
                }`}
              >
                ⚡ {amt}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isInsufficient && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You need {selectedAmount - totalBalance} more points to make this boost.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#D7C29F] bg-[#F7EFE1] text-xs font-medium text-[#1A1612] hover:bg-[#E6D7BD] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBoost}
            disabled={isInsufficient || loading}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full btn-gold text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>{loading ? 'Boosting...' : `Confirm ⚡ ${selectedAmount} Boost`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
