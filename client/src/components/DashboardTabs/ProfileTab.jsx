import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faEdit, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/api';

// Form schema
const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
  vehicleNumber: z.string().min(5, 'Vehicle number must be at least 5 characters'),
});

const ProfileTab = ({ userData, onUpdateSuccess }) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData?.name || '',
      email: userData?.email || '',
      contactNumber: userData?.contactNumber || '',
      vehicleNumber: userData?.vehicleNumber || '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const updatedProfile = await updateUserProfile(data);

      if (onUpdateSuccess) {
        onUpdateSuccess(updatedProfile);
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully!',
        duration: 3000, // Toast visible for 3 seconds
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error?.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Personal Information</CardTitle>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <FontAwesomeIcon icon={faEdit} className="mr-1" />
                  Edit
                </Button>                
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} disabled className="bg-gray-50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Vehicle registration number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
      Saving...
    </>
  ) : 'Save Changes'}
</Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p>{userData?.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p>{userData?.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                    <p>{userData?.contactNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Vehicle Number</h3>
                    <p>{userData?.vehicleNumber}</p>
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
                  <h3 className="text-sm font-medium text-gray-500">FASTag ID</h3>
                  <p>{userData?.fastagId || 'Not assigned'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Verification Status</h3>
                  <div className="flex items-center mt-1">
                    {userData?.isVerified ? (
                      <>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Verified</span>
                        <FontAwesomeIcon icon="check" className="ml-1 text-green-500" />
                      </>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pending</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Created</h3>
                  <p>{new Date(userData?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
