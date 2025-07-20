import React from 'react';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const UserTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`relative flex-1 h-full flex flex-col items-center justify-center gap-1 rounded-none transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-primary dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {activeTab === tab.id && (
              <span className="absolute top-0 h-1 w-8 bg-primary dark:bg-primary-400 rounded-b-md" />
            )}
            <FontAwesomeIcon
              icon={tab.icon}
              className={`text-xl transition-transform duration-200 ${
                activeTab === tab.id ? 'scale-110' : 'scale-100'
              }`}
            />
            <span className="text-xs font-medium">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default UserTabs;