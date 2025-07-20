import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png'; // Import logo directly

const Welcome = () => {
  const [_, setLocation] = useLocation();

  return (
    <section className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#0F172A] text-white fade-in">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Logo + Branding */}
        <div className="mb-8 flex flex-col items-center justify-center">
          <img src={logo} alt="TollNotify Logo" className="h-16 mb-3" />
          <h1 className="text-3xl font-bold text-[#0EA5E9]">TollNotify</h1>
          <p className="text-sm text-white mt-1">Stay Notified. Drive Hassle-Free.</p>
        </div>

        {/* Welcome Text */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 mb-6">
          <p className="text-white mb-6">
            Welcome to India's premier toll notification system. 
            Get alerts before approaching toll plazas and manage 
            your FASTag balance effortlessly.
          </p>

          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => setLocation('/login')}
              className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-medium"
            >
              Login
            </Button>
            <Button 
              onClick={() => setLocation('/register')}
              variant="outline"
              className="bg-white hover:bg-white/90 text-[#0F172A] font-medium border-white"
            >
              Register
            </Button>
          </div>
        </div>

        {/* Admin Login */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <Button 
            onClick={() => setLocation('/admin-login')}
            variant="outline"
            className="w-full bg-transparent hover:bg-white/10 text-white border border-white/30 font-medium"
          >
            Admin Login
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Welcome;
