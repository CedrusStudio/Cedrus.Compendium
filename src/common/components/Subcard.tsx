import { DataCard } from '@/common/components/cards/DataCard';
import React, { PropsWithChildren } from 'react';
import { Button } from '@/ui/button';
import { resetIcon } from '@/presentation/icons';
import { FieldInfo } from './fields';

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
  const actions = (
    <>
      <Button type="button" variant="default" size="icon" onClick={callback}>
        {resetIcon()}
      </Button>
      {button}
    </>
  );

  return (
    <DataCard 
      title={name}
      icon={childrenInfo && <FieldInfo className=''>{childrenInfo}</FieldInfo>}
      actions={actions}
      className={className}
      contentClassName='flex place-content-center place-items-center'
    >
      {children}
    </DataCard>
  );
};