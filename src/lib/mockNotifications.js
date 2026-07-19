// Data uji coba lokal untuk bell notifikasi saat VITE_USE_MOCK_AUTH=true.
// Di mode Supabase asli, data ini datang dari tabel `notifications`.
export const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Jadwal UTS Diperbarui',
    message: 'Jadwal UTS semester ini digeser ke minggu depan, cek Mata Pelajaran untuk detail.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'n2',
    title: 'Kas Kelas Bulan Ini',
    message: 'Mohon lunasi kas kelas sebelum tanggal 25.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];
