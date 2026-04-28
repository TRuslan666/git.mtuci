import { Check } from "lucide-react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange?: () => void;
  className?: string;
}

export function CustomCheckbox({ checked, onChange, className = "" }: CustomCheckboxProps) {
  return (
    <div
      onClick={onChange}
      className={`
        w-[18px] h-[18px] rounded-[4px] cursor-pointer transition-all duration-200 ease-in-out
        flex items-center justify-center shrink-0
        ${checked
          ? "bg-gradient-to-r from-blue-600 to-violet-600 border-transparent"
          : "bg-[#1e1e1e] border border-[#3f3f46] hover:border-[#52525b]"
        }
        ${className}
      `}
    >
      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    </div>
  );
}

export default CustomCheckbox;
