import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faSpinner, 
  faEdit,
  faCheck,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { getUserProfile, updateUserProfile, getUserNotifications } from '@/lib/api';
import UserNavigation from '@/components/UserNavigation';
import { logout } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Enhanced form schema with better validation
const profileFormSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name cannot exceed 50 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' }),
  contactNumber: z.string()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .max(15, { message: 'Phone number cannot exceed 15 digits' })
    .regex(/^[0-9]+$/, { message: 'Phone number can only contain digits' }),
  vehicleNumber: z.string()
    .min(5, { message: 'Vehicle number must be at least 5 characters' })
    .max(15, { message: 'Vehicle number cannot exceed 15 characters' }),
});

const Profile = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserProfile();
        setUserData(data);
        form.reset({
          name: data.name || '',
          email: data.email || '',
          contactNumber: data.contactNumber || '',
          vehicleNumber: data.vehicleNumber || '',
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const data = await getUserNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUserData();
    fetchNotifications();
  }, [toast, form]);

  const handleSubmit = async (data) => {
    try {
      const updatedProfile = await updateUserProfile(data);
      setUserData(updatedProfile);
      setIsEditing(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error?.response?.data?.message || 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    form.reset({
      name: userData?.name || '',
      email: userData?.email || '',
      contactNumber: userData?.contactNumber || '',
      vehicleNumber: userData?.vehicleNumber || '',
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <UserNavigation notifications={notifications} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-center h-[80vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <UserNavigation notifications={notifications} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">My Profile</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your account information</p>
          </div>
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="gap-1"
            >
              <FontAwesomeIcon icon={faEdit} size="sm" />
              <span>Edit Profile</span>
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        error={form.formState.errors.name?.message}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        {...form.register('email')}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          {...form.register('contactNumber')}
                          type="tel"
                          error={form.formState.errors.contactNumber?.message}
                        />
                        {form.formState.errors.contactNumber && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.contactNumber.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                        <Input
                          id="vehicleNumber"
                          {...form.register('vehicleNumber')}
                          autoCapitalize="characters"
                          error={form.formState.errors.vehicleNumber?.message}
                        />
                        {form.formState.errors.vehicleNumber && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.vehicleNumber.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancel}
                        className="gap-1"
                      >
                        <FontAwesomeIcon icon={faTimes} size="sm" />
                        <span>Cancel</span>
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!form.formState.isDirty || form.formState.isSubmitting}
                        className="gap-1"
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin size="sm" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faSave} size="sm" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <p className="text-base">{userData?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <p className="text-base">{userData?.email}</p>
                    </div>
                    <div>
                      <Label>Contact Number</Label>
                      <p className="text-base">{userData?.contactNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>Vehicle Number</Label>
                      <p className="text-base">{userData?.vehicleNumber || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FASTag Info */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>FASTag Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>FASTag ID</Label>
                    <p className="text-base font-mono">
                      {userData?.fastagId || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label>Verification Status</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {userData?.isVerified ? (
                        <Badge variant="success" className="gap-1">
                          <FontAwesomeIcon icon={faCheck} size="xs" />
                          <span>Verified</span>
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <span>Pending Verification</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Account Created</Label>
                    <p className="text-base">
                      {new Date(userData?.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;