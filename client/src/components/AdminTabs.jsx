import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminTabs = ({ activeTab, onTabChange, children }) => {
  const tabIds = ['dashboard', 'toll-plazas', 'users', 'notifications', 'settings'];
  
  // Filter children based on the active tab
  const getActiveContent = () => {
    return React.Children.toArray(children).find(
      child => child.props.value === activeTab 
    );
  };

  const tabLabels = {
    'dashboard': 'Dashboard',
    'toll-plazas': 'Toll Plazas',
    'users': 'Users',
    'notifications': 'Notifications',
    'settings': 'Settings',
  };

  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="grid grid-cols-4 md:grid-cols-5 mb-6">
  {tabIds.map(tab => (
    <TabsTrigger 
      key={tab} 
      value={tab} 
      className={tab === 'settings' ? 'hidden md:block' : ''}
    >
      {tabLabels[tab]}
    </TabsTrigger>
  ))}
</TabsList>
  
      {getActiveContent || (
        <div className="p-4 text-red-500">Tab content not found for "{activeTab}"</div>
      )}
    </Tabs>
  );
};

export default AdminTabs;
