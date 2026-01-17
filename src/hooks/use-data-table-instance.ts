import * as React from 'react';

import {
  useReactTable,
  type ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  getFacetedRowModel,
  getFilteredRowModel,
  type VisibilityState,
  getPaginationRowModel,
  getFacetedUniqueValues,
  type ColumnFiltersState,
} from '@tanstack/react-table';

type UseDataTableInstanceProps<TData, TValue> = {
  data: TData[];
  defaultPageSize?: number;
  defaultPageIndex?: number;
  enableRowSelection?: boolean;
  columns: ColumnDef<TData, TValue>[];
  getRowId?: (row: TData, index: number) => string;
};

export function useDataTableInstance<TData, TValue>({
  data,
  columns,
  getRowId,
  defaultPageSize,
  defaultPageIndex,
  enableRowSelection = true,
}: UseDataTableInstanceProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: defaultPageIndex ?? 0,
    pageSize: defaultPageSize ?? 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFacetedRowModel: getFacetedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: getRowId ?? ((row) => (row as any).id.toString()),
  });

  return table;
}
