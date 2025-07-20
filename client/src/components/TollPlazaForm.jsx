import React from 'react';
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

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  roadName: z.string().min(2, 'Road name must be at least 2 characters'),
  tollFee: z.coerce.number().positive('Fee must be a positive number'),
  latitude: z.coerce.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

const TollPlazaForm = ({ toll, onSubmit, onCancel }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: toll?.name || '',
      roadName: toll?.roadName || '',
      tollFee: toll?.tollFee || '',
      latitude: toll?.latitude || '',
      longitude: toll?.longitude || '',
    },
  });

  const handleFormSubmit = (values) => {
    if (onSubmit) {
      onSubmit(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Toll Plaza Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Chandwaji Toll Plaza"
                  className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="roadName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Road Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., NH-101"
                  className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tollFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="dark:text-gray-300">Toll Fee (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="e.g., 85"
                  className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-300">Latitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 26.765322"
                    className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="dark:text-gray-300">Longitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 70.451007"
                    className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="dark:bg-[#1F2937] dark:border-gray-700 dark:text-white"
          >
            {toll ? 'Update Toll Plaza' : 'Add Toll Plaza'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TollPlazaForm;
