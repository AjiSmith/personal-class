// Akun uji coba LOKAL saja - dipakai kalau VITE_USE_MOCK_AUTH=true di .env.
// Tidak menyentuh Supabase sama sekali, jadi bisa dipakai untuk mengetes UI
// dan RBAC (developer/secretary/teacher) sebelum backend beres disambungkan.
//
// JANGAN aktifkan mode ini di production (.env produksi harus
// VITE_USE_MOCK_AUTH=false atau dihapus).

export const MOCK_ACCOUNTS = [
  {
    id: 'mock-dev-1',
    username: 'admin',
    password: 'admin123',
    full_name: 'Wade (Developer)',
    role: 'developer',
  },
  {
    id: 'mock-sec-1',
    username: 'sekretaris',
    password: 'sekretaris123',
    full_name: 'Sekretaris Kelas',
    role: 'secretary',
  },
  {
    id: 'mock-guru-1',
    username: 'guru',
    password: 'guru123',
    full_name: 'Bu Ratna (Guru)',
    role: 'teacher',
  },
];
