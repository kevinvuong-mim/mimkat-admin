'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDataTableInstance } from '@/hooks/use-data-table-instance';
import { getSessions } from '@/services/sessions';

import { sessionsColumns } from './_components/columns';

export default function SessionsPage() {
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
  });

  const table = useDataTableInstance({
    data: sessionsData?.items || [],
    columns: sessionsColumns,
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Login Sessions</CardTitle>
          <CardDescription>
            Manage and monitor all active login sessions for your account.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm">
                <Download />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-md border">
                {/* Table Header */}
                <div className="bg-muted/50 border-b p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-9 w-12" />
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-8" />
                  </div>
                </div>
                {/* Table Rows */}
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-12" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border">
                <DataTable table={table} columns={sessionsColumns} />
              </div>
              <DataTablePagination table={table} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
