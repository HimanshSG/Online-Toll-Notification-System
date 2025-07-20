import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faRoad,
  faUsers,
  faBell,
  faCog,
  faSignOutAlt,
  faTimes,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/logo.png';

const AdminSidebar = ({
  activeTab,
  onTabChange,
  onLogout,
  isMobile = false,
  onClose,
  darkMode = false,
  onDarkModeToggle
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
    { id: 'toll-plazas', label: 'Toll Management', icon: faRoad },
    { id: 'users', label: 'User Management', icon: faUsers },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'settings', label: 'Settings', icon: faCog },
  ];

  return (
    <aside
      className={`${
        isMobile
          ? 'fixed w-64 h-full left-0 top-0 transform transition-transform duration-300 ease-in-out z-50'
          : 'w-64 h-screen'
      } ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      } flex flex-col border-r ${
        darkMode ? 'border-white/10' : 'border-gray-300'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 flex items-center justify-between border-b ${
          darkMode ? 'border-white/10' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center">
          <img src={logo} alt="TollNotify Logo" className="h-8 mr-2" />
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={darkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-200'}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id} className="px-2">
              <Button
                variant="ghost"
                className={`w-full justify-start text-left py-2 px-4 mb-1 rounded-lg ${
                  activeTab === tab.id
                    ? darkMode
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-200 text-gray-900'
                    : darkMode
                    ? 'text-gray-300 hover:text-white hover:bg-white/5'
                    : 'text-gray-700 hover:text-black hover:bg-gray-200'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="mr-3 w-5" />
                {tab.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className={`p-4 space-y-2 border-t ${
          darkMode ? 'border-white/10' : 'border-gray-300'
        }`}
      >
        

        <Button
          variant="ghost"
          className={`w-full justify-start text-left py-2 px-4 rounded-lg ${
            darkMode
              ? 'text-gray-300 hover:text-white hover:bg-white/5'
              : 'text-gray-700 hover:text-black hover:bg-gray-200'
          }`}
          onClick={onLogout}
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
