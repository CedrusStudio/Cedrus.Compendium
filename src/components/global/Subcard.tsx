import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PropsWithChildren } from 'react';
import { RiResetLeftFill } from 'react-icons/ri';
import { Button } from '../ui/button';

type SubcardProps =
{
    name: string;
    className?: string;
    callback: () => void;
}

export default function Subcard({ name, className, children, callback }: PropsWithChildren<SubcardProps>)
{
  return (
    <Card className={className}>
        <CardHeader>

          <CardTitle className='font-bold text-xl capitalize text-center text-primary gap-2 flex justify-around items-center'>
            <span>{name}</span>
            <Button type="button" variant="default" size="icon" onClick={callback}>
              { <RiResetLeftFill />}
            </Button>
          </CardTitle>    

        </CardHeader>

        <CardContent className='flex items-center justify-center'>
          {children}
        </CardContent>
    </Card>
  );
};