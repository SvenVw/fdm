// components/custom/farm-layouts/pagination.tsx
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
  } from "@/components/ui/pagination";
  import type { PaginationItem as PaginationItemType } from "./types";
  
  interface PaginationLayoutProps {
    items: PaginationItemType[];
    currentPath: string;
    children?: React.ReactNode;
  }
  
  export function PaginationLayout({ items, currentPath, children }: PaginationLayoutProps) {
    return (
      <div className="space-y-6">
        <Pagination>
          <PaginationContent>
            {items.map((item) => (
              <PaginationItem key={item.href}>
                <PaginationLink
                  href={item.href}
                  size="default"
                  isActive={currentPath === item.href}
                >
                  {item.title}
                </PaginationLink>
              </PaginationItem>
            ))}
          </PaginationContent>
        </Pagination>
        {children}
      </div>
    );
  }