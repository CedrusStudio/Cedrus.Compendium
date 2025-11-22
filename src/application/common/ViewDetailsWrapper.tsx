export default function ViewDetailsWrapper({ children }: React.PropsWithChildren)
{
  return (
    <div className='flex flex-col sm:flex-row place-items-center gap-1 sm:gap-3'>
      {children}
    </div>
  );
};