"use client";

import { Checkbox } from '@/ui/checkbox';
import { ReactNode } from 'react';
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import { cn } from '@/lib/utils';

export type SelectableItemState = 'available' | 'selected' | 'owned' | 'removed';

type SelectableItemWrapperProps = 
{
  isSelected: boolean;
  onToggle: () => void;
  children: ReactNode;
  cannotSelect?: boolean;
  state?: SelectableItemState;
};

export default function SelectableItemWrapper({ isSelected, onToggle, children, cannotSelect, state }: SelectableItemWrapperProps) 
{
  const selectionState = state ?? (cannotSelect ? 'owned' : isSelected ? 'selected' : 'available');
  const isOwned = selectionState === 'owned';
  const isRemoved = selectionState === 'removed';
  const isChecked = selectionState === 'selected' || isOwned;

  return (
    <div 
      className='flex flex-row place-items-center cursor-pointer transition-colors'
      onClick={onToggle}
    >
      <div className='m-4'>
        <Checkbox 
          checked={isChecked}
          onCheckedChange={onToggle}
          onClick={e => e.stopPropagation()}
          className={cn(
            isRemoved && 'border-destructive/60 text-destructive shadow-none',
          )}
          style={isOwned ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : undefined}
        />
      </div>

      <div
        className={cn(
          'flex-1 mr-1 overflow-hidden rounded-md border transition-all',
          isRemoved
            ? 'border-dashed border-destructive/40 bg-gradient-to-r from-destructive/10 via-destructive/5 to-background shadow-sm'
            : isSelected
              ? 'border-primary bg-primary/10'
              : 'border-transparent hover:bg-muted/50'
        )}
      >
        {
          isRemoved && (
            <div className='flex items-center gap-2 border-b border-destructive/15 bg-destructive/8 px-3 py-2'>
              <span className='size-2 rounded-full bg-destructive/80 shadow-sm' />
              <RemovedBadge className='ml-0 shadow-sm' />
            </div>
          )
        }

        <div className={cn(isRemoved && 'opacity-85')}>
          {children}
        </div>
      </div>
    </div>
  );
}
