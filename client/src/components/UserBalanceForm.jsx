import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
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
import { updateUserBalance } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  fastagBalance: z.coerce.number()
    .nonnegative('Balance cannot be negative')
    .max(100000, 'Maximum balance limit exceeded')
});

const UserBalanceForm = ({ user, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fastagBalance: user.fastagBalance || 0,
    },
  });

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      await updateUserBalance(user._id, values.fastagBalance);
      
      toast({
        title: 'Balance updated',
        description: `${user.name}'s FASTag balance has been updated to ${formatCurrency(values.fastagBalance)}.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update FASTag balance. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <span className="text-gray-500">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">FASTag ID:</span>
            <p className="font-medium">{user.fastagId}</p>
          </div>
          <div>
            <span className="text-gray-500">Vehicle Number:</span>
            <p className="font-medium">{user.vehicleNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">Current Balance:</span>
            <p className={`font-medium ${Number(user.fastagBalance) < 200 ? 'text-red-500' : ''}`}>
              {formatCurrency(Number(user.fastagBalance))}
            </p>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fastagBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New FASTag Balance (₹)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Enter new balance amount" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Balance'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UserBalanceForm;
