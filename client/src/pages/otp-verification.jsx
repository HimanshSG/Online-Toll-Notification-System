import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Logo from '@/components/Logo';
import { verifyOtp } from '@/lib/auth';
import axios from 'axios'; // ✅ Needed to resend OTP

const OtpVerification = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30); // 30s countdown
  const inputRefs = useRef([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const verificationData = sessionStorage.getItem('pendingVerification');
    if (!verificationData) {
      toast({
        title: 'Verification error',
        description: 'No verification in progress. Please register first.',
        variant: 'destructive',
      });
      setLocation('/register');
      return;
    }
    const parsedData = JSON.parse(verificationData);
    setUserInfo(parsedData);

    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits filled
    if (index === 5 && newOtpValues.every(v => v.length === 1)) {
      handleVerify(newOtpValues.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpValues(digits);
      inputRefs.current[5]?.focus();
      handleVerify(digits.join(''));
    }
  };

  const handleVerify = async (manualOtp) => {
    const otp = manualOtp || otpValues.join('');
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a valid 6-digit OTP.',
        variant: 'destructive',
      });
      return;
    }

    if (!userInfo || !userInfo.userId) {
      toast({
        title: 'Verification error',
        description: 'User information missing. Please register again.',
        variant: 'destructive',
      });
      setLocation('/register');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({
        userId: userInfo.userId,
        otp: otp,
      });

      toast({
        title: 'Verification successful',
        description: 'Your account has been verified. You can now login.',
      });

      sessionStorage.removeItem('pendingVerification');
      setLocation('/login');
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        title: 'Verification failed',
        description: error.response?.data?.error || 'Invalid or expired OTP.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userInfo || !userInfo.userId) return;

    try {
      await axios.post('/api/auth/resend-otp', {
        userId: userInfo.userId,
      });
      toast({
        title: 'OTP resent',
        description: 'A new verification code has been sent to your phone.',
      });
      setOtpValues(['', '', '', '', '', '']);
      setResendTimer(30); // Restart countdown
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        title: 'Resend failed',
        description: error.response?.data?.error || 'Could not resend OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#0F172A] text-white">
      <div className="max-w-md w-full mx-auto text-center">
        <Button 
          variant="ghost" 
          className="mb-6 text-white flex items-center self-start hover:bg-white/10"
          onClick={() => setLocation('/register')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
        </Button>

        <div className="mb-8">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold mt-4">Verify Your Number</h1>
          <p className="text-gray-400 mt-2">
            We've sent a verification code to
            {userInfo?.contactNumber ? ` ${userInfo.contactNumber}` : ' your phone'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
          <div className="flex justify-between mb-6" onPaste={handlePaste}>
            {otpValues.map((value, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="w-12 h-12 text-center text-xl font-bold rounded-lg bg-white/5 border border-white/20 text-white focus:ring-2 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]"
                value={value}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (inputRefs.current[index] = el)}
              />
            ))}
          </div>

          <div className="mb-6">
            {resendTimer > 0 ? (
              <span className="text-sm text-gray-400">
                Resend OTP in {resendTimer}s
              </span>
            ) : (
              <Button 
                variant="link" 
                className="text-sm text-[#0EA5E9] hover:text-[#0EA5E9]/80"
                onClick={handleResendOtp}
              >
                Resend OTP
              </Button>
            )}
          </div>

          <Button 
            onClick={() => handleVerify()} 
            className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify & Continue'
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OtpVerification;
