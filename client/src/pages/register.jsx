import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Logo from '@/components/Logo';
import { register as registerUser } from '@/lib/auth';

const formSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  contactNumber: z.string()
    .transform(val => val.replace(/\D/g, '')) // Remove non-digits
    .refine(val => val.length === 10 || val.length === 12, {
      message: 'Must be 10 digits or 12 digits with country code'
    })
    .refine(val => {
      if (val.length === 12) return val.startsWith('91');
      return true;
    }, {
      message: 'Country code must be 91 if provided'
    }),
  vehicleNumber: z.string().min(6, 'Vehicle number must be at least 6 characters'),
  fastagId: z.string().min(8, 'FASTag ID must be at least 8 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Register = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      contactNumber: '',
      vehicleNumber: '',
      fastagId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      // Normalize contact number
      const phoneNumber = values.contactNumber.length === 10
        ? `+91${values.contactNumber}`
        : `+${values.contactNumber}`;

      const response = await registerUser({
        name: values.name,
        email: values.email,
        contactNumber: phoneNumber,
        vehicleNumber: values.vehicleNumber,
        fastagId: values.fastagId,
        password: values.password,
      });

      toast({
        title: 'Registration successful',
        description: 'Please verify your phone number to continue.',
      });

      sessionStorage.setItem('pendingVerification', JSON.stringify({
        userId: response.user.id,
        email: response.user.email,
        otp: response.otp
      }));

      setLocation('/verify-otp');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'An error occurred during registration. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="min-h-screen flex flex-col p-6 bg-[#0F172A] text-white overflow-y-auto">
      <div className="max-w-md w-full mx-auto my-8">
        <Button 
          variant="ghost" 
          className="mb-6 text-white flex items-center hover:bg-white/10"
          onClick={() => setLocation('/')}
        >
          <FontAwesomeIcon icon="arrow-left" className="mr-2" /> Back
        </Button>

        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-white mt-8">Create Account</h1>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
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
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="9876543210 or 919876543210" 
                        className="bg-white/5 border-white/20 text-white"
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          field.onChange(digitsOnly);
                        }}
                        value={field.value}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Vehicle Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="RJ02 AB 1234" 
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
                name="fastagId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">FASTag ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="34175902648" 
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
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
                Register
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-white">Already have an account?</span>
            <Button 
              variant="link" 
              className="text-[#0EA5E9] hover:text-[#0EA5E9]/80"
              onClick={() => setLocation('/login')}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
