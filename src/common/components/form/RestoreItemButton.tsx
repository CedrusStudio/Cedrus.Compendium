"use client";

import { Button } from '@/ui/button';
import { displayedText } from '@/common/translations';

type RestoreItemButtonProps =
{
  onRestore: () => void;
};

export default function RestoreItemButton({ onRestore }: RestoreItemButtonProps)
{
  return (
    <Button type="button" variant="outline" size="sm" onClick={onRestore} className="capitalize">
      {displayedText.restore}
    </Button>
  );
}