import ThemeMode from "@/common/components/navbars/ThemeMode";
import { FaHome } from "react-icons/fa";
import { Shield, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/ui/button";
import Link from "next/link";
import { useAdminStatus } from '@/common/hooks/useAdminStatus';

export default function NavbarDefaultButton()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();

  return (
    <div className="flex flex-row items-center gap-2 col-span-1 justify-self-center">
        <Button asChild variant="outline" size="icon">
            <Link href="/"><FaHome className="h-[1.2rem] w-[1.2rem]" /></Link>
        </Button>
      <Button asChild variant="outline" size="icon">
        <Link href="/personalization" aria-label="Personalization"><SlidersHorizontal className="h-[1.2rem] w-[1.2rem]" /></Link>
      </Button>
      {
        isLoaded && !isCheckingAdmin && isAdmin && (
          <Button asChild variant="outline" size="icon">
            <Link href="/admin" aria-label="Admin panel"><Shield className="h-[1.2rem] w-[1.2rem]" /></Link>
          </Button>
        )
      }
        <ThemeMode />
    </div>
  );
};