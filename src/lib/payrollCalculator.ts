/**
 * Modul Kalkulasi Penggajian, BPJS, & PPh 21 TER
 * Berdasarkan Regulasi Resmi Indonesia (PP No. 58 Tahun 2023 & BPJS Ketenagakerjaan/Kesehatan)
 */

export interface PayrollDeductionInput {
  basicSalary: number;
  positionAllowance: number;
  overtimePay: number;
  ptkpStatus?: string; // "TK/0" | "TK/1" | "TK/2" | "TK/3" | "K/0" | "K/1" | "K/2" | "K/3"
}

export interface PayrollDeductionResult {
  jht: number; // BPJS Ketenagakerjaan JHT 2%
  jp: number;  // BPJS Ketenagakerjaan JP 1% (cap: 10.542.400)
  bpjsKetenagakerjaan: number; // jht + jp
  bpjsKesehatan: number; // BPJS Kesehatan 1% (cap: 12.000.000)
  grossSalary: number;
  terCategory: 'A' | 'B' | 'C';
  terRate: number; // e.g. 0.015 for 1.5%
  pph21: number;
  totalStatutoryDeductions: number; // bpjsKetenagakerjaan + bpjsKesehatan + pph21
}

// Maximum salary capping constants for BPJS 2024-2026
const MAX_SALARY_BPJS_JP = 10542400;
const MAX_SALARY_BPJS_KES = 12000000;

// TER Brackets PP No. 58 / 2023
// Kategori A: TK/0, TK/1, K/0
const TER_A_BRACKETS = [
  { max: 5400000, rate: 0.00 },
  { max: 5650000, rate: 0.0025 },
  { max: 5950000, rate: 0.005 },
  { max: 6300000, rate: 0.0075 },
  { max: 6750000, rate: 0.01 },
  { max: 7500000, rate: 0.0125 },
  { max: 8550000, rate: 0.015 },
  { max: 9650000, rate: 0.0175 },
  { max: 10050000, rate: 0.02 },
  { max: 10350000, rate: 0.0225 },
  { max: 10700000, rate: 0.025 },
  { max: 11050000, rate: 0.03 },
  { max: 11600000, rate: 0.035 },
  { max: 12500000, rate: 0.04 },
  { max: 13750000, rate: 0.05 },
  { max: 15100000, rate: 0.06 },
  { max: 16950000, rate: 0.07 },
  { max: 19750000, rate: 0.08 },
  { max: 24150000, rate: 0.09 },
  { max: 26450000, rate: 0.10 },
  { max: 28000000, rate: 0.11 },
  { max: 30000000, rate: 0.12 },
  { max: 32000000, rate: 0.13 },
  { max: 36000000, rate: 0.14 },
  { max: 40000000, rate: 0.15 },
  { max: Infinity, rate: 0.19 }
];

// Kategori B: TK/2, TK/3, K/1, K/2
const TER_B_BRACKETS = [
  { max: 6200000, rate: 0.00 },
  { max: 6500000, rate: 0.0025 },
  { max: 6850000, rate: 0.005 },
  { max: 7300000, rate: 0.0075 },
  { max: 9200000, rate: 0.015 },
  { max: 10750000, rate: 0.025 },
  { max: 11250000, rate: 0.03 },
  { max: 11800000, rate: 0.035 },
  { max: 12600000, rate: 0.04 },
  { max: 13600000, rate: 0.05 },
  { max: 14950000, rate: 0.06 },
  { max: 16400000, rate: 0.07 },
  { max: 18450000, rate: 0.08 },
  { max: 21850000, rate: 0.09 },
  { max: 26000000, rate: 0.10 },
  { max: 27700000, rate: 0.11 },
  { max: 29300000, rate: 0.12 },
  { max: 31400000, rate: 0.13 },
  { max: 33900000, rate: 0.14 },
  { max: 37100000, rate: 0.15 },
  { max: Infinity, rate: 0.19 }
];

// Kategori C: K/3
const TER_C_BRACKETS = [
  { max: 6600000, rate: 0.00 },
  { max: 6950000, rate: 0.0025 },
  { max: 7350000, rate: 0.005 },
  { max: 7800000, rate: 0.0075 },
  { max: 8850000, rate: 0.015 },
  { max: 9800000, rate: 0.02 },
  { max: 10950000, rate: 0.025 },
  { max: 11200000, rate: 0.03 },
  { max: 12050000, rate: 0.035 },
  { max: 12950000, rate: 0.04 },
  { max: 14150000, rate: 0.05 },
  { max: 15550000, rate: 0.06 },
  { max: 17050000, rate: 0.07 },
  { max: 19500000, rate: 0.08 },
  { max: 22700000, rate: 0.09 },
  { max: 26600000, rate: 0.10 },
  { max: 28100000, rate: 0.11 },
  { max: 30100000, rate: 0.12 },
  { max: 32600000, rate: 0.13 },
  { max: 35400000, rate: 0.14 },
  { max: Infinity, rate: 0.19 }
];

export function getTERCategory(ptkpStatus: string = 'TK/0'): 'A' | 'B' | 'C' {
  const status = ptkpStatus.toUpperCase().trim();
  if (['TK/2', 'TK/3', 'K/1', 'K/2'].includes(status)) return 'B';
  if (['K/3'].includes(status)) return 'C';
  return 'A'; // TK/0, TK/1, K/0
}

export function calculateTERRate(grossSalary: number, category: 'A' | 'B' | 'C'): number {
  const brackets = category === 'B' ? TER_B_BRACKETS : category === 'C' ? TER_C_BRACKETS : TER_A_BRACKETS;
  for (const bracket of brackets) {
    if (grossSalary <= bracket.max) {
      return bracket.rate;
    }
  }
  return 0.19;
}

export function calculatePayrollDeductions(input: PayrollDeductionInput): PayrollDeductionResult {
  const { basicSalary, positionAllowance, overtimePay, ptkpStatus = 'TK/0' } = input;
  
  // Base for BPJS is Fixed Remuneration (Gaji Pokok + Tunjangan Jabatan)
  const fixedSalary = Math.max(0, basicSalary + positionAllowance);

  // 1. BPJS Ketenagakerjaan: JHT (2%) + JP (1% capped)
  const jht = Math.round(fixedSalary * 0.02);
  const cappedJpBase = Math.min(fixedSalary, MAX_SALARY_BPJS_JP);
  const jp = Math.round(cappedJpBase * 0.01);
  const bpjsKetenagakerjaan = jht + jp;

  // 2. BPJS Kesehatan: 1% (capped)
  const cappedKesBase = Math.min(fixedSalary, MAX_SALARY_BPJS_KES);
  const bpjsKesehatan = Math.round(cappedKesBase * 0.01);

  // 3. Gross Salary for Tax
  const grossSalary = Math.max(0, basicSalary + positionAllowance + overtimePay);

  // 4. PPh 21 TER
  const terCategory = getTERCategory(ptkpStatus);
  const terRate = calculateTERRate(grossSalary, terCategory);
  const pph21 = Math.round(grossSalary * terRate);

  const totalStatutoryDeductions = bpjsKetenagakerjaan + bpjsKesehatan + pph21;

  return {
    jht,
    jp,
    bpjsKetenagakerjaan,
    bpjsKesehatan,
    grossSalary,
    terCategory,
    terRate,
    pph21,
    totalStatutoryDeductions,
  };
}
