import { useEffect, useState } from 'react';
import { ShieldOff, Clock, Mail } from 'lucide-react';

interface BanCardProps {
  bannedUntil: string;
  reason: string;
  hoursLeft: number;
}

export default function BanCard({ bannedUntil, reason, hoursLeft: initialHours }: BanCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(bannedUntil);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Ban expired - please refresh');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [bannedUntil]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-4 bg-[#EF4444]/20 rounded-lg">
              <ShieldOff className="w-8 h-8 text-[#EF4444]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#EF4444] mb-2">
                ACCOUNT SUSPENDED
              </h1>
              <p className="text-[#8B8B9E] text-sm">
                Your account has been temporarily suspended due to security policy violations
              </p>
            </div>
          </div>

          <div className="bg-[#12121A] border border-[#EF4444]/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 text-[#8B8B9E] mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Time Remaining</span>
            </div>
            <div className="text-3xl font-bold text-[#EF4444] font-mono">
              {timeLeft || `${initialHours.toFixed(1)} hours`}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#E8E8F0] mb-2">Reason for Suspension:</h3>
            <p className="text-sm text-[#8B8B9E] leading-relaxed">
              {reason}
            </p>
          </div>

          <div className="bg-[#1A1A24] border border-[#2A2A38] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#E8E8F0] mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-[#8B8B9E]">
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-1">•</span>
                <span>Your account will be automatically reactivated after the suspension period</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-1">•</span>
                <span>Further violations may result in longer suspensions or permanent ban</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#7C3AED] mt-1">•</span>
                <span>Review our security policies to avoid future violations</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] rounded-lg text-sm font-medium text-[#E8E8F0] transition-colors">
              <Mail className="w-4 h-4" />
              Contact Support
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-3 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2A2A38] rounded-lg text-sm font-medium text-[#8B8B9E] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
