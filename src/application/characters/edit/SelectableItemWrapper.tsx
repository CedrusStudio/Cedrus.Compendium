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
      className="flex flex-row place-items-center cursor-pointer transition-colors"
      onClick={onToggle}
    >
        <div className='m-4'>
            <Checkbox 
                checked={isSelected}
                onCheckedChange={onToggle}
                onClick={e => e.stopPropagation()}
            />
        </div>
      <div className={`flex-1 mr-1 rounded-md ${isSelected ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}>
        {children}
      </div>
    </div>
  );
}
