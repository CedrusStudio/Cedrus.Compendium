import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import React, { PropsWithChildren } from 'react';
import { Button } from '@/ui/button';
import { resetIcon } from '@/presentation/icons';
import { FieldInfo, FieldLabel } from './fields';

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

        <CardTitle className='flex place-content-center place-items-center font-bold gap-3'>

          <FieldLabel className='text-xl'>{name}</FieldLabel>
          <FieldInfo>{childrenInfo}</FieldInfo>

          <Button type="button" variant="default" size="icon" onClick={callback}>
            {resetIcon()}
          </Button>
          {button}
        </CardTitle>

      </CardHeader>

      <CardContent className='flex place-content-center place-items-center'>
        {children}
      </CardContent>
    </Card>
  );
};