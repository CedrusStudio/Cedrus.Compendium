export default function FieldsViewWrapper({ children }: React.PropsWithChildren)
{
  return (
    <div className='flex flex-col sm:flex-row place-items-center justify-between w-full gap-4'>
      {children}
    </div>
  );
};