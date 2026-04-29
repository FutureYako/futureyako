import { CheckIcon } from "@/components/icons";

type StepperProps = {
  steps: string[];
  current: number;
  showLabels?: boolean;
};

export default function Stepper({ steps, current, showLabels = true }: StepperProps) {
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between mb-4">
        {steps.map((label, i) => {
          const status = i < current ? "done" : i === current ? "active" : "pending";
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  status === "done"
                    ? "bg-brand-500 text-white"
                    : status === "active"
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {status === "done" ? <CheckIcon size={12} /> : i + 1}
              </div>
              {showLabels && (
                <span
                  className={`text-[10px] ${
                    status === "active" ? "text-brand-500 font-bold" : "text-slate-400"
                  }`}
                >
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
