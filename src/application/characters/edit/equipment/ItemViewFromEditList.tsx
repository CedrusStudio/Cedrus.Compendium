import ImportedBadge from '@/common/components/labels/ImportedBadge';
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import RestoreItemButton from '@/common/components/form/RestoreItemButton';

type ItemViewFromEditListProps =
{
  itemViewFields: React.ReactNode;
  itemEditSheet: React.ReactNode;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function ItemViewFromEditList({ itemViewFields, itemEditSheet, isImported, isRemoved = false, onRemove, onRestore }: ItemViewFromEditListProps)
{
  return (
    <div className="flex flex-col md:flex-row text-center md:text-left justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        {itemViewFields}
      </div>
      <div className="flex justify-end items-center gap-3">
        {isRemoved ? <RemovedBadge /> : <ImportedBadge isImported={isImported} />}
        {isRemoved ? <RestoreItemButton onRestore={onRestore ?? (() => {})} /> : <RemoveFromArrayButton onRemove={onRemove} />}
        {!isRemoved && !isImported && itemEditSheet}
      </div>
    </div>
  );
};
