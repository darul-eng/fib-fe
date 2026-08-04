// Cermin dari perhitungan tata letak PDF di backend (lihat qr.service.ts renderPdf)
// supaya pratinjau jumlah halaman di frontend selalu sinkron dengan hasil cetak asli.
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 24;
const GAP = 6;

export function computePrintLayout(count: number, columns: number, size: 'kecil' | 'sedang') {
  const qrSize = size === 'kecil' ? 32 : 42;
  const labelHeight = qrSize + 8;
  const cellHeight = labelHeight + GAP;
  const rowsPerPage = Math.max(1, Math.floor((PAGE_HEIGHT - PAGE_MARGIN * 2) / cellHeight));
  const perPage = columns * rowsPerPage;
  const totalPages = count > 0 ? Math.ceil(count / perPage) : 0;
  return { perPage, totalPages };
}
