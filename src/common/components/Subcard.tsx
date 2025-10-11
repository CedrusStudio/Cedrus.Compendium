import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/ui/card';
import React, { PropsWithChildren } from 'react';
import { RiResetLeftFill } from 'react-icons/ri';
import { Button } from '@/ui/button';
import LabelWithInfo from '@/common/components/labels/LabelWithInfo';

type SubcardProps =
{
  name: string;
  className?: string;
  callback: () => void;
  button?: React.ReactNode;
  childrenInfo?: React.ReactNode;
}

export default function Subcard({ name, className, children, callback, button, childrenInfo }: PropsWithChildren<SubcardProps>)
{
  return (
    <Card className={className}>
        <CardHeader>

          <CardTitle className='font-bold text-xl capitalize text-center text-primary flex justify-around items-center'>
            {childrenInfo ? <LabelWithInfo name={name} infoContent={childrenInfo} infoTriggerClassName='pt-1'/> : <span>{name}</span>}
            <Button type="button" variant="default" size="icon" onClick={callback}>
              { <RiResetLeftFill />}
            </Button>
            {button}
          </CardTitle>

        </CardHeader>

        <CardContent className='flex items-center justify-center'>
          {children}
        </CardContent>
    </Card>
  );
};