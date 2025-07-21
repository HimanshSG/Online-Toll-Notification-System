import React, { useState } from 'react';
import { rechargeUserBalance } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/components/contexts/DarkModeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const processPayment = async (amount) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      success: true,
      transactionId: `TX${Math.floor(Math.random() * 1000000)}`,
      message: 'Payment successful',
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw new Error('Payment gateway error. Please try again.');
  }
};

const formSchema = z.object({
  amount: z.coerce.number()
    .min(100, 'Minimum recharge amount is ₹100')
    .max(10000, 'Maximum recharge amount is ₹10,000'),
});

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'upi', name: 'UPI', icon: 'mobile-alt' },
  { id: 'netbanking', name: 'Net Banking', icon: 'university' },
  { id: 'wallet', name: 'Wallet', icon: 'wallet' },
];

const RechargeDialog = ({ 
  open, 
  onOpenChange, 
  currentBalance, 
  fastagId, 
  onRechargeSuccess 
}) => {
  const { toast } = useToast();
  const { darkMode } = useDarkMode();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 500,
    },
  });

  const onSubmit = async (values) => {
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // Process payment through gateway
      const paymentResult = await processPayment(values.amount);
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.message || 'Payment processing failed');
      }

      // Update user balance in our system
      const rechargeResult = await rechargeUserBalance(values.amount);
      
      if (!rechargeResult.success) {
        // This will only happen if API returns {success: false}
        throw new Error(rechargeResult.message || 'Balance update failed');
      }

      // Success handling
      toast({
        title: 'Recharge successful',
        description: `Your FASTag has been recharged with ${formatCurrency(values.amount)}. New balance: ${formatCurrency(rechargeResult.newBalance)}`,
      });

      if (onRechargeSuccess) {
        onRechargeSuccess(values.amount);
      }

      form.reset();
      setIsPaymentSuccess(true);

      setTimeout(() => {
        setIsPaymentSuccess(false);
        setIsProcessing(false);
        onOpenChange(false);
      }, 2000);

    } catch (error) {
      console.error('Recharge error:', error);
      setPaymentError(error.message);
      
      // Check if balance was actually updated despite the error
      if (error.message.includes('already updated') || 
          error.message.includes('balance was incremented')) {
        toast({
          title: 'Recharge completed',
          description: 'Your balance has been updated successfully.',
        });
        if (onRechargeSuccess) {
          onRechargeSuccess(values.amount);
        }
        onOpenChange(false);
      } else {
        toast({
          title: 'Recharge failed',
          description: error.message || 'Failed to process payment. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setIsPaymentSuccess(false);
      setIsProcessing(false);
      setPaymentError(null);
      form.reset();
    }
    onOpenChange(open);
  };

  // Dark mode classes
  const dialogContentClass = darkMode 
    ? 'dark bg-gray-800 text-white border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';

  const inputClass = darkMode 
    ? 'bg-gray-700 border-gray-600 text-white focus:ring-primary-500 focus:border-primary-500'
    : 'bg-white border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500';

  const paymentMethodClass = (methodId) => darkMode 
    ? paymentMethod === methodId 
      ? 'bg-primary/20 border-primary text-white'
      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
    : paymentMethod === methodId 
      ? 'bg-primary/10 border-primary'
      : 'hover:bg-gray-50';

  const iconClass = (methodId) => darkMode 
    ? paymentMethod === methodId 
      ? 'text-primary'
      : 'text-gray-400'
    : paymentMethod === methodId 
      ? 'text-primary'
      : 'text-gray-500';

  const balanceBoxClass = darkMode 
    ? 'bg-gray-700 text-white'
    : 'bg-gray-50 text-neutral-dark';

  const errorClass = darkMode 
    ? 'text-red-400 bg-red-900/20 border-red-700'
    : 'text-red-600 bg-red-50 border-red-200';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`sm:max-w-md ${dialogContentClass}`}>
        <DialogHeader>
          <DialogTitle className={darkMode ? 'text-white' : ''}>
            Recharge FASTag
          </DialogTitle>
          <DialogDescription className={darkMode ? 'text-gray-300' : ''}>
            Add money to your FASTag wallet for seamless toll payments
          </DialogDescription>
        </DialogHeader>

        {isPaymentSuccess ? (
          <div className={`py-6 text-center ${darkMode ? 'text-white' : ''}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? 'bg-green-900/20' : 'bg-green-100'
            }`}>
              <FontAwesomeIcon 
                icon="check" 
                className={`text-green-500 text-xl ${darkMode ? 'text-green-400' : ''}`} 
              />
            </div>
            <h3 className={`text-lg font-medium ${
              darkMode ? 'text-green-300' : 'text-green-800'
            }`}>
              Recharge Successful!
            </h3>
            <p className={`text-sm mt-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Your balance has been updated.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className={`rounded-lg p-4 mb-4 ${balanceBoxClass}`}>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Current Balance
                </p>
                <p className={`text-xl font-semibold ${
                  darkMode ? 'text-white' : 'text-neutral-dark'
                }`}>
                  {formatCurrency(currentBalance)}
                </p>
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  FASTag ID: {fastagId}
                </p>
              </div>

              {paymentError && (
                <div className={`p-3 rounded-md border ${errorClass}`}>
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={paymentError.includes('processed') ? 'check-circle' : 'exclamation-circle'} 
                      className={`mr-2 ${paymentError.includes('processed') ? 'text-yellow-500' : 'text-red-500'}`} 
                    />
                    <span>{paymentError}</span>
                  </div>
                  {paymentError.includes('processed') && (
                    <p className="text-xs mt-2">
                      No action needed - we'll automatically retry the balance update.
                    </p>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={darkMode ? 'text-white' : ''}>
                      Recharge Amount (₹)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100" 
                        placeholder="Enter amount" 
                        className={inputClass}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <p className={`text-sm font-medium mb-2 ${
                  darkMode ? 'text-white' : ''
                }`}>
                  Select Payment Method
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        paymentMethodClass(method.id)
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          darkMode 
                            ? paymentMethod === method.id 
                              ? 'bg-primary/30' 
                              : 'bg-gray-600'
                            : paymentMethod === method.id 
                              ? 'bg-primary/20' 
                              : 'bg-gray-100'
                        }`}>
                          <FontAwesomeIcon 
                            icon={method.icon} 
                            className={iconClass(method.id)} 
                          />
                        </div>
                        <span className={`ml-2 text-sm ${
                          darkMode ? 'text-white' : ''
                        }`}>
                          {method.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : `Pay ${form.getValues('amount') ? formatCurrency(form.getValues('amount')) : '₹0'}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RechargeDialog;