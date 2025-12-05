"use client";

import { Button } from '@/common/components/ui/button';
import { addIcon } from '@/common/icons';
import { DataCard, DataCardProps } from "./DataCard";
import { PropsWithChildren } from "react";

export interface EditableCardProps extends Omit<DataCardProps, 'actions'> 
{
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: React.ReactNode;
  customActions?: React.ReactNode;
}

export function EditableCard
(
  { 
    onAdd, 
    addLabel, 
    addIcon: customAddIcon,
    customActions,
    ...cardProps 
  }
  : PropsWithChildren<EditableCardProps>
) 
{
  const actions = customActions || (onAdd ? (
    <Button 
      onClick={onAdd} 
      variant="ghost" 
      size="sm"
      className="gap-2"
    >
      {customAddIcon || addIcon()}
      {addLabel && <span>{addLabel}</span>}
    </Button>
  ) : undefined);

  return <DataCard {...cardProps} actions={actions} />;
}
