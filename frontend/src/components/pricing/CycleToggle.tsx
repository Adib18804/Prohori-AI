interface CycleToggleProps {
  active: string;
  onChange: (cycle: string) => void;
}

export default function CycleToggle({ active, onChange }: CycleToggleProps) {
  const cycles = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly', badge: 'Save 38%' },
  ];

  return (
    <div className="inline-flex items-center gap-2 p-1 bg-[#12121A] border border-[#2A2A38] rounded-lg">
      {cycles.map((cycle) => (
        <button
          key={cycle.value}
          onClick={() => onChange(cycle.value)}
          className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all ${
            active === cycle.value
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#D946EF] text-white'
              : 'text-[#8B8B9E] hover:text-[#E8E8F0]'
          }`}
        >
          {cycle.label}
          {cycle.badge && active !== cycle.value && (
            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-[#10B981] text-white text-[10px] font-medium rounded">
              {cycle.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
