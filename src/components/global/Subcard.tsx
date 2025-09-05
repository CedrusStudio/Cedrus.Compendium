import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type SubcardProps =
{
    name: string;
    className?: string;
    innerCardContent: React.ReactNode;
}

export default function Subcard({ name, className, innerCardContent }: SubcardProps)
{
  return (
    <Card className={className}>
        <CardHeader>
          <CardTitle className='font-bold text-xl capitalize text-center text-primary'>{name}</CardTitle>
        </CardHeader>

        <CardContent className='flex items-center justify-center'>
          {innerCardContent}
        </CardContent>
    </Card>
  );
};