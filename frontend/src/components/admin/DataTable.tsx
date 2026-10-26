import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl overflow-hidden">
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl overflow-hidden">
        <div className="p-12 text-center">
          <p className="text-[#8B8B9E]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#12121A] border border-[#2A2A38] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2A2A38]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-medium text-[#8B8B9E] uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A38]">
            {data.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-[#1A1A24] transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-[#E8E8F0]">
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
