import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/AdminSidebar';
import { logout } from '@/lib/auth';
import { getAdminDashboardStats } from '@/lib/api';
import { faBars, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import DashboardTab from '@/components/AdminTabs/DashboardTab';
import TollsTab from '@/components/AdminTabs/TollsTab';
import UsersTab from '@/components/AdminTabs/UsersTab';
import NotificationsTab from '@/components/AdminTabs/NotificationsTab';
import AdminSettingsTab from '@/components/AdminTabs/AdminSettingsTab'
import { useDarkMode } from '@/components/contexts/DarkModeContext';
import logo from '@/assets/logo.png';

const AdminDashboard = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { darkMode, toggleDarkMode } = useDarkMode();


  // Load dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const dashboardStats = await getAdminDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Handle tab change from URL
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('toll-plazas')) setActiveTab('toll-plazas');
    else if (path.includes('users')) setActiveTab('users');
    else if (path.includes('notifications')) setActiveTab('notifications');
    else if (path.includes('settings')) setActiveTab('settings');
    else setActiveTab('dashboard');
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    const newPath = tab === 'dashboard' 
      ? '/admin/dashboard' 
      : `/admin/dashboard/${tab}`;
    
    window.history.pushState(null, '', newPath);
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className={`flex items-center justify-center h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <section className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        {!isMobile && (
          <AdminSidebar 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            onLogout={handleLogout}
            darkMode={darkMode}
            onDarkModeToggle={toggleDarkMode}
          />
        )}
        
        {/* Mobile Sidebar */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)}>
            <AdminSidebar 
              isMobile={true}
              onClose={() => setSidebarOpen(false)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onLogout={handleLogout}
              darkMode={darkMode}
              onDarkModeToggle={toggleDarkMode}
            />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          {isMobile && (
            <header className={`p-4 flex justify-between items-center ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-neutral-900 shadow-sm'}`}>
            <div className="flex items-center">
              <img src={logo} alt="TollNotify Logo" className="h-8 mr-2" />
              <h1 className="text-xl font-bold">TollNotify Admin</h1>
            </div>
            <div className="flex items-center gap-2">
            
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={darkMode ? 'text-white' : 'text-neutral-900'}
              >
                <FontAwesomeIcon icon={faBars} />
              </Button>
            </div>
          </header>
          
          )}

          {/* Content */}
          <div className="p-6">
            {activeTab === 'dashboard' && <DashboardTab key="dashboard" stats={stats} />}
            {activeTab === 'toll-plazas' && <TollsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'settings' && (
              <AdminSettingsTab 
                isMobile={isMobile} 
                currentTheme={darkMode ? 'dark' : 'light'}
                onThemeChange={(isDark) => toggleDarkMode()}
              />
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default AdminDashboard;