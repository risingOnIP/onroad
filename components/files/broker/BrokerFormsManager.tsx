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
import { 
  Upload, 
  FileText, 
  Loader2, 
  Trash2, 
  Download, 
  Edit3, 
  Plus,
  X,
  CheckCircle2,
  Building2,
  FileUp,
  Search,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadBrokerForm, getTarForms, getBrokerForms, deleteBrokerForm, updateBrokerForm, getBrokerFormSignedUrl } from '@/app/actions/broker/broker-forms-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface BrokerForm {
  id: string;
  broker_id: string;
  form_type: string;
  org_name: string;
  broker_custom_pdf: string;
  created_at: string;
}

export function BrokerFormsManager() {
  const [uploadType, setUploadType] = useState<'custom' | 'tar'>('custom');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFormName, setCustomFormName] = useState('');
  const [selectedTarForm, setSelectedTarForm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [tarForms, setTarForms] = useState<Array<{ key: string; displayName: string }>>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [brokerForms, setBrokerForms] = useState<BrokerForm[]>([]);
  const [isLoadingBrokerForms, setIsLoadingBrokerForms] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<BrokerForm | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formToDelete, setFormToDelete] = useState<BrokerForm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'tar'>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFile, setUpdateFile] = useState<File | null>(null);

  // Fetch TAR forms when component mounts
  useEffect(() => {
    fetchTarForms();
    fetchBrokerForms();
  }, []);

  const fetchTarForms = async () => {
    setIsLoadingForms(true);
    try {
      const forms = await getTarForms();
      setTarForms(forms);
    } catch (error) {
      console.error('Error fetching TAR forms:', error);
      toast.error('Failed to load TAR forms');
    } finally {
      setIsLoadingForms(false);
    }
  };

  const fetchBrokerForms = async () => {
    setIsLoadingBrokerForms(true);
    try {
      const forms = await getBrokerForms();
      setBrokerForms(forms);
    } catch (error) {
      console.error('Error fetching broker forms:', error);
      toast.error('Failed to load your forms');
    } finally {
      setIsLoadingBrokerForms(false);
    }
  };

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

  const handleUpdateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      setUpdateFile(file);
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
        setShowUploadDialog(false);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Refresh forms list
        fetchBrokerForms();
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

  const handleUpdate = async (form: BrokerForm) => {
    if (!updateFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUpdating(true);

    try {
      const formData = new FormData();
      formData.append('file', updateFile);
      formData.append('formId', form.id);

      const result = await updateBrokerForm(formData);

      if (result.success) {
        toast.success('Form updated successfully');
        setUpdateFile(null);
        setSelectedForm(null);
        // Refresh forms list
        fetchBrokerForms();
      } else {
        throw new Error(result.error || 'Failed to update form');
      }
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update form');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;

    try {
      const result = await deleteBrokerForm(formToDelete.id);
      if (result.success) {
        toast.success('Form deleted successfully');
        setShowDeleteConfirm(false);
        setFormToDelete(null);
        // Refresh forms list
        fetchBrokerForms();
      } else {
        throw new Error(result.error || 'Failed to delete form');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete form');
    }
  };

  // Filter forms based on search and filter type
  const filteredForms = brokerForms.filter(form => {
    const matchesSearch = form.form_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'custom' && form.org_name === 'Brokerage') ||
      (filterType === 'tar' && form.org_name === 'TAR');
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Forms Library
              </CardTitle>
              <CardDescription className="mt-2">
                Manage your custom forms and TAR form templates
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowUploadDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Form
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchBrokerForms}
                disabled={isLoadingBrokerForms}
              >
                <RefreshCw className={cn("h-4 w-4", isLoadingBrokerForms && "animate-spin")} />
              </Button>
              <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)} className="w-fit">
                <TabsList>
                  <TabsTrigger value="all">All Forms</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="tar">TAR</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Forms Grid */}
          {isLoadingBrokerForms ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredForms.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {searchQuery || filterType !== 'all' ? 'No forms match your criteria' : 'No forms uploaded yet'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Click "Upload Form" to add your first form
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredForms.map((form, index) => (
                  <motion.div
                    key={form.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={cn(
                              "p-2 rounded-lg",
                              form.org_name === 'TAR' 
                                ? "bg-orange-100 dark:bg-orange-900/30" 
                                : "bg-blue-100 dark:bg-blue-900/30"
                            )}>
                              {form.org_name === 'TAR' ? (
                                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate pr-2">
                                {form.form_type}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "mt-1",
                                  form.org_name === 'TAR' 
                                    ? "border-orange-200 text-orange-700 dark:border-orange-800 dark:text-orange-400" 
                                    : "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400"
                                )}
                              >
                                {form.org_name}
                              </Badge>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Uploaded {new Date(form.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const url = await getBrokerFormSignedUrl(form.id);
                                    window.open(url, '_blank');
                                  } catch (error) {
                                    toast.error('Failed to open PDF');
                                  }
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const url = await getBrokerFormSignedUrl(form.id);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${form.form_type}.pdf`;
                                    link.click();
                                  } catch (error) {
                                    toast.error('Failed to download PDF');
                                  }
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSelectedForm(form)}
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Update PDF
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setFormToDelete(form);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload New Form</DialogTitle>
            <DialogDescription>
              Add a custom form or TAR template to your library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
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
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>Custom Brokerage Form</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
                  <RadioGroupItem value="tar" id="tar" />
                  <Label htmlFor="tar" className="font-normal cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-orange-600" />
                      <span>TAR Form (Texas Association of Realtors)</span>
                    </div>
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
                        <SelectItem key={form.key} value={form.key}>
                          {form.displayName}
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
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-blue-400 transition-colors">
                <Input
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    {selectedFile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF files only</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                isUploading ||
                (uploadType === 'custom' && !customFormName.trim()) ||
                (uploadType === 'tar' && !selectedTarForm)
              }
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={(open) => !open && setSelectedForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Form PDF</DialogTitle>
            <DialogDescription>
              Replace the PDF for "{selectedForm?.form_type}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg p-4 hover:border-blue-400 transition-colors">
              <Input
                id="update-file"
                type="file"
                accept="application/pdf"
                onChange={handleUpdateFileChange}
                className="hidden"
              />
              <label htmlFor="update-file" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-8 w-8 text-gray-400" />
                  {updateFile ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{updateFile.name}</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Click to select new PDF</p>
                      <p className="text-xs text-gray-500">This will replace the existing file</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedForm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedForm && handleUpdate(selectedForm)}
              disabled={!updateFile || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{formToDelete?.form_type}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}