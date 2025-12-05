import { Statistic } from "@/domain/characters/statistics/Statistic";
import { DataCard } from '@/common/components/cards/DataCard';
import StatisticView from "@/application/characters/statistics/StatisticView";
import { displayedText } from "@/presentation/translations";


type StatisticsViewProps = 
{
  title: string;
  statistics: [string, Statistic, React.ReactNode][];
};

export default function StatisticsCard({ title, statistics }: StatisticsViewProps)
{
  return (
    <DataCard 
      title={displayedText[title as keyof typeof displayedText]} 
      variant="muted"
      contentClassName="flex flex-col gap-y-3 lg:gap-y-4"
    >
      {
        statistics.map(([name, value, icon]) => <StatisticView key={name} name={name} statistic={value} icon={icon} />)
      }
    </DataCard>
  );
};