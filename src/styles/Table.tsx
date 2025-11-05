import React from 'react';

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  variant?: 'default' | 'compact' | 'striped';
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

const Table: React.FC<TableProps> = ({
  columns,
  data,
  variant = 'default',
  onRowClick,
  emptyMessage = 'No data available'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return {
          header: 'px-3 py-2',
          cell: 'px-3 py-2 text-xs',
          row: 'hover:bg-gray-50'
        };
      case 'striped':
        return {
          header: 'px-6 py-3',
          cell: 'px-6 py-4 text-sm',
          row: 'hover:bg-gray-50 even:bg-gray-50'
        };
      default:
        return {
          header: 'px-6 py-3',
          cell: 'px-6 py-4 text-sm',
          row: 'hover:bg-gray-50'
        };
    }
  };

  const classes = getVariantClasses();

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${classes.header} ${getAlignmentClass(column.align)} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={index}
              className={`${classes.row} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${classes.cell} ${getAlignmentClass(column.align)} whitespace-nowrap`}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
