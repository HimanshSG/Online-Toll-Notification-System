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

const formSchema = z.object({
  contactNumber: z.string().min(10, 'Contact number must be at least 10 digits'),
});

const ForgotPassword = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contactNumber: '',
    },
  });

  const onSubmit = async (values) => {
    const formattedContact = values.contactNumber.startsWith('+91')
      ? values.contactNumber
      : `+91${values.contactNumber}`;
  
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        contactNumber: formattedContact,
      });
  
      toast({ title: 'OTP sent', description: 'Check your phone for a verification code.' });
      sessionStorage.setItem('resetTarget', JSON.stringify({ userId: response.data.userId }));
      setLocation('/reset-password');
    } catch (error) {
      console.error('Reset request failed:', error);
      toast({
        title: 'Request failed',
        description: error.response?.data?.error || 'Could not send OTP.',
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
          onClick={() => setLocation('/login')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
        </Button>

        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-white mt-8">Forgot Password</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Enter your phone number to receive a verification code.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your phone number"
                        className="bg-white/5 border-white/20 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white">
                Send Verification Code
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
