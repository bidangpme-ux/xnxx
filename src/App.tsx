import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StorageProvider } from './context/StorageContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveNavTab } from './components/layout/Sidebar';
import { StorageView } from './components/storage/StorageView';
import { SuratManagementView } from './components/surat/SuratManagementView';
import { AdminUserManagement } from './components/admin/AdminUserManagement';
import { NextcloudModal } from './components/nextcloud/NextcloudModal';

function MainApp() {
  const { currentUser, isBidang, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('private');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [nextcloudModalOpen, setNextcloudModalOpen] = useState(false);

  // Enforce role navigation constraints:
  // "user bidang hanya bisa melihat menu bidang"
  useEffect(() => {
    if (isBidang) {
      setActiveTab('bidang');
    } else if (activeTab === 'users' && !isAdmin) {
      setActiveTab('private');
    }
  }, [isBidang, isAdmin, activeTab]);

  if (!currentUser) {
    return <LoginView />;
  }

  const handleSelectTab = (tab: ActiveNavTab) => {
    // Role protection
    if (isBidang && tab !== 'bidang') {
      return;
    }
    if (tab === 'users' && !isAdmin) {
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar with strict role-based items */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenNextcloudModal={() => setNextcloudModalOpen(true)}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onMobileMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
          activeView={activeTab}
          onOpenNextcloudModal={() => setNextcloudModalOpen(true)}
        />

        {/* Viewport content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeTab === 'private' && <StorageView scope="private" />}
          {activeTab === 'public' && <StorageView scope="public" />}
          {activeTab === 'bidang' && <StorageView scope="bidang" />}
          {activeTab === 'surat' && <SuratManagementView />}
          {activeTab === 'users' && (
            <AdminUserManagement
              onSwitchToUserDrive={(userId) => {
                setActiveTab('private');
              }}
            />
          )}
        </main>
      </div>

      {/* Nextcloud Real Storage & Database Modal */}
      <NextcloudModal
        isOpen={nextcloudModalOpen}
        onClose={() => setNextcloudModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StorageProvider>
        <MainApp />
      </StorageProvider>
    </AuthProvider>
  );
}
