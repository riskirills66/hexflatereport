// Utility functions for CSV generation and download

export interface TransactionCSVData {
  kode: number;
  tgl_entri: string;
  kode_produk: string;
  tujuan: string;
  harga: number;
  status: number;
  tgl_status?: string;
  sn?: string;
  poin?: number;
  saldo_awal?: number;
}

export interface MutationCSVData {
  kode: number;
  kode_reseller: string;
  tanggal: string;
  jumlah: number;
  keterangan?: string;
  saldo_akhir?: number;
}

// Convert array of objects to CSV string
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return headers.join(',') + '\n';

  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas, quotes, or newlines
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Format transaction data for CSV export
export const formatTransactionForCSV = (transaction: TransactionCSVData) => {
  const getStatusText = (status: number) => {
    switch (status) {
      case 20: return 'Berhasil';
      case 0:
      case 1:
      case 2:
      case 3:
      case 4: return 'Menunggu';
      default: return 'Gagal';
    }
  };

  return {
    'Kode Transaksi': transaction.kode,
    'Tanggal Entri': new Date(transaction.tgl_entri).toLocaleString('id-ID'),
    'Kode Produk': transaction.kode_produk,
    'Tujuan': transaction.tujuan,
    'Harga': `Rp ${transaction.harga.toLocaleString('id-ID')}`,
    'Status': getStatusText(transaction.status),
    'Tanggal Status': transaction.tgl_status ? new Date(transaction.tgl_status).toLocaleString('id-ID') : '',
    'Serial Number': transaction.sn || '',
    'Poin': transaction.poin || '',
    'Saldo Awal': transaction.saldo_awal ? `Rp ${transaction.saldo_awal.toLocaleString('id-ID')}` : ''
  };
};

// Format mutation data for CSV export
export const formatMutationForCSV = (mutation: MutationCSVData) => {
  const getTypeText = (jumlah: number) => {
    return jumlah > 0 ? 'Kredit' : 'Debit';
  };

  return {
    'Kode': mutation.kode,
    'Kode Reseller': mutation.kode_reseller,
    'Tanggal': new Date(mutation.tanggal).toLocaleString('id-ID'),
    'Jumlah': `Rp ${mutation.jumlah.toLocaleString('id-ID')}`,
    'Tipe': getTypeText(mutation.jumlah),
    'Keterangan': mutation.keterangan || '',
    'Saldo Akhir': mutation.saldo_akhir ? `Rp ${mutation.saldo_akhir.toLocaleString('id-ID')}` : ''
  };
};

// Generate filename with current date
export const generateFilename = (type: 'transactions' | 'mutations', startDate: string, endDate: string): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const startStr = startDate.replace(/-/g, '');
  const endStr = endDate.replace(/-/g, '');
  
  if (type === 'transactions') {
    return `riwayat_transaksi_${startStr}_${endStr}_${dateStr}.csv`;
  } else {
    return `mutasi_saldo_${startStr}_${endStr}_${dateStr}.csv`;
  }
};
