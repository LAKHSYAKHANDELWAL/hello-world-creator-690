import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, User, Bell, Palette, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SettingsPageProps {
  userType: 'student' | 'teacher';
}

const SettingsPage = ({ userType }: SettingsPageProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>({});
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'en'
  });


  useEffect(() => {
    // Load user data from localStorage
    const stored = localStorage.getItem(`${userType}-profile`);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser({});
      }
    }

    // Load settings from localStorage
    const storedSettings = localStorage.getItem(`${userType}-settings`);
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch {
        // Keep default settings
      }
    }
  }, [userType]);

  // Apply dark mode to <html> element
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Optionally reload or show a message when language changes
  useEffect(() => {
    // You can integrate i18n here
    // For now, just log or show a message
    // alert(`Language changed to: ${settings.language}`);
  }, [settings.language]);


  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(`${userType}-settings`, JSON.stringify(newSettings));
  };

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg('Please fill all fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }

    // Get current user from Supabase
    let email = user.email;
    if (!email) {
      const { data: userData } = await supabase.auth.getUser();
      email = userData?.user?.email || '';
    }
    if (!email) {
      setPasswordMsg('User email not found.');
      return;
    }

    // Re-authenticate user by signing in with old password
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: oldPassword });
    if (signInError) {
      setPasswordMsg('Old password is incorrect.');
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg('Failed to change password: ' + error.message);
    } else {
      setPasswordMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="grid gap-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={user.name 
                      ? `https://api.dicebear.com/8.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
                      : undefined}
                    alt={user.name || 'User'}
                  />
                  <AvatarFallback>
                    {user.name ? user.name.charAt(0).toUpperCase() : userType.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {user.name || `${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
                  </h3>
                  <p className="text-muted-foreground">
                    {userType === 'student' && user.className 
                      ? `${user.className}${user.section ? ` - ${user.section}` : ''}`
                      : userType === 'teacher' && user.subject
                      ? user.subject
                      : `${userType.charAt(0).toUpperCase() + userType.slice(1)} User`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for announcements and updates
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting('notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Toggle between light and dark theme
                  </p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">Language Preference</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your preferred language for the interface
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={settings.language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('language', 'en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={settings.language === 'hi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('language', 'hi')}
                  >
                    Hindi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleChangePassword}>
                <div>
                  <label className="block text-sm font-medium mb-1">Old Password</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="mt-2">Change Password</Button>
                {passwordMsg && (
                  <p className="text-sm text-red-500 mt-1">{passwordMsg}</p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
