import React, { useState, useMemo } from 'react';
import { SuratItem, JenisSurat, TingkatUrgensi, StatusSurat } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../context/StorageContext';
import { formatDateIndo, formatBytes } from '../../services/storageService';
import { SuratFormModal } from './SuratFormModal';
import { SuratDetailModal } from './SuratDetailModal';
import { 
  Mail, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldAlert,
  Send,
  Printer
} from 'lucide-react';

export const SuratManagementView: React.FC = () => {
  const { currentUser, isAdmin, isBidang } = useAuth();
  const { suratList, addSurat, updateSurat, deleteSurat } = useStorage();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSurat, setEditingSurat] = useState<SuratItem | null>(null);
  const [detailSurat, setDetailSurat] = useState<SuratItem | null>(null);
  const [deleteSuratTarget, setDeleteSuratTarget] = useState<SuratItem | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [jenisFilter, setJenisFilter] = useState<string>('all');
  const [urgensiFilter, setUrgensiFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Access guard: "menu manajemen surat hanya bisa di akses admin dan user tapi user bidang tidak bisa mengaksesnya"
  if (isBidang) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Akses Ditolak (Restriksi Otorisasi)</h2>
        <p className="text-xs text-slate-500 max-w-md">
          Sesuai kebijakan hak akses sistem, Menu Manajemen Surat hanya dapat diakses oleh Administrator dan User Staff. Akun User Bidang tidak diizinkan membuka menu ini.
        </p>
      </div>
    );
  }

  // Filtered letters
  const filteredSurat = useMemo(() => {
    return suratList.filter((item) => {
      // 1. Keyword search (Nomor, Perihal, Pengirim, Penerima)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.nomorSurat.toLowerCase().includes(q) ||
          item.perihal.toLowerCase().includes(q) ||
          item.pengirim.toLowerCase().includes(q) ||
          item.penerima.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Jenis filter
      if (jenisFilter !== 'all' && item.jenis !== jenisFilter) {
        return false;
      }

      // 3. Urgensi filter
      if (urgensiFilter !== 'all' && item.tingkatUrgensi !== urgensiFilter) {
        return false;
      }

      // 4. Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 5. Date filter
      if (startDate && item.tanggalSurat < startDate) {
        return false;
      }
      if (endDate && item.tanggalSurat > endDate) {
        return false;
      }

      return true;
    });
  }, [suratList, searchQuery, jenisFilter, urgensiFilter, statusFilter, startDate, endDate]);

  // Statistics
  const totalCount = suratList.length;
  const suratMasukCount = suratList.filter((s) => s.jenis === 'Surat Masuk').length;
  const suratKeluarCount = suratList.filter((s) => s.jenis === 'Surat Keluar').length;
  const urgentCount = suratList.filter((s) => s.tingkatUrgensi === 'Sangat Segera' || s.tingkatUrgensi === 'Segera').length;
  const perluDisposisiCount = suratList.filter((s) => s.status === 'Baru' || s.status === 'Didisposisi').length;

  const handleAddOrEditSubmit = async (
    data: Omit<SuratItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'creatorName'>,
    file?: File | null
  ) => {
    if (editingSurat) {
      await updateSurat(editingSurat.id, data, file);
      setEditingSurat(null);
    } else {
      await addSurat(data, file);
    }
  };

  const handleDelete = () => {
    if (!deleteSuratTarget) return;
    deleteSurat(deleteSuratTarget.id);
    setDeleteSuratTarget(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Surat',
      'Tanggal Surat',
      'Tanggal Diterima',
      'Jenis Surat',
      'Urgensi',
      'Pengirim',
      'Penerima',
      'Perihal',
      'Status',
      'Disposisi Kepada',
      'Catatan Disposisi',
      'Pengarsip',
    ];

    const rows = filteredSurat.map((s) => [
      `"${s.nomorSurat}"`,
      `"${s.tanggalSurat}"`,
      `"${s.tanggalDiterima}"`,
      `"${s.jenis}"`,
      `"${s.tingkatUrgensi}"`,
      `"${s.pengirim.replace(/"/g, '""')}"`,
      `"${s.penerima.replace(/"/g, '""')}"`,
      `"${s.perihal.replace(/"/g, '""')}"`,
      `"${s.status}"`,
      `"${(s.disposisiKepada || '').replace(/"/g, '""')}"`,
      `"${(s.catatanDisposisi || '').replace(/"/g, '""')}"`,
      `"${s.creatorName}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Arsip_Surat_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Sangat Segera':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Segera':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rahasia':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Baru':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Didisposisi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ditindaklanjuti':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Diarsipkan':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Manajemen Surat &amp; Arsip Digital
                </h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 font-mono">
                  Otoritas: Admin &amp; User
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                Pengarsipan tata naskah dinas resmi yang terintegrasi dan dapat dikategorikan berdasarkan tanggal, jenis surat, serta tingkat urgensi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
              title="Ekspor seluruh data surat ke format Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Rekap (CSV)</span>
            </button>

            <button
              onClick={() => {
                setEditingSurat(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Arsipkan Surat Baru</span>
            </button>
          </div>
        </div>

        {/* Statistical Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">Total Arsip Surat</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">{totalCount}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">Surat Masuk / Keluar</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
              {suratMasukCount} <span className="text-xs text-slate-400 font-normal">/ {suratKeluarCount}</span>
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">Urgensi Kilat / Segera</span>
            <span className="text-lg font-bold font-mono text-red-600 mt-0.5 block">{urgentCount}</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[11px] text-slate-500 block">Perlu Tindak Lanjut</span>
            <span className="text-lg font-bold font-mono text-amber-600 mt-0.5 block">{perluDisposisiCount}</span>
          </div>
        </div>
      </div>

      {/* Categorization & Filtering Toolbar */}
      <div className="px-4 sm:px-6 py-3 bg-white/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor surat, perihal, pengirim..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Categories: Jenis, Urgensi, Tanggal */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Jenis Surat */}
          <select
            value={jenisFilter}
            onChange={(e) => setJenisFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Jenis Surat</option>
            <option value="Surat Masuk">Surat Masuk</option>
            <option value="Surat Keluar">Surat Keluar</option>
            <option value="Surat Keputusan (SK)">Surat Keputusan (SK)</option>
            <option value="Surat Tugas">Surat Tugas</option>
            <option value="Nota Dinas">Nota Dinas</option>
            <option value="Undangan Resmi">Undangan Resmi</option>
            <option value="Surat Edaran">Surat Edaran</option>
          </select>

          {/* Tingkat Urgensi */}
          <select
            value={urgensiFilter}
            onChange={(e) => setUrgensiFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Urgensi</option>
            <option value="Sangat Segera">Sangat Segera (Kilat)</option>
            <option value="Segera">Segera</option>
            <option value="Biasa">Biasa</option>
            <option value="Rahasia">Rahasia</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="Baru">Baru</option>
            <option value="Didisposisi">Didisposisi</option>
            <option value="Ditindaklanjuti">Ditindaklanjuti</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>

          {/* Date Filter Range */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-[11px] bg-transparent text-slate-700 focus:outline-none"
              title="Dari Tanggal"
            />
            <span className="text-slate-400 text-[10px]">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-[11px] bg-transparent text-slate-700 focus:outline-none"
              title="Sampai Tanggal"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-slate-400 hover:text-slate-700 text-[10px] ml-1"
                title="Reset Tanggal"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Correspondence Table */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {filteredSurat.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Tidak Ada Arsip Surat yang Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Coba sesuaikan kata kunci pencarian, jenis surat, atau filter tanggal di atas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setJenisFilter('all');
                setUrgensiFilter('all');
                setStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="px-3.5 py-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-medium"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nomor &amp; Tanggal Surat</th>
                    <th className="py-3 px-4 font-semibold">Jenis / Klasifikasi</th>
                    <th className="py-3 px-4 font-semibold">Tingkat Urgensi</th>
                    <th className="py-3 px-4 font-semibold">Pengirim &amp; Penerima</th>
                    <th className="py-3 px-4 font-semibold">Perihal &amp; Ringkasan</th>
                    <th className="py-3 px-4 font-semibold">Status Alur</th>
                    <th className="py-3 px-4 font-semibold">Lampiran</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSurat.map((surat) => (
                    <tr
                      key={surat.id}
                      onClick={() => setDetailSurat(surat)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* Nomor & Tanggal */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block truncate max-w-[180px]">
                          {surat.nomorSurat}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateIndo(surat.tanggalSurat)}
                        </span>
                      </td>

                      {/* Jenis Surat */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 whitespace-nowrap block">
                          {surat.jenis}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Masuk: {formatDateIndo(surat.tanggalDiterima)}
                        </span>
                      </td>

                      {/* Tingkat Urgensi */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium whitespace-nowrap ${getUrgencyBadge(surat.tingkatUrgensi)}`}>
                          {surat.tingkatUrgensi}
                        </span>
                      </td>

                      {/* Pengirim & Penerima */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                          {surat.pengirim}
                        </span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-[160px] mt-0.5">
                          Tujuan: {surat.penerima}
                        </span>
                      </td>

                      {/* Perihal */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 block line-clamp-1 max-w-xs" title={surat.perihal}>
                          {surat.perihal}
                        </span>
                        {surat.ringkasan && (
                          <span className="text-[11px] text-slate-500 block line-clamp-1 max-w-xs mt-0.5">
                            {surat.ringkasan}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-medium uppercase whitespace-nowrap ${getStatusBadge(surat.status)}`}>
                          {surat.status}
                        </span>
                      </td>

                      {/* Lampiran */}
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailSurat(surat);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-mono truncate max-w-[100px]">
                            {surat.fileName ? surat.fileName.split('.').pop()?.toUpperCase() : 'PDF'}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setDetailSurat(surat)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Buka Lembar Disposisi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSurat(surat);
                              setIsFormOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                            title="Edit Data Surat"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteSuratTarget(surat)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                            title="Hapus Surat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FORM MODAL (Add / Edit) */}
      <SuratFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSurat(null);
        }}
        initialData={editingSurat}
        onSubmit={handleAddOrEditSubmit}
      />

      {/* DETAIL & DISPOSISI MODAL */}
      <SuratDetailModal
        surat={detailSurat}
        onClose={() => setDetailSurat(null)}
        onUpdateStatus={(newStatus, newDisposisi, newCatatan) => {
          if (detailSurat) {
            updateSurat(detailSurat.id, {
              status: newStatus,
              disposisiKepada: newDisposisi,
              catatanDisposisi: newCatatan,
            });
            setDetailSurat((prev) =>
              prev
                ? {
                    ...prev,
                    status: newStatus,
                    disposisiKepada: newDisposisi,
                    catatanDisposisi: newCatatan,
                  }
                : null
            );
          }
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteSuratTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 p-5">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-center font-bold text-slate-900 text-sm mb-1">
              Hapus Arsip Surat?
            </h3>
            <p className="text-center text-xs text-slate-500 mb-4">
              Yakin ingin menghapus arsip surat nomor <strong>"{deleteSuratTarget.nomorSurat}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteSuratTarget(null)}
                className="px-3.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm"
              >
                Ya, Hapus Arsip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
