import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoon, faSun,
} from '@fortawesome/free-solid-svg-icons';
import { useDarkMode } from '../contexts/DarkModeContext.jsx';

const AdminSettingsTab = ({ isMobile }) => {
  const { toast } = useToast();
  const { darkMode, setDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState({
    notifications: {
      systemAlerts: true,
      userReports: true,
      maintenance: true,
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: 30,
      loginAttempts: 5,
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: 30,
    },
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 5,
      showCharts: true,
    }
  });

  // Load darkMode from localStorage
  useEffect(() => {
    const storedDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode);
    }
  }, [setDarkMode]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const savedSettings = JSON.parse(localStorage.getItem('adminSettings')) || {};
        setSettings(prev => deepMerge(prev, savedSettings));
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings. Using default values.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [toast]);

  const deepMerge = (target, source) => {
    const output = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
    return output;
  };

  const handleSettingChange = (path, value) => {
    const [category, key] = path.split('.');
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${isMobile ? '' : 'pl-8'}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-dark dark:text-white">Admin Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure system preferences and security settings</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Settings */}
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FontAwesomeIcon icon={darkMode ? faMoon : faSun} className="mr-2" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="darkMode" className="dark:text-gray-200">Dark Mode</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark theme
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                  aria-label="Toggle dark mode"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettingsTab;
