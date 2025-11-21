"use client";

import { Checkbox } from '@/ui/checkbox';
import { ReactNode } from 'react';

type SelectableItemWrapperProps = 
{
  isSelected: boolean;
  onToggle: () => void;
  children: ReactNode;
  cannotSelect?: boolean;
};

export default function SelectableItemWrapper({ isSelected, onToggle, children, cannotSelect }: SelectableItemWrapperProps) 
{
  return (
    <div 
      className={`flex flex-row place-items-center ${cannotSelect ? 'cursor-not-allowed' : 'cursor-pointer'} transition-colors`}
      onClick={cannotSelect ? () => {} : onToggle}
    >
      <div className='m-4'>
      {
        cannotSelect ? (
            <Checkbox
              checked={true}
              style={{ backgroundColor: "#16a34a", borderColor: "#16a34a" }} // Tailwind green-600
            />
        ) : (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={onToggle}
              disabled={cannotSelect}
              onClick={e => e.stopPropagation()}
            />
        )
      }
      </div>

      <div className={`flex-1 mr-1 rounded-md ${isSelected? 'border-primary bg-primary/10' : cannotSelect ? '' : 'hover:bg-muted/50'}`}>
        {children}
      </div>
    </div>
  );
}
