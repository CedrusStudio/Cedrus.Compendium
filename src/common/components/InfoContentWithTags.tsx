import { CastTime } from '@/domain/characters/Castable';
import { getCastTimeColors } from '@/presentation/colors';
import { displayedText } from "@/presentation/translations";
import TagsView from './TagsView';

type InfoContentWithTagsProps =
{
    castable: { 
        castTime: CastTime;
        description: string;
        tags?: string[];
    }
}

export default function InfoContentWithTags({ castable }: InfoContentWithTagsProps)
{
  return (
    <div className='flex flex-col gap-2'>
        <div className='text-sm'>
            <span className='capitalize'>{displayedText.action} </span>
            <span className={`${getCastTimeColors(castable.castTime).text}`}>{castable.castTime.toLowerCase()}. </span>
            <span>{castable.description}</span>
        </div>
        <TagsView tags={castable.tags ?? []} variant="secondary" />
    </div>
  );
};