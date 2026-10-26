import { Check, Zap } from 'lucide-react';

interface PlanCardProps {
  code: string;
  name: string;
  price: number;
  monthly_debates: number;
  billing_cycle: string;
  category: string;
  discount_percent: number;
  is_popular: boolean;
  savings_text?: string;
  features: string[];
  onSelect: () => void;
}

export default function PlanCard({
  name,
  price,
  monthly_debates,
  billing_cycle,
  is_popular,
  savings_text,
  features,
  onSelect,
}: PlanCardProps) {
  const formatPrice = () => {
    if (price === 0) return 'Free';
    if (billing_cycle === 'custom') return 'Custom';
    const suffix = billing_cycle === 'weekly' ? '/week' : billing_cycle === 'monthly' ? '/mo' : '/year';
    return `$${price.toFixed(2)}${suffix}`;
  };

  const formatRequests = () => {
    if (monthly_debates >= 999999) return 'Unlimited';
    if (monthly_debates >= 1000000) return `${(monthly_debates / 1000000).toFixed(1)}M`;
    if (monthly_debates >= 1000) return `${(monthly_debates / 1000).toFixed(0)}K`;
    return monthly_debates.toString();
  };

  return (
    <div
      className={`relative bg-[#12121A] rounded-xl p-6 transition-all ${
        is_popular
          ? 'border-2 border-[#7C3AED] ring-2 ring-[#7C3AED]/20'
          : 'border border-[#2A2A38] hover:border-[#7C3AED]/50'
      }`}
    >
      {is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#7C3AED] to-[#D946EF] rounded-full text-white text-xs font-medium flex items-center gap-1">
          <Zap className="w-3 h-3" />
          MOST POPULAR
        </div>
      )}

      {savings_text && !is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#10B981] rounded-full text-white text-xs font-medium">
          {savings_text}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-[#E8E8F0] mb-2">{name}</h3>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-[#E8E8F0]">
            {price === 0 ? 'Free' : billing_cycle === 'custom' ? 'Custom' : `$${price}`}
          </span>
          {price > 0 && billing_cycle !== 'custom' && (
            <span className="text-[#8B8B9E] text-sm">
              /{billing_cycle === 'weekly' ? 'wk' : billing_cycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          )}
        </div>
        <p className="text-sm text-[#8B8B9E]">
          {formatRequests()} requests
          {billing_cycle === 'weekly' ? '/week' : billing_cycle === 'yearly' ? '/year' : '/month'}
        </p>
      </div>

      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-all mb-6 ${
          is_popular
            ? 'bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white hover:opacity-90'
            : 'bg-[#1A1A24] text-[#E8E8F0] border border-[#2A2A38] hover:border-[#7C3AED]/50'
        }`}
      >
        {price === 0 ? 'Start Free' : billing_cycle === 'custom' ? 'Contact Sales' : 'Get Started'}
      </button>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-[#8B8B9E]">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
