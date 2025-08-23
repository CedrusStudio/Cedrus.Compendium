type FieldViewProps = 
{
  name: string;
  value: number;
};

export default function FieldView(input: FieldViewProps) 
{
  return (
    <div className={'flex gap-x-6 items-center justify-around'}>
      <div className="w-24 capitalize">{input.name}</div>
      <div className="w-8">{input.value}</div>
    </div>
  );
};
