import React from "react";
import { translate } from "@/domain/data/translations";
import { Breadcrumb,  BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/ui/breadcrumb";

export default function NavbarBreadcrumb({ pathname }: { pathname: string })
{
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
                    
                    return (
                        <React.Fragment key={index}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                            {
                                isLast 
                                    ? <BreadcrumbPage>{translate(segment)}</BreadcrumbPage> 
                                    : <BreadcrumbLink href={href}>{translate(segment)}</BreadcrumbLink>
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