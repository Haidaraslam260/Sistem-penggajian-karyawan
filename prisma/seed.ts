import { db as prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import { calculatePayrollDeductions } from '../src/lib/payrollCalculator';

async function main() {
  console.log('Cleaning up existing database records...');
  await prisma.payslip.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.deduction.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.overtime.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();

  console.log('Creating Manufacturing Master Positions...');
  const positionsData = [
    {
        "name": "Owner / Direktur",
        "department": "Executive",
        "basicSalary": 15000000,
        "positionAllowance": 5000000
    },
    {
        "name": "Manajer Produksi Pabrik",
        "department": "Produksi Barang",
        "basicSalary": 12000000,
        "positionAllowance": 3000000
    },
    {
        "name": "Supervisor Produksi",
        "department": "Produksi Barang",
        "basicSalary": 9500000,
        "positionAllowance": 1800000
    },
    {
        "name": "Teknisi Moulding & Casting",
        "department": "Produksi Barang",
        "basicSalary": 6500000,
        "positionAllowance": 1000000
    },
    {
        "name": "Operator Mesin Produksi",
        "department": "Produksi Barang",
        "basicSalary": 5500000,
        "positionAllowance": 900000
    },
    {
        "name": "Operator Assembly & Lini Produksi",
        "department": "Produksi Barang",
        "basicSalary": 5000000,
        "positionAllowance": 750000
    },
    {
        "name": "Manajer Quality Control",
        "department": "Quality Control (QC)",
        "basicSalary": 11000000,
        "positionAllowance": 2200000
    },
    {
        "name": "Supervisor QC",
        "department": "Quality Control (QC)",
        "basicSalary": 8500000,
        "positionAllowance": 1500000
    },
    {
        "name": "Inspector Quality Assurance",
        "department": "Quality Control (QC)",
        "basicSalary": 5800000,
        "positionAllowance": 950000
    },
    {
        "name": "Laboran Pengujian Mutu",
        "department": "Quality Control (QC)",
        "basicSalary": 5500000,
        "positionAllowance": 900000
    },
    {
        "name": "Manajer Gudang & Logistik",
        "department": "Logistik & Gudang",
        "basicSalary": 10500000,
        "positionAllowance": 2000000
    },
    {
        "name": "Supervisor Logistik",
        "department": "Logistik & Gudang",
        "basicSalary": 8000000,
        "positionAllowance": 1400000
    },
    {
        "name": "Staff Pergudangan & Barang Jadi",
        "department": "Logistik & Gudang",
        "basicSalary": 5200000,
        "positionAllowance": 850000
    },
    {
        "name": "Operator Forklift & Material",
        "department": "Logistik & Gudang",
        "basicSalary": 5000000,
        "positionAllowance": 800000
    },
    {
        "name": "Manajer Maintenance Teknik",
        "department": "Maintenance & Utility",
        "basicSalary": 11500000,
        "positionAllowance": 2500000
    },
    {
        "name": "Teknisi Otomasi & Listrik Pabrik",
        "department": "Maintenance & Utility",
        "basicSalary": 8500000,
        "positionAllowance": 1500000
    },
    {
        "name": "Teknisi Mekanik Mesin",
        "department": "Maintenance & Utility",
        "basicSalary": 6000000,
        "positionAllowance": 1000000
    },
    {
        "name": "Supervisor K3 & Lingkungan",
        "department": "HSE & Keselamatan Kerja",
        "basicSalary": 8500000,
        "positionAllowance": 1500000
    },
    {
        "name": "Officer K3 Keselamatan Kerja",
        "department": "HSE & Keselamatan Kerja",
        "basicSalary": 6000000,
        "positionAllowance": 1000000
    }
];

  const createdPositions: Record<string, { id: string; basicSalary: number; positionAllowance: number }> = {};
  for (const pos of positionsData) {
    const created = await prisma.position.create({ data: pos });
    createdPositions[pos.name] = { id: created.id, basicSalary: created.basicSalary, positionAllowance: created.positionAllowance };
  }

  const rawEmployeesData = [
    {
        "nik": "EXE-001",
        "pass": "Owner#EXE-001",
        "name": "Owner Budi",
        "email": "owner@perusahaan.com",
        "role": "owner",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 1234567890",
        "pos": "Owner / Direktur",
        "date": "2020-01-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-001",
        "pass": "Rizky#PRD-001",
        "name": "Rizky Pratama",
        "email": "rizky.pratama@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 2233445566",
        "pos": "Manajer Produksi Pabrik",
        "date": "2021-05-20",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-002",
        "pass": "Nadiem#PRD-002",
        "name": "Nadiem Makarim",
        "email": "nadiem.m@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 5050505050",
        "pos": "Manajer Produksi Pabrik",
        "date": "2021-04-15",
        "ptkp": "K/3"
    },
    {
        "nik": "PRD-003",
        "pass": "Ahmad#PRD-003",
        "name": "Ahmad Fauzi",
        "email": "ahmad.fauzi@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 4455667788",
        "pos": "Supervisor Produksi",
        "date": "2022-01-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-004",
        "pass": "Mahfud#PRD-004",
        "name": "Mahfud MD",
        "email": "mahfud.md@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 8080808080",
        "pos": "Supervisor Produksi",
        "date": "2021-12-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-005",
        "pass": "Ahmad#PRD-005",
        "name": "Ahmad Sahroni",
        "email": "ahmad.sahroni@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 6789678967",
        "pos": "Supervisor Produksi",
        "date": "2022-04-01",
        "ptkp": "TK/1"
    },
    {
        "nik": "PRD-006",
        "pass": "Ahmad#PRD-006",
        "name": "Ahmad Dhani",
        "email": "ahmad.dhani@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 9090101020",
        "pos": "Supervisor Produksi",
        "date": "2022-02-10",
        "ptkp": "K/3"
    },
    {
        "nik": "PRD-007",
        "pass": "Hendra#PRD-007",
        "name": "Hendra Kurniawan",
        "email": "hendra.kurniawan@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 6677889900",
        "pos": "Teknisi Moulding & Casting",
        "date": "2022-06-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-008",
        "pass": "Anies#PRD-008",
        "name": "Anies Baswedan",
        "email": "anies.baswedan@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 1111222233",
        "pos": "Teknisi Moulding & Casting",
        "date": "2022-08-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-009",
        "pass": "Charles#PRD-009",
        "name": "Charles Honoris",
        "email": "charles.h@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 4567456745",
        "pos": "Teknisi Moulding & Casting",
        "date": "2022-09-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-010",
        "pass": "Once#PRD-010",
        "name": "Once Mekel",
        "email": "once.mekel@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 1122331122",
        "pos": "Teknisi Moulding & Casting",
        "date": "2022-05-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-011",
        "pass": "Adi#PRD-011",
        "name": "Adi Nugroho",
        "email": "adi.nugroho@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 8899001122",
        "pos": "Operator Mesin Produksi",
        "date": "2022-09-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-012",
        "pass": "Ganjar#PRD-012",
        "name": "Ganjar Pranowo",
        "email": "ganjar.pranowo@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 2222333344",
        "pos": "Operator Mesin Produksi",
        "date": "2022-10-10",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-013",
        "pass": "Edhie#PRD-013",
        "name": "Edhie Baskoro",
        "email": "ibas.yudhoyono@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 2345678901",
        "pos": "Operator Mesin Produksi",
        "date": "2022-10-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-014",
        "pass": "Tommy#PRD-014",
        "name": "Tommy Kurniawan",
        "email": "tommy.k@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 1010202030",
        "pos": "Operator Mesin Produksi",
        "date": "2023-02-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-015",
        "pass": "Karyawan#PRD-015",
        "name": "Karyawan Joko",
        "email": "joko@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 9876543210",
        "pos": "Operator Mesin Produksi",
        "date": "2022-03-15",
        "ptkp": "K/0"
    },
    {
        "nik": "PRD-016",
        "pass": "Agus#PRD-016",
        "name": "Agus Harimurti",
        "email": "agus.yudhoyono@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 6666777788",
        "pos": "Operator Mesin Produksi",
        "date": "2023-01-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-017",
        "pass": "Basuki#PRD-017",
        "name": "Basuki Tjahaja",
        "email": "ahok.btp@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 2323232323",
        "pos": "Operator Mesin Produksi",
        "date": "2022-02-01",
        "ptkp": "K/3"
    },
    {
        "nik": "PRD-018",
        "pass": "Bambang#PRD-018",
        "name": "Bambang Soesatyo",
        "email": "bamsoet@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 7878787878",
        "pos": "Operator Mesin Produksi",
        "date": "2022-06-15",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-019",
        "pass": "Saan#PRD-019",
        "name": "Saan Mustopa",
        "email": "saan.mustopa@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 3456345634",
        "pos": "Operator Mesin Produksi",
        "date": "2023-05-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-020",
        "pass": "Habiburokhman#PRD-020",
        "name": "Habiburokhman",
        "email": "habiburokhman@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 0123012301",
        "pos": "Operator Mesin Produksi",
        "date": "2023-01-10",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-021",
        "pass": "Bobby#PRD-021",
        "name": "Bobby Adhityo",
        "email": "bobby.adhityo@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 7890123456",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-02-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-022",
        "pass": "Yandri#PRD-022",
        "name": "Yandri Susanto",
        "email": "yandri.s@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 3344334433",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-01-05",
        "ptkp": "TK/1"
    },
    {
        "nik": "PRD-023",
        "pass": "Verrell#PRD-023",
        "name": "Verrell Bramasta",
        "email": "verrell.b@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BNI - 9900990099",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-08-20",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-024",
        "pass": "Marcel#PRD-024",
        "name": "Marcel Siahaan",
        "email": "marcel.s@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 3344553344",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-01-15",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-025",
        "pass": "Bambang#PRD-025",
        "name": "Bambang Trihatmodjo",
        "email": "bambang.tri@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BNI - 7897897897",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-09-20",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-026",
        "pass": "Agung#PRD-026",
        "name": "Agung Hercules",
        "email": "agung.hercules@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BNI - 6677889955",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-06-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-027",
        "pass": "Muhaimin#PRD-027",
        "name": "Muhaimin Iskandar",
        "email": "muhaimin.i@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 8888999900",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-04-15",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-028",
        "pass": "Sufmi#PRD-028",
        "name": "Sufmi Dasco",
        "email": "dasco.sufmi@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 8989898989",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-03-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-029",
        "pass": "Herman#PRD-029",
        "name": "Herman Khaeron",
        "email": "herman.k@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BRI - 3456789012",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-08-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-030",
        "pass": "Eko#PRD-030",
        "name": "Eko Patrio",
        "email": "eko.patrio@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 6677667766",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-05-20",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-031",
        "pass": "Sigit#PRD-031",
        "name": "Sigit Purnomo",
        "email": "sigit.p@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "Mandiri - 4455664455",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-03-20",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-001",
        "pass": "Eka#QCA-001",
        "name": "Eka Putri",
        "email": "eka.putri@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BRI - 7788990011",
        "pos": "Manajer Quality Control",
        "date": "2021-11-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-002",
        "pass": "Luhut#QCA-002",
        "name": "Luhut Binsar",
        "email": "luhut.b@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 7070707070",
        "pos": "Manajer Quality Control",
        "date": "2020-05-01",
        "ptkp": "K/3"
    },
    {
        "nik": "QCA-003",
        "pass": "Farhan#QCA-003",
        "name": "Farhan",
        "email": "farhan@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 8899008899",
        "pos": "Supervisor QC",
        "date": "2022-01-10",
        "ptkp": "K/1"
    },
    {
        "nik": "QCA-004",
        "pass": "Karyawan#QCA-004",
        "name": "Karyawan Ani",
        "email": "ani@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Kontrak",
        "bank": "BRI - 1122334455",
        "pos": "Inspector Quality Assurance",
        "date": "2023-01-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-005",
        "pass": "Khofifah#QCA-005",
        "name": "Khofifah Indar",
        "email": "khofifah.i@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BRI - 5555666677",
        "pos": "Inspector Quality Assurance",
        "date": "2023-02-15",
        "ptkp": "TK/1"
    },
    {
        "nik": "QCA-006",
        "pass": "Djarot#QCA-006",
        "name": "Djarot Saiful",
        "email": "djarot.saiful@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 3434343434",
        "pos": "Inspector Quality Assurance",
        "date": "2023-07-01",
        "ptkp": "K/2"
    },
    {
        "nik": "QCA-007",
        "pass": "Hetifah#QCA-007",
        "name": "Hetifah Sjaifudian",
        "email": "hetifah.s@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 7890789078",
        "pos": "Inspector Quality Assurance",
        "date": "2023-06-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-008",
        "pass": "Nurul#QCA-008",
        "name": "Nurul Arifin",
        "email": "nurul.arifin@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 5678901234",
        "pos": "Inspector Quality Assurance",
        "date": "2023-04-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-009",
        "pass": "Nurhayati#QCA-009",
        "name": "Nurhayati Ali",
        "email": "nurhayati.ali@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 1122112211",
        "pos": "Laboran Pengujian Mutu",
        "date": "2023-08-01",
        "ptkp": "TK/1"
    },
    {
        "nik": "QCA-010",
        "pass": "Arzeti#QCA-010",
        "name": "Arzeti Bilbina",
        "email": "arzeti.b@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BRI - 2020303040",
        "pos": "Laboran Pengujian Mutu",
        "date": "2023-04-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "QCA-011",
        "pass": "Ramzi#QCA-011",
        "name": "Ramzi",
        "email": "ramzi@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 9900119900",
        "pos": "Laboran Pengujian Mutu",
        "date": "2023-02-01",
        "ptkp": "K/1"
    },
    {
        "nik": "LOG-001",
        "pass": "Siti#LOG-001",
        "name": "Siti Nurhaliza",
        "email": "siti.nurhaliza@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BNI - 3344556677",
        "pos": "Manajer Gudang & Logistik",
        "date": "2021-08-01",
        "ptkp": "K/0"
    },
    {
        "nik": "LOG-002",
        "pass": "Sri#LOG-002",
        "name": "Sri Mulyani",
        "email": "sri.mulyani@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 1010101010",
        "pos": "Manajer Gudang & Logistik",
        "date": "2021-01-15",
        "ptkp": "K/2"
    },
    {
        "nik": "LOG-003",
        "pass": "Nagita#LOG-003",
        "name": "Nagita Slavina",
        "email": "nagita.s@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 6786786786",
        "pos": "Supervisor Logistik",
        "date": "2021-11-01",
        "ptkp": "K/1"
    },
    {
        "nik": "LOG-004",
        "pass": "Fitri#LOG-004",
        "name": "Fitri Carlina",
        "email": "fitri.carlina@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 5566778844",
        "pos": "Staff Pergudangan & Barang Jadi",
        "date": "2023-03-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "LOG-005",
        "pass": "Puan#LOG-005",
        "name": "Puan Maharani",
        "email": "puan.maharani@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 7777888899",
        "pos": "Staff Pergudangan & Barang Jadi",
        "date": "2023-03-10",
        "ptkp": "TK/1"
    },
    {
        "nik": "LOG-006",
        "pass": "Fauzi#LOG-006",
        "name": "Fauzi Bowo",
        "email": "fauzi.bowo@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 5656565656",
        "pos": "Staff Pergudangan & Barang Jadi",
        "date": "2023-01-20",
        "ptkp": "K/1"
    },
    {
        "nik": "LOG-007",
        "pass": "Lestari#LOG-007",
        "name": "Lestari Moerdijat",
        "email": "lestari.m@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 2345234523",
        "pos": "Staff Pergudangan & Barang Jadi",
        "date": "2023-07-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "LOG-008",
        "pass": "Puteri#LOG-008",
        "name": "Puteri Komarudin",
        "email": "puteri.k@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 8901234567",
        "pos": "Operator Forklift & Material",
        "date": "2023-05-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "LOG-009",
        "pass": "Rachel#LOG-009",
        "name": "Rachel Maryam",
        "email": "rachel.m@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 3030404050",
        "pos": "Operator Forklift & Material",
        "date": "2023-05-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "LOG-010",
        "pass": "Sultan#LOG-010",
        "name": "Sultan Djorghi",
        "email": "sultan.d@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 1231231231",
        "pos": "Operator Forklift & Material",
        "date": "2023-04-01",
        "ptkp": "K/1"
    },
    {
        "nik": "MNT-001",
        "pass": "Maya#MNT-001",
        "name": "Maya Indah",
        "email": "maya.indah@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 5566778899",
        "pos": "Manajer Maintenance Teknik",
        "date": "2022-04-10",
        "ptkp": "K/0"
    },
    {
        "nik": "MNT-002",
        "pass": "Gibran#MNT-002",
        "name": "Gibran Rakabuming",
        "email": "gibran.r@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 3030303030",
        "pos": "Manajer Maintenance Teknik",
        "date": "2022-02-10",
        "ptkp": "K/2"
    },
    {
        "nik": "MNT-003",
        "pass": "Rina#MNT-003",
        "name": "Rina Melati",
        "email": "rina.melati@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 9900112233",
        "pos": "Teknisi Otomasi & Listrik Pabrik",
        "date": "2023-02-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "MNT-004",
        "pass": "Ridwan#MNT-004",
        "name": "Ridwan Kamil",
        "email": "ridwan.kamil@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 9090909090",
        "pos": "Teknisi Otomasi & Listrik Pabrik",
        "date": "2022-05-15",
        "ptkp": "K/1"
    },
    {
        "nik": "MNT-005",
        "pass": "Adies#MNT-005",
        "name": "Adies Kadir",
        "email": "adies.kadir@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 9012901290",
        "pos": "Teknisi Mekanik Mesin",
        "date": "2023-02-20",
        "ptkp": "TK/0"
    },
    {
        "nik": "MNT-006",
        "pass": "Meutya#MNT-006",
        "name": "Meutya Hafid",
        "email": "meutya.hafid@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 4567890123",
        "pos": "Teknisi Mekanik Mesin",
        "date": "2023-01-25",
        "ptkp": "TK/0"
    },
    {
        "nik": "MNT-007",
        "pass": "Primus#MNT-007",
        "name": "Primus Yustisio",
        "email": "primus.y@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 5566556655",
        "pos": "Teknisi Mekanik Mesin",
        "date": "2023-04-15",
        "ptkp": "K/2"
    },
    {
        "nik": "MNT-008",
        "pass": "Melly#MNT-008",
        "name": "Melly Goeslaw",
        "email": "melly.g@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 2233442233",
        "pos": "Teknisi Mekanik Mesin",
        "date": "2022-08-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "HSE-001",
        "pass": "Dian#HSE-001",
        "name": "Dian Sastrowardoyo",
        "email": "dian.sastro@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 1122334400",
        "pos": "Supervisor K3 & Lingkungan",
        "date": "2022-07-15",
        "ptkp": "K/0"
    },
    {
        "nik": "HSE-002",
        "pass": "Kaesang#HSE-002",
        "name": "Kaesang Pangarep",
        "email": "kaesang.p@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 4040404040",
        "pos": "Supervisor K3 & Lingkungan",
        "date": "2022-03-01",
        "ptkp": "K/1"
    },
    {
        "nik": "HSE-003",
        "pass": "Krisdayanti#HSE-003",
        "name": "Krisdayanti",
        "email": "krisdayanti@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BNI - 5050606070",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2022-03-15",
        "ptkp": "K/2"
    },
    {
        "nik": "HSE-004",
        "pass": "Bayu#HSE-004",
        "name": "Bayu Skak",
        "email": "bayu.skak@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "CIMB - 4455667733",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-05-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "HSE-005",
        "pass": "Sandiaga#HSE-005",
        "name": "Sandiaga Uno",
        "email": "sandiaga.uno@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 4444555566",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2022-11-01",
        "ptkp": "K/3"
    },
    {
        "nik": "HSE-006",
        "pass": "Ahmad#HSE-006",
        "name": "Ahmad Muzani",
        "email": "ahmad.muzani@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 9090121234",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-04-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "HSE-007",
        "pass": "Dede#HSE-007",
        "name": "Dede Yusuf",
        "email": "dede.yusuf@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 8901890189",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-03-15",
        "ptkp": "K/1"
    },
    {
        "nik": "HSE-008",
        "pass": "Desy#HSE-008",
        "name": "Desy Ratnasari",
        "email": "desy.ratnasari@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "BCA - 4455445544",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-03-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "HSE-009",
        "pass": "Mulan#HSE-009",
        "name": "Mulan Jameela",
        "email": "mulan.jameela@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Kontrak",
        "bank": "BRI - 6060707080",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-06-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "HSE-010",
        "pass": "Vicky#HSE-010",
        "name": "Vicky Prasetyo",
        "email": "vicky.p@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BNI - 3453453453",
        "pos": "Officer K3 Keselamatan Kerja",
        "date": "2023-08-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-032",
        "pass": "Bambang#PRD-032",
        "name": "Bambang Pamungkas",
        "email": "bambang.pamungkas@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 0011223344",
        "pos": "Supervisor Produksi",
        "date": "2022-05-10",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-033",
        "pass": "Erick#PRD-033",
        "name": "Erick Thohir",
        "email": "erick.t@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 6060606060",
        "pos": "Supervisor Produksi",
        "date": "2021-09-01",
        "ptkp": "K/3"
    },
    {
        "nik": "PRD-034",
        "pass": "Pasha#PRD-034",
        "name": "Pasha Ungu",
        "email": "pasha.ungu@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "CIMB - 7070808090",
        "pos": "Supervisor Produksi",
        "date": "2022-07-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-035",
        "pass": "Raffi#PRD-035",
        "name": "Raffi Ahmad",
        "email": "raffi.ahmad@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 5675675675",
        "pos": "Supervisor Produksi",
        "date": "2021-10-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-036",
        "pass": "Irfan#PRD-036",
        "name": "Irfan Bachdim",
        "email": "irfan.bachdim@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BRI - 2233445511",
        "pos": "Operator Mesin Produksi",
        "date": "2023-04-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-037",
        "pass": "Prabowo#PRD-037",
        "name": "Prabowo Subianto",
        "email": "prabowo.s@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 3333444455",
        "pos": "Operator Mesin Produksi",
        "date": "2021-07-01",
        "ptkp": "K/0"
    },
    {
        "nik": "PRD-038",
        "pass": "Said#PRD-038",
        "name": "Said Abdullah",
        "email": "said.abdullah@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "Mandiri - 1234123412",
        "pos": "Operator Mesin Produksi",
        "date": "2022-11-15",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-039",
        "pass": "Dyah#PRD-039",
        "name": "Dyah Roro",
        "email": "dyah.roro@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 9012345678",
        "pos": "Operator Mesin Produksi",
        "date": "2023-06-20",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-040",
        "pass": "Uya#PRD-040",
        "name": "Uya Kuya",
        "email": "uya.kuya@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BCA - 7788778877",
        "pos": "Operator Mesin Produksi",
        "date": "2023-06-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-041",
        "pass": "Giring#PRD-041",
        "name": "Giring Ganesha",
        "email": "giring.g@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BCA - 8080909010",
        "pos": "Operator Mesin Produksi",
        "date": "2023-07-20",
        "ptkp": "TK/1"
    },
    {
        "nik": "PRD-042",
        "pass": "Megawati#PRD-042",
        "name": "Megawati Sukarno",
        "email": "megawati.s@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 3344556622",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2021-03-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-043",
        "pass": "Tri#PRD-043",
        "name": "Tri Rismaharini",
        "email": "tri.risma@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Tetap",
        "bank": "Mandiri - 2020202020",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2021-06-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-044",
        "pass": "Rano#PRD-044",
        "name": "Rano Karno",
        "email": "rano.karno@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 4040505060",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2022-01-20",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-045",
        "pass": "Hengky#PRD-045",
        "name": "Hengky Kurniawan",
        "email": "hengky.k@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BNI - 7788997788",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2022-04-15",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-046",
        "pass": "Gita#PRD-046",
        "name": "Gita Gutawa",
        "email": "gita.gutawa@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Kontrak",
        "bank": "BRI - 7788990066",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-07-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-047",
        "pass": "Zulkifli#PRD-047",
        "name": "Zulkifli Hasan",
        "email": "zulkifli.h@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BRI - 9999000011",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-05-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-048",
        "pass": "Sutiyoso#PRD-048",
        "name": "Sutiyoso",
        "email": "sutiyoso@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 4545454545",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2022-12-01",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-049",
        "pass": "Cucun#PRD-049",
        "name": "Cucun Ahmad",
        "email": "cucun.ahmad@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BRI - 5678567856",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-09-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-050",
        "pass": "Dave#PRD-050",
        "name": "Dave Laksono",
        "email": "dave.laksono@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "CIMB - 6789012345",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-09-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-051",
        "pass": "Netty#PRD-051",
        "name": "Netty Prasetiyani",
        "email": "netty.p@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Kontrak",
        "bank": "BNI - 2233223322",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-09-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-052",
        "pass": "Chicha#PRD-052",
        "name": "Chicha Koeswoyo",
        "email": "chicha.k@perusahaan.com",
        "role": "employee",
        "gender": "Perempuan",
        "status": "Kontrak",
        "bank": "BCA - 5566775566",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-05-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-053",
        "pass": "Narji#PRD-053",
        "name": "Narji",
        "email": "narji@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BCA - 2342342342",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-07-01",
        "ptkp": "TK/1"
    },
    {
        "nik": "PRD-054",
        "pass": "Doni#PRD-054",
        "name": "Doni Monardo",
        "email": "doni.monardo@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "Mandiri - 8899001177",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-08-01",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-055",
        "pass": "Yusril#PRD-055",
        "name": "Yusril Ihza",
        "email": "yusril.ihza@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BCA - 1212121212",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-06-10",
        "ptkp": "K/2"
    },
    {
        "nik": "PRD-056",
        "pass": "Triyono#PRD-056",
        "name": "Triyono",
        "email": "triyono@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "BRI - 6767676767",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-08-15",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-057",
        "pass": "Ace#PRD-057",
        "name": "Ace Hasan",
        "email": "ace.hasan@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Tetap",
        "bank": "BRI - 0123456789",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-07-01",
        "ptkp": "K/1"
    },
    {
        "nik": "PRD-058",
        "pass": "Denny#PRD-058",
        "name": "Denny Cagur",
        "email": "denny.cagur@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "Mandiri - 8899889988",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-07-10",
        "ptkp": "TK/1"
    },
    {
        "nik": "PRD-059",
        "pass": "Lucky#PRD-059",
        "name": "Lucky Hakim",
        "email": "lucky.hakim@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "CIMB - 6677886677",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-06-10",
        "ptkp": "TK/0"
    },
    {
        "nik": "PRD-060",
        "pass": "Aldi#PRD-060",
        "name": "Aldi Taher",
        "email": "aldi.taher@perusahaan.com",
        "role": "employee",
        "gender": "Laki-laki",
        "status": "Kontrak",
        "bank": "Mandiri - 4564564564",
        "pos": "Operator Assembly & Lini Produksi",
        "date": "2023-08-15",
        "ptkp": "TK/1"
    }
];

  console.log(`Seeding ${rawEmployeesData.length} unique manufacturing employees with PTKP status and BPJS/PPh 21 TER calculations...`);

  const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  for (const emp of rawEmployeesData) {
    const posMeta = createdPositions[emp.pos] || Object.values(createdPositions)[0];
    const passwordHash = await bcrypt.hash(emp.pass, 10);

    const createdEmp = await prisma.employee.create({
      data: {
        nik: emp.nik,
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: emp.role as any,
        bankAccount: emp.bank,
        entryDate: new Date(emp.date),
        gender: emp.gender,
        status: emp.status,
        ptkpStatus: emp.ptkp || 'TK/0',
        positionId: posMeta.id,
      },
    });

    if (emp.role === 'employee') {
      const basicSalary = posMeta.basicSalary;
      const positionAllowance = posMeta.positionAllowance;
      const overtimePay = 0;

      const statutory = calculatePayrollDeductions({
        basicSalary,
        positionAllowance,
        overtimePay,
        ptkpStatus: emp.ptkp || 'TK/0',
      });

      const totalDeductions = statutory.bpjsKetenagakerjaan + statutory.bpjsKesehatan + statutory.pph21;
      const netSalary = Math.max(0, basicSalary + positionAllowance - totalDeductions);

      await prisma.payslip.create({
        data: {
          employeeId: createdEmp.id,
          period: currentPeriod,
          basicSalary,
          totalAllowances: positionAllowance,
          overtimePay,
          bpjsKetenagakerjaan: statutory.bpjsKetenagakerjaan,
          bpjsKesehatan: statutory.bpjsKesehatan,
          pph21: statutory.pph21,
          totalDeductions,
          netSalary,
          paymentStatus: 'paid',
        },
      });
    }
  }

  console.log('✅ Successfully seeded 100 unique manufacturing employees and payslips with BPJS & PPh 21 TER!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Done
  });
