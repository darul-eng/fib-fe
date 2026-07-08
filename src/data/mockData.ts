// Static mock data — mirrors REFERENSI-UI.html data structures
// Replace with API calls when backend is ready.

export const CATEGORIES = [
  { id: 'cat-1', name: 'Laptop / Komputer', fields: [
    { name: 'CPU', type: 'text', required: true },
    { name: 'RAM (GB)', type: 'number', required: true },
    { name: 'Storage', type: 'text', required: false },
    { name: 'Serial Number', type: 'text', required: true },
  ]},
  { id: 'cat-2', name: 'Mebel / Furnitur', fields: [
    { name: 'Bahan', type: 'text', required: false },
    { name: 'Ukuran', type: 'text', required: false },
  ]},
  { id: 'cat-3', name: 'Elektronik / AC', fields: [
    { name: 'PK', type: 'text', required: true },
    { name: 'Merk', type: 'text', required: true },
  ]},
  { id: 'cat-4', name: 'Kendaraan', fields: [
    { name: 'Plat Nomor', type: 'text', required: true },
    { name: 'Tahun Kendaraan', type: 'number', required: true },
  ]},
];

export const LOCATIONS = [
  { id: 'loc-1', parentId: null,    name: 'Gedung Dekanat',       type: 'Gedung' },
  { id: 'loc-2', parentId: 'loc-1', name: 'Lantai 1',             type: 'Lantai' },
  { id: 'loc-3', parentId: 'loc-2', name: 'Ruang Dekan',          type: 'Ruangan', token: 'r-dekan-123' },
  { id: 'loc-4', parentId: 'loc-2', name: 'Lobi Utama',           type: 'Ruangan', token: 'r-lobi-456' },
  { id: 'loc-5', parentId: null,    name: 'Gedung Lab Komputer',  type: 'Gedung' },
  { id: 'loc-6', parentId: 'loc-5', name: 'Lantai 2',             type: 'Lantai' },
  { id: 'loc-7', parentId: 'loc-6', name: 'Lab Programming',      type: 'Ruangan', token: 'r-lab-789' },
];

export interface Asset {
  id: string;
  kode: string;
  qr_token: string;
  nama: string;
  categoryId: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Dalam Perbaikan';
  tahun_beli: number;
  harga_beli: number;
  sumber_dana: string;
  locationId: string;
  holderName: string;
  attributes: Record<string, string>;
}

export const ASSETS_INIT: Asset[] = [
  {
    id: 'ast-1', kode: 'INV/FIB/2026/LPT-01', qr_token: 'ast-lpt-9988',
    nama: 'ThinkPad L14 Gen 3', categoryId: 'cat-1', kondisi: 'Baik',
    tahun_beli: 2024, harga_beli: 14500000, sumber_dana: 'APBN',
    locationId: 'loc-7', holderName: 'Dr. Ahmad Fauzi',
    attributes: { 'CPU': 'Ryzen 5 5625U', 'RAM (GB)': '16', 'Storage': '512GB SSD', 'Serial Number': 'PF3XYZ99' },
  },
  {
    id: 'ast-2', kode: 'INV/FIB/2026/LPT-02', qr_token: 'ast-lpt-7766',
    nama: 'MacBook Air M2', categoryId: 'cat-1', kondisi: 'Baik',
    tahun_beli: 2025, harga_beli: 18000000, sumber_dana: 'Hibah',
    locationId: 'loc-3', holderName: 'Prof. Siti Aminah',
    attributes: { 'CPU': 'Apple M2', 'RAM (GB)': '8', 'Storage': '256GB SSD', 'Serial Number': 'C02H7123' },
  },
  {
    id: 'ast-3', kode: 'INV/FIB/2025/MJA-01', qr_token: 'ast-mja-3322',
    nama: 'Meja Rapat Kayu Jati', categoryId: 'cat-2', kondisi: 'Rusak Ringan',
    tahun_beli: 2023, harga_beli: 4200000, sumber_dana: 'APBN',
    locationId: 'loc-3', holderName: '-',
    attributes: { 'Bahan': 'Kayu Jati', 'Ukuran': '200x100 cm' },
  },
  {
    id: 'ast-4', kode: 'INV/FIB/2026/AC-01', qr_token: 'ast-ac-5544',
    nama: 'AC Daikin Thailand', categoryId: 'cat-3', kondisi: 'Dalam Perbaikan',
    tahun_beli: 2025, harga_beli: 6500000, sumber_dana: 'APBN',
    locationId: 'loc-7', holderName: '-',
    attributes: { 'PK': '1.5 PK', 'Merk': 'Daikin' },
  },
];

export const CONSUMABLES_INIT = [
  { id: 'con-1', name: 'Kertas HVS A4 80gr',       stock: 45, unit: 'Rim',  minStock: 10, price: 55000 },
  { id: 'con-2', name: 'Air Minum Galon',           stock: 12, unit: 'Galon',minStock: 5,  price: 20000 },
  { id: 'con-3', name: 'Isi Staples No. 10',        stock: 3,  unit: 'Pak',  minStock: 10, price: 8000  },
  { id: 'con-4', name: 'Spidol Whiteboard Hitam',   stock: 24, unit: 'Pcs', minStock: 12, price: 12000 },
];

export const REQUESTS_INIT = [
  { id: 'req-1', item: 'Kertas HVS A4 80gr',      quantity: 5,  unit: 'Rim',  requestedBy: 'Jurusan Kimia',    date: '2026-07-06', status: 'Disetujui'  },
  { id: 'req-2', item: 'Spidol Whiteboard Hitam', quantity: 12, unit: 'Pcs', requestedBy: 'Tata Usaha Utama', date: '2026-07-07', status: 'Diserahkan' },
  { id: 'req-3', item: 'Isi Staples No. 10',      quantity: 5,  unit: 'Pak',  requestedBy: 'Jurusan Biologi',  date: '2026-07-08', status: 'Diajukan'   },
];

export const MOVEMENTS_INIT = [
  { id: 'm-1', assetId: 'ast-1', type: 'Lokasi',  from: 'Gedung Dekanat', to: 'Lab Programming', by: 'Admin Utama', date: '2026-07-01', notes: 'Alokasi lab baru' },
  { id: 'm-2', assetId: 'ast-3', type: 'Kondisi', from: 'Baik',            to: 'Rusak Ringan',    by: 'Staf TU',    date: '2026-07-05', notes: 'Engsel kendor' },
];
