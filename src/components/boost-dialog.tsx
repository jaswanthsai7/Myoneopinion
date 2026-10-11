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
      <div className="relative w-full max-w-md rounded-2xl bg-[#F8F5EE] border border-[#DECDB6] p-6 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8DCBE]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EAE0CD] border border-[#DFCEB7] flex items-center justify-center text-[#B8851B]">
              <Zap className="w-4 h-4 fill-[#D4A32A]" />
            </div>
            <div>
              <h2 className="font-editorial text-lg font-bold text-[#191713]">
                Boost This Opinion
              </h2>
              <p className="text-xs text-[#777168]">
                Help it rise to the permanent leaderboard
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

        {/* Selected Opinion Preview */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#F3ECE0] border border-[#E2D5C1]">
          <p className="text-xs text-[#777168] mb-1 font-medium">{opinion.authorName}</p>
          <p className="font-editorial text-sm italic text-[#191713] leading-snug">
            "{opinion.text}"
          </p>
          <div className="mt-2 text-[11px] text-[#8C8477] flex items-center gap-2">
            <span>Currently: <strong>{opinion.hypePoints}</strong> / 1,000 pts</span>
            <span>·</span>
            <span>{opinion.supporterCount} supporters</span>
          </div>
        </div>

        {/* User Balance Breakdown */}
        <div className="mt-4 p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DCBE] flex justify-between items-center text-xs">
          <div>
            <div className="text-[#777168]">Your Available Balance</div>
            <div className="font-semibold text-[#191713] flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-[#D4A32A] fill-[#D4A32A]" />
              <span>{balance.freeBalance} free</span>
              <span className="text-[#8C8477] font-normal">+</span>
              <span>{balance.purchasedBalance} purchased</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#777168]">Total</div>
            <div className="font-bold text-sm text-[#191713]">{totalBalance} pts</div>
          </div>
        </div>

        {/* Amount Selector */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-[#5A554D] mb-2">
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
                    ? 'bg-[#B8851B] text-white border-[#B8851B] shadow-xs scale-102'
                    : 'bg-[#FAF6EE] text-[#191713] border-[#DECDB6] hover:bg-[#EFE4D2]'
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
            className="px-4 py-2 rounded-full border border-[#DFCEB7] bg-[#FAF6EE] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors"
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
