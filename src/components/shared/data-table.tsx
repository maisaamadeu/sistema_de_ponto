import type { ReactNode } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  id: string
  header: string
  align?: 'left' | 'right'
  className?: string
  cell: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  caption?: string
  className?: string
  onRowClick?: (row: T) => void
  selectedRowId?: string | null
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  className,
  onRowClick,
  selectedRowId,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  'h-10 border-b border-[var(--rule)] bg-transparent text-[13px] font-medium text-[var(--muted)]',
                  column.align === 'right' && 'text-right',
                  column.className,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const id = getRowId(row)
            const selected = selectedRowId === id
            return (
              <TableRow
                key={id}
                data-selected={selected || undefined}
                className={cn(
                  'h-12 border-b border-[var(--rule)]',
                  onRowClick && 'cursor-pointer',
                  selected
                    ? 'bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]'
                    : 'hover:bg-[var(--raised)]',
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                aria-pressed={onRowClick ? selected : undefined}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      'py-2 text-sm text-[var(--text)]',
                      column.align === 'right' && 'tabular text-right',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
