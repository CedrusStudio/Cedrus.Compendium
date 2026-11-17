import { Statistic } from "@/domain/characters/statistics/Statistic";
import { DataCard } from '@/common/components/cards/DataCard';
import StatisticView from "@/application/characters/statistics/StatisticView";


type StatisticsViewProps = 
{
  title: string;
  statistics: [string, Statistic, React.ReactNode][];
};

export default function StatisticsCard({ title, statistics }: StatisticsViewProps)
{
  return (
    <DataCard 
      title={title}
      variant="muted"
      headerClassName="px-4"
      contentClassName="flex flex-col gap-y-3 px-4 lg:gap-y-4"
    >
      {
        statistics.map(([name, value, icon]) => <StatisticView key={name} name={name} statistic={value} icon={icon} />)
      }
    </DataCard>
  );
};
