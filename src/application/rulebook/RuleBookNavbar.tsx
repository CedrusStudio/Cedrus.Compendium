"use client";

import NavbarBreadcrumb from "@/common/components/navbars/NavbarBreadcrumb";
import NavbarDefaultButton from "@/common/components/navbars/NavbarDefaultButton";
import { usePathname } from "next/navigation";
import { RulebookSearchCommand } from "@/application/rulebook/RulebookSearchCommand";
import { Button } from "@/ui/button";
import { Search } from "lucide-react";
import { displayedText } from "@/common/translations";

export default function RuleBookNavbar()
{
  const pathname = usePathname();

  const handleSearchClick = () => 
  {
    // Trigger Ctrl+K event to open the command palette
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  return (
      <nav className="flex items-center justify-between py-4 lg:px-10 gap-2 lg:gap-3">
        
        <div className="hidden sm:block">
          <NavbarBreadcrumb pathname={pathname} />
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleSearchClick}
            className="gap-3"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Szukaj</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">{displayedText.searchShortcut}</span>
            </kbd>
          </Button>
          
          <NavbarDefaultButton />
        </div>

        <RulebookSearchCommand />
      </nav>
  );
};