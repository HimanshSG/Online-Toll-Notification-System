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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Logo from '@/components/Logo';
import { login } from '@/lib/auth';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

const Login = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (values) => {
    try {
      await login({
        email: values.email,
        password: values.password,
      });
      
      toast({
        title: 'Login successful',
        description: 'Welcome back to TollNotify!',
      });
      
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again.',
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
  <h1 className="text-2xl font-bold text-white mt-8">User Login</h1>
</div>

        
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email Address</FormLabel>
                    <FormControl>
                      <Input 
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
              
              <div className="flex justify-between items-center">
                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          className="border-white/50 data-[state=checked]:bg-[#0EA5E9] data-[state=checked]:border-[#0EA5E9]"
                        />
                      </FormControl>
                      <FormLabel className="text-sm cursor-pointer text-white">Remember me</FormLabel>
                    </FormItem>
                  )}
                />
               <Button
  variant="link"
  className="text-[#0EA5E9] hover:text-[#0EA5E9]/80 p-0"
  onClick={() => setLocation('/forgot-password')}
>
  Forgot password?
</Button>

              </div>
              
              <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white">
                Login
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <span className="text-white">Don't have an account?</span>
            <Button 
              variant="link" 
              className="text-[#0EA5E9] hover:text-[#0EA5E9]/80"
              onClick={() => setLocation('/register')}
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
