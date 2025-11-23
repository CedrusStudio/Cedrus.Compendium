import ImportedBadge from '@/common/components/labels/ImportedBadge';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { UseFieldArrayRemove } from 'react-hook-form';

type ItemViewFromEditListProps = 
{
  itemViewFields: React.ReactNode;
  itemEditSheet: React.ReactNode;
  remove: UseFieldArrayRemove;
  index: number;
  isImported: boolean;
};

export default function ItemViewFromEditList({ itemViewFields, itemEditSheet, index, isImported, remove }: ItemViewFromEditListProps)
{
  return (
    <div className="flex flex-col md:flex-row text-center md:text-left justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        {itemViewFields}
      </div>
      <div className="flex justify-end items-center gap-3">
        <RemoveFromArrayButton remove={remove} index={index} />
        <ImportedBadge isImported={isImported} />
        {!isImported && itemEditSheet}
      </div>
    </div>
  );
};