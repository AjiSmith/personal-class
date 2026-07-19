import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

// NavItem tunggal, dipakai baik oleh desktop sidebar maupun mobile drawer.
// `layoutId` bersama membuat highlight aktif meluncur mulus antar item saat
// tab berpindah, alih-alih muncul/hilang begitu saja.
function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-[18px] px-4 py-3 rounded-full font-sans font-bold text-[14px] tracking-[0.12em] transition-colors duration-150 ${
        isActive ? 'text-secondary' : 'text-on-surface-muted hover:text-secondary hover:bg-surface'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 bg-primary rounded-full"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <Icon size={16} className={`relative z-10 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
      <span className="relative z-10">{item.name}</span>
    </button>
  );
}

export function DesktopSidebar({ navigation, activeTab, setActiveTab, onSignOut }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-neutral fixed h-full z-30 border-r border-border">
      <div className="h-20 flex flex-col justify-center items-start px-[18px] border-b border-border">
        <span className="font-navbarHeading text-2xl font-black tracking-[0.08em] text-primary leading-tight">
          XI - <span className="font-black">TKJ III</span>
        </span>
        <span className="text-[12px] font-sans tracking-[0.14em] text-on-surface-muted font-semibold mt-0.5">
          Web-App Class Management
        </span>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2">
        {navigation.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-[18px] px-4 py-3 rounded-full font-sans font-bold text-[14px] tracking-[0.12em] text-on-surface-muted hover:text-primary transition-colors"
        >
          <LogOut size={16} />
          KELUAR AKUN
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar({ isOpen, onClose, navigation, activeTab, setActiveTab }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral/80 backdrop-blur-xs z-40 md:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className="fixed inset-y-0 left-0 w-64 bg-neutral z-50 p-4 flex flex-col md:hidden border-r border-border"
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
              {/* Sinkron dengan branding desktop, bukan lagi teks hardcode "VALRISE GAMING" */}
              <div className="text-left leading-tight">
                <span className="font-navbarHeading text-lg font-black tracking-[0.08em] text-primary block">
                  XI - TKJ III
                </span>
                <span className="text-[10px] font-sans tracking-[0.14em] text-on-surface-muted font-semibold">
                  Web-App Class Management
                </span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-surface text-secondary rounded-full">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                />
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
