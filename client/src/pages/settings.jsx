import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faLock, faSignOutAlt, 
  faChevronRight, faSpinner, faSave,
  faSms, faBell, faMoneyCheckAlt
} from '@fortawesome/free-solid-svg-icons';
import { getUserProfile, getUserNotifications, getNotificationSettings, updateNotificationSettings } from '@/lib/api';
import UserNavigation from '@/components/UserNavigation';
import { useDarkMode } from '../components/contexts/DarkModeContext';
import { getCurrentUser, logout } from '@/lib/auth';
import { faMoon } from '@fortawesome/free-solid-svg-icons';

const Settings = () => {
  const { darkMode, setDarkMode } = useDarkMode();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    smsAlertsEnabled: true,
    proximityAlerts: { enabled: true, sms: true },
    balanceAlerts: { enabled: true, sms: true, threshold: 200 },
    locationTracking: true
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const notifs = await getUserNotifications();
        setNotifications(notifs);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };
    loadNotifications();
  }, []);
  
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const savedSettings = await getNotificationSettings();
        setSettings({
          notificationsEnabled: savedSettings.notificationsEnabled ?? true,
          smsAlertsEnabled: savedSettings.smsAlertsEnabled ?? true,
          proximityAlerts: {
            enabled: savedSettings.proximityAlerts?.enabled ?? true,
            sms: savedSettings.proximityAlerts?.sms ?? true
          },
          balanceAlerts: {
            enabled: savedSettings.balanceAlerts?.enabled ?? true,
            sms: savedSettings.balanceAlerts?.sms ?? true,
            threshold: savedSettings.balanceAlerts?.threshold ?? 200
          },
          locationTracking: savedSettings.locationTracking ?? true
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNotificationSettings(settings);
      toast({ title: 'Success', description: 'Settings saved successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
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

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <UserNavigation notifications={notifications} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your application preferences</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Notification Settings */}
            <Card className="mb-6 dark:bg-gray-800">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">
                  <FontAwesomeIcon icon={faBell} className="mr-2" />
                  Notification Settings
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base dark:text-gray-200">Enable Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive system notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notificationsEnabled}
                      onCheckedChange={val => setSettings(s => ({ ...s, notificationsEnabled: val }))} />
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base dark:text-gray-200">Toll Proximity Alerts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get notified when approaching toll plazas
                        </p>
                      </div>
                      <Switch
                        checked={settings.proximityAlerts.enabled}
                        disabled={!settings.notificationsEnabled}
                        onCheckedChange={val => setSettings(s => ({
                          ...s,
                          proximityAlerts: { ...s.proximityAlerts, enabled: val }
                        }))} />
                    </div>

                    <div className="flex items-center justify-between pl-6">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faSms} className="text-gray-500" />
                        <Label className="text-sm dark:text-gray-300">SMS Alerts</Label>
                      </div>
                      <Switch
                        checked={settings.proximityAlerts.sms}
                        disabled={!settings.smsAlertsEnabled || !settings.proximityAlerts.enabled}
                        onCheckedChange={val => setSettings(s => ({
                          ...s,
                          proximityAlerts: { ...s.proximityAlerts, sms: val }
                        }))} />
                    </div>
                  </div>

                  <Separator className="dark:bg-gray-700" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base dark:text-gray-200">Balance Alerts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get notified when your balance is low
                        </p>
                      </div>
                      <Switch
                        checked={settings.balanceAlerts.enabled}
                        disabled={!settings.notificationsEnabled}
                        onCheckedChange={val => setSettings(s => ({
                          ...s,
                          balanceAlerts: { ...s.balanceAlerts, enabled: val }
                        }))} />
                    </div>

                    <div className="flex items-center justify-between pl-6">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faSms} className="text-gray-500" />
                        <Label className="text-sm dark:text-gray-300">SMS Alerts</Label>
                      </div>
                      <Switch
                        checked={settings.balanceAlerts.sms}
                        disabled={!settings.smsAlertsEnabled || !settings.balanceAlerts.enabled}
                        onCheckedChange={val => setSettings(s => ({
                          ...s,
                          balanceAlerts: { ...s.balanceAlerts, sms: val }
                        }))} />
                    </div>

                    <div className="pl-6">
                      <Label className="text-sm dark:text-gray-300">Alert Threshold (₹)</Label>
                      <Input
                        type="number"
                        value={settings.balanceAlerts.threshold}
                        min="100"
                        max="10000"
                        onChange={e => setSettings(s => ({
                          ...s,
                          balanceAlerts: {
                            ...s.balanceAlerts,
                            threshold: Math.max(100, Math.min(10000, Number(e.target.value)))
                          }
                        }))}
                        className="w-32 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="mb-6 dark:bg-gray-800">
  <CardContent className="p-6">
    <h2 className="text-lg font-semibold mb-4 dark:text-white">
      <FontAwesomeIcon icon={faMoon} className="mr-2" />
      Appearance
    </h2>

    <div className="flex items-center justify-between">
      <div>
        <Label className="text-base dark:text-gray-200">Dark Mode</Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Toggle between light and dark themes
        </p>
      </div>
      <Switch
        checked={darkMode}
        onCheckedChange={(val) => setDarkMode(val)}
      />
    </div>
  </CardContent>
</Card>

            {/* SMS Settings */}
            <Card className="mb-6 dark:bg-gray-800">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">
                  <FontAwesomeIcon icon={faSms} className="mr-2" />
                  SMS Settings
                </h2>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base dark:text-gray-200">Enable SMS Alerts</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive important alerts via text message
                    </p>
                  </div>
                  <Switch
                    checked={settings.smsAlertsEnabled}
                    onCheckedChange={val => setSettings(s => ({ ...s, smsAlertsEnabled: val }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setLocation('/')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Settings;