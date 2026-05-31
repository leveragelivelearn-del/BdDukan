'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const marketingSchema = z.object({
  googleTagManagerId: z.string().optional(),
  searchConsoleMeta: z.string().optional(),
  facebookDomainVerification: z.string().optional(),
});

type MarketingFormValues = z.infer<typeof marketingSchema>;

export function MarketingForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MarketingFormValues>({
    resolver: zodResolver(marketingSchema),
    defaultValues: {
      googleTagManagerId: '',
      searchConsoleMeta: '',
      facebookDomainVerification: '',
    },
  });

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings', { 
          cache: 'no-store',
          signal: controller.signal 
        });
        if (!res.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data = await res.json();
        
        if (isMounted) {
          form.reset({
            googleTagManagerId: data.googleTagManagerId || '',
            searchConsoleMeta: data.searchConsoleMeta || '',
            facebookDomainVerification: data.facebookDomainVerification || '',
          });
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Fetch marketing settings error:', error);
          toast.error('Failed to load marketing settings');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchSettings();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [form.reset]);

  async function onSubmit(values: MarketingFormValues) {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update marketing settings');
      } else {
        toast.success('Marketing settings updated successfully!');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <CardTitle>Marketing Tools & Tracking</CardTitle>
        <CardDescription>
          Configure IDs for your tracking scripts and search visibility here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="googleTagManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Tag Manager ID</FormLabel>
                  <FormControl>
                    <Input placeholder="GTM-XXXXXXX" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Enter your GTM container ID to enable Google Analytics, Ads, and other tags.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="searchConsoleMeta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Search Console Verification Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. j1X9r..._Xo" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Enter the content string from the meta tag provided by Google Search Console.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />





            <FormField
              control={form.control}
              name="facebookDomainVerification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Domain Verification</FormLabel>
                  <FormControl>
                    <Input placeholder="8zp1nr7skv87u2..." {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    Enter only the unique <b>content</b> code from the Facebook meta tag (e.g., 8zp1nr7skv87u2...).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
