import React from 'react'
import { Skeleton } from './Skeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id?: string; code?: string }>({ columns, data, loading, emptyMessage = 'No data available', onRowClick }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full border border-border rounded-lg overflow-hidden bg-surface">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-bg text-muted border-b border-border">
            <tr>
              {columns.map((col, i) => <th key={i} className="px-6 py-3">{col.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full max-w-[120px]" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="w-full p-8 text-center bg-surface border border-border rounded-lg text-muted">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-surface overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-bg text-muted border-b border-border">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3" style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const key = row.id || row.code || i
            return (
              <tr 
                key={key as string} 
                className={`border-b border-border hover:bg-bg/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
