import ThemeMode from "@/common/components/navbars/ThemeMode";
import { Button } from "@/ui/button";
import Link from "next/link";
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import { adminIcon, homeIcon, personalizationIcon, rollIcon } from '@/common/icons';
import { useOptionalDiceRoller } from '@/application/dice-roller/DiceRollerProvider';
import { diceText } from '@/application/dice-roller/DiceRollerPanel';

export default function NavbarDefaultButton()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();
  const diceRoller = useOptionalDiceRoller();

  return (
    <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
        <Button variant="outline" size="icon" aria-label={diceText.open} title={diceText.open} onClick={() => diceRoller?.open()}>{rollIcon}</Button>
        <Button asChild variant="outline" size="icon">
          <Link href="/">{homeIcon("h-[1.2rem] w-[1.2rem]")}</Link>
        </Button>
      <Button asChild variant="outline" size="icon">
        <Link href="/personalization" aria-label="Personalization">{personalizationIcon("h-[1.2rem] w-[1.2rem]")}</Link>
      </Button>
      {
        isLoaded && !isCheckingAdmin && isAdmin && (
          <Button asChild variant="outline" size="icon">
            <Link href="/admin" aria-label="Admin panel">{adminIcon("h-[1.2rem] w-[1.2rem]")}</Link>
          </Button>
        )
      }
        <ThemeMode />
    </div>
  );
};
