import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  icon?: React.ReactNode;
  align?: 'left' | 'right';
}

export default function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  className, 
  buttonClassName,
  icon,
  align = 'left'
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5 glass-input rounded-xl text-sm text-white light-theme:text-text-light transition-all active:scale-[0.98]",
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-stone-500">{icon}</span>}
          {selectedOption ? (
            <span className={cn("truncate", selectedOption.color)}>{selectedOption.label}</span>
          ) : (
            <span className="text-stone-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-stone-500 transition-transform duration-300 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 z-[999] min-w-full glass rounded-2xl border border-white/10 light-theme:border-black/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200",
          align === 'right' ? 'right-0' : 'left-0'
        )}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  value === option.value 
                    ? "bg-primary/20 text-primary font-bold" 
                    : "text-stone-400 light-theme:text-stone-600 hover:bg-white/5 light-theme:hover:bg-black/5"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon}
                  <span className={cn("truncate", option.color)}>{option.label}</span>
                </div>
                {value === option.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
