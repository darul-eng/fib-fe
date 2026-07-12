import type { AssetCondition } from '../api/client';

export const KONDISI_LABEL: Record<AssetCondition, string> = {
  baik: 'Baik',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  perbaikan: 'Dalam Perbaikan',
  dihapus: 'Dihapus',
};

export function kondisiBadgeClass(kondisi: AssetCondition): string {
  if (kondisi === 'baik') return 'bg-green-100 text-green-800';
  if (kondisi === 'rusak_ringan') return 'bg-yellow-100 text-yellow-800';
  if (kondisi === 'perbaikan') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}
