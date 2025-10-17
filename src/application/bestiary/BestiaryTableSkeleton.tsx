import { Skeleton } from "@/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";

export default function BestiaryTableSkeleton()
{
  const skeletonRows = 4;
  const skeletonColumns = 4;

  return (
    <div>
      <div className="flex items-center py-4 gap-3">
        <Skeleton className="h-10 w-90" />
        <Skeleton className="h-10 w-30" />
        <Skeleton className="h-10 w-14" />
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: skeletonColumns }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
          {
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: skeletonColumns }).map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          }
          </TableBody>
        </Table>
      </div>

      <div className="mt-2">
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}