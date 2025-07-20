import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Logo from '@/components/Logo';
import axios from 'axios';

const formSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const ResetPassword = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    const stored = JSON.parse(sessionStorage.getItem('resetTarget') || '{}');

    if (!stored.userId) {  // Make sure userId is available in session
      toast({
        title: 'Missing data',
        description: 'Please go back and enter your email again.',
        variant: 'destructive',
      });
      setLocation('/forgot-password');
      return;
    }

    try {
      await axios.post('/api/auth/reset-password', {
        userId: stored.userId,  // Send userId here instead of email
        otp: values.otp,
        newPassword: values.newPassword,
      });

      toast({
        title: 'Password reset',
        description: 'Your password has been changed successfully.',
      });

      sessionStorage.removeItem('resetTarget');
      setLocation('/login');
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: 'Reset failed',
        description: error.response?.data?.error || 'Invalid OTP or expired session.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#0F172A] text-white">
      <div className="max-w-md w-full mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-white flex items-center hover:bg-white/10"
          onClick={() => setLocation('/forgot-password')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
        </Button>

        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-white mt-8">Reset Password</h1>
          <p className="text-gray-400 mt-2 text-sm">Enter the OTP and your new password.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456" 
                        className="bg-white/5 border-white/20 text-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="********" 
                        className="bg-white/5 border-white/20 text-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="********" 
                        className="bg-white/5 border-white/20 text-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white">
                Reset Password
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default ResetPassword;
