import type { ColumnDef } from '@tanstack/react-table';
import { Monitor, Smartphone, Tablet, EllipsisVertical } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType.toLowerCase()) {
    case 'mobile':
      return <Smartphone className="size-4" />;
    case 'tablet':
      return <Tablet className="size-4" />;
    default:
      return <Monitor className="size-4" />;
  }
};

export const sessionsColumns: ColumnDef<Session>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'deviceName',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Device" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {getDeviceIcon(row.original.deviceType)}
        <span className="font-medium">{row.original.deviceName}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'deviceType',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <Badge variant="secondary" className="capitalize">
        {row.original.deviceType}
      </Badge>
    ),
  },
  {
    accessorKey: 'ipAddress',
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP Address" />,
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.ipAddress}</span>,
  },
  {
    accessorKey: 'lastUsedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Used" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.lastUsedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    ),
  },
  {
    accessorKey: 'isCurrent',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) =>
      row.original.isCurrent ? (
        <Badge variant="default">Current Session</Badge>
      ) : (
        <Badge variant="outline">Active</Badge>
      ),
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        className="text-muted-foreground flex size-8"
        size="icon"
        disabled={row.original.isCurrent}
      >
        <EllipsisVertical />
        <span className="sr-only">Open menu</span>
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
