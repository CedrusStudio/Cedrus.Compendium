import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import WriteLines from "@/application/characters/sheet/primitives/WriteLines";

export default function NotesSection()
{
  return (
    <SheetSection title="notatki">
      <WriteLines lines={4} />
    </SheetSection>
  );
};
