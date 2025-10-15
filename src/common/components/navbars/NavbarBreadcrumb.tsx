import React from "react";

import { Breadcrumb,  BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/ui/breadcrumb";
import { useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { isValid } from 'ulid';
import { displayedText } from "@/presentation/translations";

export default function NavbarBreadcrumb({ pathname }: { pathname: string })
{
  const characterShortNameMapping = useSelector((state: RootState) => state.character.characterShortNameMapping);
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="col-span-2 pl-20">
        <BreadcrumbList>

            <BreadcrumbItem>
                <BreadcrumbLink href="/">start</BreadcrumbLink>
            </BreadcrumbItem>
        
            {
                segments.map((segment, index) => 
                {
                    const href = "/" + segments.slice(0, index + 1).join("/");
                    const isLast = index === segments.length - 1;
                    
                    if (isValid(segment) && characterShortNameMapping[segment])
                        segment = characterShortNameMapping[segment];

                    return (
                        <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                            {
                                isLast 
                                    ? <BreadcrumbPage>{displayedText[segment as keyof typeof displayedText]}</BreadcrumbPage> 
                                    : <BreadcrumbLink href={href}>{displayedText[segment as keyof typeof displayedText]}</BreadcrumbLink>
                            }
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })
            }

        </BreadcrumbList>
    </Breadcrumb>
  );
};