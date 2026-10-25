import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { uploadPropertyImages, deletePropertyImage } from "@/app/actions/realtor/deal-option-actions";
import { toast } from "sonner";

interface PropertyImagesProps {
  dealOptionId: string;
  images: any[];
  isEditing: boolean;
  onImagesUpdate: (images: any[]) => void;
}

export const PropertyImages: React.FC<PropertyImagesProps> = ({
  dealOptionId,
  images,
  isEditing,
  onImagesUpdate,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const filesArray = Array.from(files);
      const result = await uploadPropertyImages(filesArray, dealOptionId);
      
      if (result.uploadedImages) {
        onImagesUpdate([...images, ...result.uploadedImages]);
        toast.success(`Uploaded ${filesArray.length} image(s) successfully`);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (images.length === 0 || index < 0 || index >= images.length) return;

    try {
      const imagePath = images[index];
      await deletePropertyImage(imagePath, dealOptionId);
      
      const newImages = images.filter((_, i) => i !== index);
      onImagesUpdate(newImages);
      
      // Adjust current index if needed
      if (currentImageIndex >= newImages.length && newImages.length > 0) {
        setCurrentImageIndex(newImages.length - 1);
      } else if (newImages.length === 0) {
        setCurrentImageIndex(0);
      }
      
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (images.length === 0) return;
    
    if (direction === "prev") {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    } else {
      setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Property Images
        </h3>
        {isEditing && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              {uploadingImages ? "Uploading..." : "Add Images"}
            </Button>
          </>
        )}
      </div>

      {images.length > 0 ? (
        <div className="relative">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={`Property image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {images.length > 1 && (
            <>
              <Button
                onClick={() => navigateImage("prev")}
                className="absolute left-2 top-1/2 -translate-y-1/2"
                size="icon"
                variant="secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigateImage("next")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                size="icon"
                variant="secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {isEditing && (
            <Button
              onClick={() => handleDeleteImage(currentImageIndex)}
              className="absolute top-2 right-2"
              size="icon"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No images uploaded</p>
            {isEditing && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImages}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Images
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};