"use client";

import { Button } from "@/common/components/ui/button";
import { arrowDownIcon, arrowUpIcon } from "@/common/icons";
import { useState } from "react";

type SortDirectionButtonProps =
{
  sideEffect: (paramValue: "asc" | "desc") => void;
}

export default function SortDirectionButton({ sideEffect }: SortDirectionButtonProps)
{
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  return (
    <Button
        variant="outline"
        size='icon'
        onClick={() => {
            const newDirection = sortDirection === "asc" ? "desc" : "asc";
            setSortDirection(newDirection);
            sideEffect(newDirection);
        }}
    >
        { sortDirection === "desc" ? arrowDownIcon : arrowUpIcon }
    </Button>
  );
};