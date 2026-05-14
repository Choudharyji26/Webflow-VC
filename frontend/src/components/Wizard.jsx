import React from 'react';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';

export function WizardProgress({ currentStep }) {
  const steps = [
    { num: 1, lbl: 'Connect' },
    { num: 2, lbl: 'Site' },
    { num: 3, lbl: 'Collection' },
    { num: 4, lbl: 'Map fields' },
    { num: 5, lbl: 'Confirm' },
  ];

  return (
    <div className="flex gap-0 mb-7">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.num;
        const isActive = currentStep === step.num;
        const isIdle = currentStep < step.num;

        return (
          <React.Fragment key={step.num}>
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border-[0.5px]",
                  isDone && "bg-tx text-bg border-tx",
                  isActive && "bg-blue text-white border-blue",
                  isIdle && "bg-s2 text-tx3 border-bd"
                )}
              >
                {isDone ? <Check size={14} /> : step.num}
              </div>
              <div
                className={clsx(
                  "text-[10px] text-center",
                  isActive ? "text-tx font-medium" : "text-tx3 font-normal"
                )}
              >
                {step.lbl}
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={clsx(
                  "flex-1 h-[0.5px] mt-3.5",
                  isDone ? "bg-tx" : "bg-bd"
                )}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
