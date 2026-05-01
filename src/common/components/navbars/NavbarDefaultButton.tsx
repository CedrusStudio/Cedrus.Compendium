import ThemeMode from "@/common/components/navbars/ThemeMode";
import { Button } from "@/ui/button";
import Link from "next/link";
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import { adminIcon, homeIcon, personalizationIcon } from '@/common/icons';

export default function NavbarDefaultButton()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();

  return (
    <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
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