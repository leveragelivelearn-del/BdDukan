'use client';

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadToImgBB } from '@/lib/upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  value?: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function ImageUpload({ onUpload, value, label, className, iconClassName }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const generatedId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const url = await uploadToImgBB(file);
      onUpload(url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = () => {
    onUpload('');
  };

  return (
    <div className="space-y-4 w-full">
      {label && <Label>{label}</Label>}
      <div className="flex flex-col gap-4">
        {value ? (
          <div className="relative h-40 w-full overflow-hidden rounded-md border bg-muted">
            <img 
              src={value} 
              alt="Uploaded" 
              className="h-full w-full object-contain p-2" 
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={removeImage}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <Label
              htmlFor={generatedId}
              className={cn(
                "flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed hover:bg-muted/50 transition-colors",
                className
              )}
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                {loading ? (
                  <Loader2 className={cn("h-10 w-10 animate-spin text-muted-foreground", iconClassName)} />
                ) : (
                  <>
                    <Upload className={cn("mb-2 h-10 w-10 text-muted-foreground", iconClassName)} />
                    {!className?.includes('p-0') && (
                      <>
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span>
                        </p>
                        <p className="text-xs text-muted-foreground text-center px-2 line-clamp-1">PNG, JPG, or WEBP</p>
                      </>
                    )}
                  </>
                )}
              </div>
              <Input
                id={generatedId}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
                accept="image/*"
              />
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}
