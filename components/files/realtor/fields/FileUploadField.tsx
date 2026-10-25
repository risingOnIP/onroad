import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, File, X } from 'lucide-react';
import clsx from 'clsx';
import { SchemaItem } from '../../types/realtor';
import { toast } from 'sonner';

// Simple type for file tracking - we'll pass actual File objects to parent
interface TrackedFile {
  file: File;
  id: string;
  url: string; // Object URL for preview
}

interface FileUploadFieldProps {
  schema: SchemaItem;
  value: File[] | TrackedFile[] | string;
  onChange: (value: File[]) => void;
  onBlur: (value: File[]) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const FileUploadField = React.memo<FileUploadFieldProps>(({
  schema,
  value,
  onChange,
  onBlur,
  disabled = false,
  shouldDisableForClientIntake = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [trackedFiles, setTrackedFiles] = useState<TrackedFile[]>(() => {
    // Initialize tracked files from value
    if (Array.isArray(value)) {
      if (value.length > 0) {
        if (value[0] instanceof File) {
          // Value is File[]
          return value.map((file, index) => ({
            file: file as File,
            id: `file_${Date.now()}_${index}`,
            url: URL.createObjectURL(file as File)
          }));
        } else if (typeof value[0] === 'object' && 'file' in value[0]) {
          // Value is already TrackedFile[]
          return value as TrackedFile[];
        }
      }
    }
    return [];
  });
  
  // Default file upload settings - can be customized per field if needed
  let acceptedTypes = "*/*"; // Accept all file types by default
  const maxSize = 10; // 10MB default
  const maxFiles = 5; // 5 files max by default

  const validateFile = (file: File): string | null => {
    // Size validation
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Type validation (basic)
    if (acceptedTypes !== "*/*") {
      const allowedExtensions = acceptedTypes.split(',').map((ext: string) => ext.trim().toLowerCase());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.some((ext: string) => ext === fileExtension || ext === '*/*')) {
        return `File type not allowed. Accepted types: ${acceptedTypes}`;
      }
    }

    return null;
  };

  const handleFileSelection = useCallback(async (selectedFiles: FileList) => {
    if (trackedFiles.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const newTrackedFiles: TrackedFile[] = [];
    const allFiles: File[] = [];

    // Keep existing files
    trackedFiles.forEach(tf => {
      allFiles.push(tf.file);
    });

    // Process new files
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validationError = validateFile(file);
      
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      // Create tracked file with object URL for preview
      const trackedFile: TrackedFile = {
        file: file,
        id: `file_${Date.now()}_${i}`,
        url: URL.createObjectURL(file)
      };

      newTrackedFiles.push(trackedFile);
      allFiles.push(file);
    }

    // Update state
    const updatedTrackedFiles = [...trackedFiles, ...newTrackedFiles];
    setTrackedFiles(updatedTrackedFiles);
    
    // Pass actual File objects to parent
    onChange(allFiles);
    onBlur(allFiles);
    
    setUploading(false);

    if (newTrackedFiles.length > 0) {
      toast.success(`${newTrackedFiles.length} file(s) selected successfully`);
    }
  }, [trackedFiles, maxFiles, onChange, onBlur]);

  const handleFileRemoval = useCallback((fileId: string) => {
    // Find and remove the file
    const updatedTrackedFiles = trackedFiles.filter(f => f.id !== fileId);
    const remainingFiles = updatedTrackedFiles.map(tf => tf.file);
    
    // Clean up object URL to prevent memory leak
    const removedFile = trackedFiles.find(f => f.id === fileId);
    if (removedFile) {
      URL.revokeObjectURL(removedFile.url);
    }
    
    setTrackedFiles(updatedTrackedFiles);
    onChange(remainingFiles);
    onBlur(remainingFiles);
    toast.success('File removed');
  }, [trackedFiles, onChange, onBlur]);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Clean up object URLs on unmount
  React.useEffect(() => {
    return () => {
      trackedFiles.forEach(tf => {
        URL.revokeObjectURL(tf.url);
      });
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || shouldDisableForClientIntake || uploading || trackedFiles.length >= maxFiles}
          className={clsx(
            "flex items-center gap-2",
            shouldDisableForClientIntake && "cursor-not-allowed opacity-50"
          )}
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Processing...' : 'Choose Files'}
        </Button>
        
        <div className="text-sm text-gray-500">
          {acceptedTypes !== "*/*" && (
            <span>Accepted: {acceptedTypes} | </span>
          )}
          <span>Max size: {maxSize}MB</span>
          {maxFiles > 1 && (
            <span> | {trackedFiles.length}/{maxFiles} files</span>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={acceptedTypes}
        onChange={(e) => {
          if (e.target.files) {
            handleFileSelection(e.target.files);
            // Reset input to allow selecting the same file again
            e.target.value = '';
          }
        }}
        className="hidden"
        disabled={disabled || shouldDisableForClientIntake}
      />

      {/* File list */}
      {trackedFiles.length > 0 && (
        <div className="space-y-2">
          {trackedFiles.map((trackedFile) => (
            <div
              key={trackedFile.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {trackedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(trackedFile.file.size)}
                  </p>
                </div>
              </div>
              
              {!disabled && !shouldDisableForClientIntake && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileRemoval(trackedFile.id)}
                  className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Helper text can be added if needed */}
    </div>
  );
});

FileUploadField.displayName = 'FileUploadField';

export default FileUploadField;