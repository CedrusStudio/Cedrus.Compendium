import { Button } from '@/ui/button';
import { languageSettings, type Language } from '@/lib/env';

const labels = {
  'pl-PL': { selected: 'Domyślna', select: 'Ustaw jako domyślną' },
  'en-US': { selected: 'Default', select: 'Set as default' },
  'fr-FR': { selected: 'Par défaut', select: 'Définir par défaut' },
  'de-DE': { selected: 'Standard', select: 'Als Standard festlegen' },
  'es-ES': { selected: 'Predeterminada', select: 'Establecer como predeterminada' },
  'it-IT': { selected: 'Predefinita', select: 'Imposta come predefinita' },
} satisfies Record<Language, { selected: string; select: string }>;

export default function DefaultCombatSetButton({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  const label = labels[languageSettings.NEXT_LANGUAGE];
  return (
    <Button type="button" variant={selected ? 'default' : 'outline'} aria-pressed={selected} onClick={onSelect} className="text-xs">
      {selected && <span aria-hidden="true">✓</span>}
      {selected ? label.selected : label.select}
    </Button>
  );
}
