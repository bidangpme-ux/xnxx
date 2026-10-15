export type UserRole = 'admin' | 'user' | 'bidang';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  department?: string;
  createdAt: string;
}

export type StorageScope = 'private' | 'public' | 'bidang';

export type FileCategory = 'document' | 'spreadsheet' | 'presentation' | 'image' | 'archive' | 'audio' | 'video' | 'other';

export interface StorageItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  extension?: string;
  size: number; // in bytes
  mimeType?: string;
  parentId: string | null; // null represents root of current scope
  scope: StorageScope;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  bidangCategory?: string; // e.g. "Bidang PME", "Bidang Tata Ruang", etc.
  createdAt: string;
  updatedAt: string;
  dataUrl?: string; // for preview or downloaded file blob / base64
  starred?: boolean;
  tags?: string[];
  description?: string;
}

export type TipeSurat = 'masuk' | 'keluar';

export type KategoriSuratKeluar =
  | 'Surat Perintah / Surat Perintah Tugas'
  | 'Surat Keterangan'
  | 'Surat Izin'
  | 'Surat Pengantar'
  | 'Berita Acara'
  | 'Surat Perintah Perjalanan Dinas (SPPD)'
  | 'Undangan'
  | 'Pengumuman'
  | 'Laporan'
  | 'Sertifikat / Piagam';

export const KATEGORI_SURAT_KELUAR_LIST: KategoriSuratKeluar[] = [
  'Surat Perintah / Surat Perintah Tugas',
  'Surat Keterangan',
  'Surat Izin',
  'Surat Pengantar',
  'Berita Acara',
  'Surat Perintah Perjalanan Dinas (SPPD)',
  'Undangan',
  'Pengumuman',
  'Laporan',
  'Sertifikat / Piagam',
];

export type JenisSurat = 
  | 'Surat Masuk'
  | 'Surat Keluar'
  | 'Surat Keputusan (SK)'
  | 'Surat Tugas'
  | 'Nota Dinas'
  | 'Undangan Resmi'
  | 'Surat Edaran'
  | KategoriSuratKeluar;

export type TingkatUrgensi = 
  | 'Sangat Segera'
  | 'Segera'
  | 'Biasa'
  | 'Rahasia';

export type StatusSurat = 
  | 'Baru'
  | 'Didisposisi'
  | 'Ditindaklanjuti'
  | 'Diarsipkan';

export interface SuratItem {
  id: string;
  nomorSurat: string;
  tanggalSurat: string; // YYYY-MM-DD
  tanggalDiterima: string; // YYYY-MM-DD
  tipe?: TipeSurat; // 'masuk' | 'keluar'
  jenis: JenisSurat;
  kategoriKeluar?: KategoriSuratKeluar;
  tingkatUrgensi: TingkatUrgensi;
  pengirim: string;
  penerima: string;
  perihal: string;
  ringkasan: string;
  status: StatusSurat;
  disposisiKepada?: string;
  catatanDisposisi?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  fileExtension?: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

