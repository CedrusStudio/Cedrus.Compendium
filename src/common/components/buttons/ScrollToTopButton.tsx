"use client";

import { Button } from "@/common/components/ui/button";
import { Activity, useCallback, useEffect, useState } from "react";
import { FaAngleUp } from "react-icons/fa6";

export default function ScrollToTopButton() 
{
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = useCallback(() => 
  {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => 
  {
    const toggleVisibility = () => 
    {
      setIsVisible(window.scrollY > 300);
    };

    toggleVisibility();
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <Activity mode={isVisible ? "visible" : "hidden"}>
      <Button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        variant="ghost"
        className="
          group fixed bottom-8 right-8 z-999 flex size-12 items-center justify-center 
          rounded-lg bg-blue shadow-xl backdrop-blur-sm transition-all duration-300 
          hover:scale-110 hover:bg-blue-dark hover:shadow-2xl active:scale-95"
      >
        <FaAngleUp className="size-6 transition-transform duration-300 group-hover:-translate-y-1" />
      </Button>
    </Activity>
  );
}
