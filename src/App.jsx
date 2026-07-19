import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ClipboardList,
  Wallet,
  BookOpen,
  ShieldCheck,
  ListChecks,
  BellRing,
} from 'lucide-react';

import { AuthProvider, useAuth, can } from './lib/AuthContext';
import { DesktopSidebar, MobileSidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { Login } from './views/Login';
import { DashboardHome } from './views/DashboardHome';
import { StudentsList } from './views/StudentsList';
import { AttendanceTracker } from './views/AttendanceTracker';
import { AttendanceRecap } from './views/AttendanceRecap';
import { ClassFunds } from './views/ClassFunds';
import { SubjectsManagement } from './views/SubjectsManagement';
import { GradeManagement } from './views/GradeManagement';
import { UserManagement } from './views/UserManagement';
import { NotificationsCenter } from './views/NotificationsCenter';

// Setiap item punya `permission`; item hanya muncul di sidebar jika role
// pengguna lolos check `can(role, permission)` dari AuthContext.
const ALL_NAVIGATION = [
  { id: 'dashboard', name: 'DASHBOARD', icon: LayoutDashboard, permission: 'dashboard.view', view: DashboardHome },
  { id: 'students', name: 'DATA SISWA', icon: Users, permission: 'students.manage', view: StudentsList },
  { id: 'attendance', name: 'ABSENSI HARIAN', icon: CalendarCheck, permission: 'attendance.manage', view: AttendanceTracker },
  { id: 'attendance-recap', name: 'REKAP ABSENSI', icon: ListChecks, permission: 'attendance.manage', view: AttendanceRecap },
  { id: 'classfunds', name: 'KAS KELAS', icon: Wallet, permission: 'classfunds.manage', view: ClassFunds },
  { id: 'subjects', name: 'MATA PELAJARAN', icon: BookOpen, permission: 'subjects.manage', view: SubjectsManagement },
  { id: 'grades', name: 'TUGAS & NILAI', icon: ClipboardList, permission: 'grades.manage.own', view: GradeManagement },
  { id: 'users', name: 'PENGGUNA', icon: ShieldCheck, permission: 'users.manage', view: UserManagement },
  { id: 'notifications', name: 'NOTIFIKASI', icon: BellRing, permission: 'notifications.manage', view: NotificationsCenter },
];

function Shell() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = ALL_NAVIGATION.filter((item) => can(profile?.role, item.permission));
  const ActiveView = navigation.find((item) => item.id === activeTab)?.view ?? DashboardHome;
  const title = navigation.find((item) => item.id === activeTab)?.name ?? 'DASHBOARD';

  return (
    <div className="min-h-screen bg-neutral text-secondary flex font-sans antialiased selection:bg-primary selection:text-secondary">
      <DesktopSidebar
        navigation={navigation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={signOut}
      />
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        navigation={navigation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex flex-col md:pl-64 min-w-0 bg-neutral">
        <Header title={title} onOpenMobileMenu={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-[40px] overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto"
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center text-on-surface-muted font-sans">
        Memuat...
      </div>
    );
  }
  return session ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
