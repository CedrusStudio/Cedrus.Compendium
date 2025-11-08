"use client";

import { Checkbox } from '@/ui/checkbox';
import { ReactNode } from 'react';

type SelectableItemWrapperProps = {
  isSelected: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function SelectableItemWrapper({ isSelected, onToggle, children }: SelectableItemWrapperProps) 
{
  return (
    <div 
      className={`relative cursor-pointer transition-colors border rounded-md ${
        isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
      }`}
      onClick={onToggle}
    >
      <div className="absolute top-2 left-2 z-10">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="pl-10">
        {children}
      </div>
    </div>
  );
}
