import { Spinner } from '@/ui/spinner';

export default function CharacterLoading()
{
  return (
    <div role="status" aria-live="polite" className="flex min-h-48 items-center justify-center gap-3 px-4 py-10 text-muted-foreground">
      <Spinner aria-hidden="true" role="presentation" className="size-6 shrink-0" />
      <span>Ładowanie postaci…</span>
    </div>
  );
}
