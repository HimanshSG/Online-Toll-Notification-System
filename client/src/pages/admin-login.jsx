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
import { loginAdmin } from '@/lib/auth';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminLogin = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      await loginAdmin({
        email: values.email,
        password: values.password,
      });
      
      toast({
        title: 'Admin login successful',
        description: 'Welcome to the TollNotify admin panel!',
      });
      
      setLocation('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid admin credentials. Please try again.',
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
          onClick={() => setLocation('/')}
        >
          <FontAwesomeIcon icon="arrow-left" className="mr-2" /> Back
        </Button>
        
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold mt-4">Admin Login</h1>
          
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Admin Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@tollnotify.com" 
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
              
              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white">
                Admin Login
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default AdminLogin;