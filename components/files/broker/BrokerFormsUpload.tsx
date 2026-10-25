'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadBrokerForm, getTarForms } from '@/app/actions/broker/broker-forms-actions';

interface BrokerFormsUploadProps {
  onUploadSuccess?: () => void;
}

export function BrokerFormsUpload({ onUploadSuccess }: BrokerFormsUploadProps) {
  const [uploadType, setUploadType] = useState<'custom' | 'tar'>('custom');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFormName, setCustomFormName] = useState('');
  const [selectedTarForm, setSelectedTarForm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [tarForms, setTarForms] = useState<string[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);

  // Fetch TAR forms when component mounts
  useEffect(() => {
    const fetchTarForms = async () => {
      setIsLoadingForms(true);
      try {
        const forms = (await getTarForms()).map((form) => form.displayName);
        setTarForms(forms);
      } catch (error) {
        console.error('Error fetching TAR forms:', error);
        toast.error('Failed to load TAR forms');
      } finally {
        setIsLoadingForms(false);
      }
    };

    fetchTarForms();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (uploadType === 'custom' && !customFormName.trim()) {
      toast.error('Please enter a name for your custom form');
      return;
    }

    if (uploadType === 'tar' && !selectedTarForm) {
      toast.error('Please select a TAR form type');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('uploadType', uploadType);
      formData.append('formType', uploadType === 'custom' ? customFormName : selectedTarForm);
      formData.append('orgName', uploadType === 'custom' ? 'Brokerage' : 'TAR');

      const result = await uploadBrokerForm(formData);

      if (result.success) {
        toast.success('Form uploaded successfully');
        // Reset form
        setSelectedFile(null);
        setCustomFormName('');
        setSelectedTarForm('');
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        throw new Error(result.error || 'Failed to upload form');
      }
    } catch (error) {
      console.error('Error uploading form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload form');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Forms
        </CardTitle>
        <CardDescription>
          Upload custom forms or TAR forms to your forms library
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Type Selection */}
        <div className="space-y-3">
          <Label>Form Type</Label>
          <RadioGroup
            value={uploadType}
            onValueChange={(value) => {
              setUploadType(value as 'custom' | 'tar');
              setCustomFormName('');
              setSelectedTarForm('');
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-normal cursor-pointer">
                Custom Brokerage Form
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tar" id="tar" />
              <Label htmlFor="tar" className="font-normal cursor-pointer">
                TAR Form (Texas Association of Realtors)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Form Name/Type Input */}
        {uploadType === 'custom' ? (
          <div className="space-y-2">
            <Label htmlFor="form-name">Form Name</Label>
            <Input
              id="form-name"
              placeholder="Enter a name for your custom form"
              value={customFormName}
              onChange={(e) => setCustomFormName(e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="tar-form-select">Select TAR Form</Label>
            <Select value={selectedTarForm} onValueChange={setSelectedTarForm}>
              <SelectTrigger id="tar-form-select">
                <SelectValue placeholder={isLoadingForms ? "Loading forms..." : "Choose a TAR form type"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {isLoadingForms ? (
                  <SelectItem value="loading" disabled>
                    Loading TAR forms...
                  </SelectItem>
                ) : tarForms.length === 0 ? (
                  <SelectItem value="no-forms" disabled>
                    No TAR forms available
                  </SelectItem>
                ) : (
                  tarForms.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload PDF</Label>
          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="flex-1"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={
            !selectedFile ||
            isUploading ||
            (uploadType === 'custom' && !customFormName.trim()) ||
            (uploadType === 'tar' && !selectedTarForm)
          }
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Form
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}