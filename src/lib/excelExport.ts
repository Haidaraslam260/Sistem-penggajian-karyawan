import * as XLSX from 'xlsx';

export interface PayslipExportData {
  id: string;
  period: string;
  basicSalary: number;
  totalAllowances: number;
  overtimePay: number;
  bpjsKetenagakerjaan?: number;
  bpjsKesehatan?: number;
  pph21?: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: string;
  employee: {
    nik: string;
    name: string;
    bankAccount: string;
    ptkpStatus?: string;
    position: {
      name: string;
      department: string;
    };
  };
}

/**
 * Mengunduh Rekap Gaji Bulanan dalam format file Excel (.xlsx)
 */
export function exportPayrollToExcel(payslips: PayslipExportData[], period: string) {
  if (!payslips || payslips.length === 0) {
    alert('Tidak ada data gaji untuk diekspor.');
    return;
  }

  const rows = payslips.map((p, index) => {
    const grossSalary = p.basicSalary + p.totalAllowances + (p.overtimePay || 0);
    const attendanceDeduction = Math.max(0, (p.totalDeductions || 0) - (p.bpjsKetenagakerjaan || 0) - (p.bpjsKesehatan || 0) - (p.pph21 || 0));

    return {
      'No': index + 1,
      'NIK': p.employee.nik,
      'Nama Karyawan': p.employee.name,
      'Departemen': p.employee.position.department,
      'Jabatan': p.employee.position.name,
      'Status PTKP': p.employee.ptkpStatus || 'TK/0',
      'Gaji Pokok (Rp)': p.basicSalary,
      'Tunjangan Jabatan (Rp)': p.totalAllowances,
      'Uang Lembur (Rp)': p.overtimePay || 0,
      'Total Penghasilan (A)': grossSalary,
      'BPJS Ketenagakerjaan (Rp)': p.bpjsKetenagakerjaan || 0,
      'BPJS Kesehatan (Rp)': p.bpjsKesehatan || 0,
      'PPh 21 TER (Rp)': p.pph21 || 0,
      'Potongan Kehadiran (Rp)': attendanceDeduction,
      'Total Potongan (B)': p.totalDeductions,
      'Gaji Bersih / THP (Rp)': p.netSalary,
      'Status Pembayaran': p.paymentStatus === 'paid' ? 'Dibayar' : 'Pending',
    };
  });

  // Calculate Totals Row
  const totalBasic = payslips.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalAllowances = payslips.reduce((sum, p) => sum + p.totalAllowances, 0);
  const totalOvertime = payslips.reduce((sum, p) => sum + (p.overtimePay || 0), 0);
  const totalGross = totalBasic + totalAllowances + totalOvertime;
  const totalBpjsKet = payslips.reduce((sum, p) => sum + (p.bpjsKetenagakerjaan || 0), 0);
  const totalBpjsKes = payslips.reduce((sum, p) => sum + (p.bpjsKesehatan || 0), 0);
  const totalPph21 = payslips.reduce((sum, p) => sum + (p.pph21 || 0), 0);
  const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
  const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0);

  rows.push({
    'No': 'TOTAL',
    'NIK': '',
    'Nama Karyawan': '',
    'Departemen': '',
    'Jabatan': '',
    'Status PTKP': '',
    'Gaji Pokok (Rp)': totalBasic,
    'Tunjangan Jabatan (Rp)': totalAllowances,
    'Uang Lembur (Rp)': totalOvertime,
    'Total Penghasilan (A)': totalGross,
    'BPJS Ketenagakerjaan (Rp)': totalBpjsKet,
    'BPJS Kesehatan (Rp)': totalBpjsKes,
    'PPh 21 TER (Rp)': totalPph21,
    'Potongan Kehadiran (Rp)': Math.max(0, totalDeductions - totalBpjsKet - totalBpjsKes - totalPph21),
    'Total Potongan (B)': totalDeductions,
    'Gaji Bersih / THP (Rp)': totalNet,
    'Status Pembayaran': '',
  } as any);

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for better aesthetics
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // NIK
    { wch: 24 }, // Nama
    { wch: 20 }, // Departemen
    { wch: 22 }, // Jabatan
    { wch: 12 }, // PTKP
    { wch: 16 }, // Gaji Pokok
    { wch: 18 }, // Tunjangan
    { wch: 15 }, // Lembur
    { wch: 20 }, // Total Bruto
    { wch: 22 }, // BPJS TK
    { wch: 18 }, // BPJS Kes
    { wch: 15 }, // PPh 21
    { wch: 20 }, // Potongan Kehadiran
    { wch: 18 }, // Total Potongan
    { wch: 22 }, // Gaji Bersih
    { wch: 16 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Gaji');

  // Save File
  const filename = `Rekap_Gaji_PT_Kerjaku_Indonesia_${period}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Mengunduh Format Transfer Bank untuk Pembayaran Massal (CSV / XLSX)
 */
export function exportBankTransferFile(payslips: PayslipExportData[], period: string, formatType: 'standard' | 'bca' | 'mandiri' = 'standard') {
  if (!payslips || payslips.length === 0) {
    alert('Tidak ada data gaji untuk diekspor.');
    return;
  }

  if (formatType === 'bca') {
    // Format BCA Payroll Batch (No Rekening, Nama Karyawan, Nominal Transfer, Keterangan)
    const rows = payslips.map((p) => {
      const bankParts = p.employee.bankAccount.split('-');
      const accountNumber = bankParts.length > 1 ? bankParts[1].trim() : p.employee.bankAccount;

      return {
        'Nomor Rekening': accountNumber,
        'Nama Karyawan': p.employee.name,
        'Nominal Transfer (IDR)': p.netSalary,
        'Berita Transfer': `Gaji ${period} ${p.employee.nik}`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BCA Payroll Batch');
    XLSX.writeFile(workbook, `Transfer_Bank_BCA_Payroll_${period}.xlsx`);
    return;
  }

  if (formatType === 'mandiri') {
    // Format Mandiri MCM (Nomor Rekening, Nama Karyawan, Nominal Transfer, Bank, Catatan)
    const rows = payslips.map((p) => {
      const bankParts = p.employee.bankAccount.split('-');
      const bankName = bankParts[0]?.trim() || 'MANDIRI';
      const accountNumber = bankParts.length > 1 ? bankParts[1].trim() : p.employee.bankAccount;

      return {
        'Nomor Rekening': accountNumber,
        'Nama Penerima': p.employee.name,
        'Nominal Gaji Bersih': p.netSalary,
        'Nama Bank': bankName,
        'Keterangan': `GAJI PERIODE ${period}`,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mandiri MCM Batch');
    XLSX.writeFile(workbook, `Transfer_Bank_Mandiri_MCM_${period}.xlsx`);
    return;
  }

  // Standard CSV / Excel Format (Lengkap dengan No Rekening & Bank)
  const rows = payslips.map((p, index) => {
    const bankParts = p.employee.bankAccount.split('-');
    const bankName = bankParts[0]?.trim() || 'BANK';
    const accountNumber = bankParts.length > 1 ? bankParts[1].trim() : p.employee.bankAccount;

    return {
      'No': index + 1,
      'NIK': p.employee.nik,
      'Nama Karyawan': p.employee.name,
      'Nama Bank': bankName,
      'Nomor Rekening': accountNumber,
      'Nominal Transfer / THP (Rp)': p.netSalary,
      'Status Pembayaran': p.paymentStatus === 'paid' ? 'Dibayar' : 'Pending',
      'Catatan Transfer': `Penggajian Karyawan Periode ${period}`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // NIK
    { wch: 25 }, // Nama
    { wch: 12 }, // Bank
    { wch: 20 }, // No Rek
    { wch: 22 }, // Nominal
    { wch: 16 }, // Status
    { wch: 35 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Transfer Bank');
  XLSX.writeFile(workbook, `Data_Transfer_Bank_Gaji_${period}.xlsx`);
}
