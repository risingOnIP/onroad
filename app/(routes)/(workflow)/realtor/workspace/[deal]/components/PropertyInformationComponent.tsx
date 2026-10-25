"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Building, MapPin, FileText, DollarSign, Users, Zap, Save, Check, Camera, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { updateDealOption, getDealOption, uploadPropertyImages, deletePropertyImage, getPropertyImageUrls } from "@/app/actions/realtor/deal-option-actions";
import { toast } from "sonner";
import AddPartySection from "./AddPartySection";

interface PropertyInformation {
  // Basic Identification
  property_address: string;
  street_number_name: string;
  unit_suite: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  mls_listing_number: string;
  tax_parcel_apn: string;

  // Legal Description
  legal_description: string;
  lot_size: string;
  zoning_classification: string;
  easements_encumbrances: string;

  // Physical Characteristics
  year_built: string;
  building_square_footage: string;
  finished_basement: string;
  lot_dimensions: string;
  bedrooms: string;
  bathrooms: string;
  construction_type: string;
  roof_foundation_type: string;
  architectural_style: string;

  // Utilities & Services
  water_source: string;
  sewer_septic: string;
  electric_provider: string;
  gas_type: string;
  other_services: string;

  // Ownership & Taxation
  current_owners: string;
  ownership_type: string;
  annual_property_taxes: string;
  hoa_association: string;
  hoa_dues: string;
  special_assessments: string;

  // Market & Transaction Details
  listing_price: string;
  date_listed: string;
  occupancy_status: string;
  showing_instructions: string;
  seller_disclosures: string;
}


// Image Gallery Component
interface ImageGalleryProps {
  images: { [path: string]: string }; // path -> signed URL mapping
  onDeleteImage: (imagePath: string) => void;
  isDeleting: boolean;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDeleteImage, isDeleting }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const imagePaths = Object.keys(images);
  const imageUrls = Object.values(images);

  if (imagePaths.length === 0) {
    return (
      <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Camera className="h-12 w-12 mx-auto mb-2" />
          <p>No images uploaded yet</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % imagePaths.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + imagePaths.length) % imagePaths.length);
  };

  const handleDeleteImage = () => {
    if (imagePaths[currentIndex]) {
      const imagePath = imagePaths[currentIndex];
      onDeleteImage(imagePath);
      
      // Adjust current index if needed
      if (currentIndex >= imagePaths.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src={imageUrls[currentIndex]}
          alt={`Property image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* Controls */}
      {showControls && imagePaths.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
      
      {/* Delete button */}
      {showControls && (
        <button
          onClick={handleDeleteImage}
          disabled={isDeleting}
          className="absolute top-2 right-2 bg-red-500 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100 transition-opacity disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      
      {/* Image counter */}
      {imagePaths.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {imagePaths.length}
        </div>
      )}
      
      {/* Thumbnail navigation */}
      {imagePaths.length > 1 && (
        <div className="flex gap-2 mt-3 justify-center">
          {imageUrls.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <img
                src={imageUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface PropertyInformationComponentProps {
  dealId?: string;
  dealOptionId: string;
  dealSide?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function PropertyInformationComponent({ 
  dealOptionId, 
  dealSide,
  onBack, 
  showBackButton = false 
}: PropertyInformationComponentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [propertyInfo, setPropertyInfo] = useState<PropertyInformation>({
    // Basic Identification
    property_address: "",
    street_number_name: "",
    unit_suite: "",
    city: "",
    state: "",
    zip_code: "",
    property_type: "",
    mls_listing_number: "",
    tax_parcel_apn: "",

    // Legal Description
    legal_description: "",
    lot_size: "",
    zoning_classification: "",
    easements_encumbrances: "",

    // Physical Characteristics
    year_built: "",
    building_square_footage: "",
    finished_basement: "",
    lot_dimensions: "",
    bedrooms: "",
    bathrooms: "",
    construction_type: "",
    roof_foundation_type: "",
    architectural_style: "",

    // Utilities & Services
    water_source: "",
    sewer_septic: "",
    electric_provider: "",
    gas_type: "",
    other_services: "",

    // Ownership & Taxation
    current_owners: "",
    ownership_type: "",
    annual_property_taxes: "",
    hoa_association: "",
    hoa_dues: "",
    special_assessments: "",

    // Market & Transaction Details
    listing_price: "",
    date_listed: "",
    occupancy_status: "",
    showing_instructions: "",
    seller_disclosures: "",
  });

  const [dealOptionAddress, setDealOptionAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  // Image-related state
  const [propertyImages, setPropertyImages] = useState<{ [path: string]: string }>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);


  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!dealOptionId) return;

      try {
        setIsLoading(true);
        const dealOptionData = await getDealOption(dealOptionId);

        // Load existing property information from the deal option
        if (dealOptionData.property_information_response) {
          // Check if property information has any meaningful data (not just empty strings)
          const propertyData = dealOptionData.property_information_response;
          const hasExistingData = Object.values(propertyData).some(value => value && value.trim() !== '');
          
          if (hasExistingData) {
            // Load existing data if it has content
            setPropertyInfo(prev => ({ ...prev, ...propertyData }));
          } else if (dealOptionData.address) {
            // If property info exists but is empty, and we have an address, auto-populate
            setTimeout(() => {
              parseAndPopulateAddress(dealOptionData.address, false);
            }, 100);
          }
        } else if (dealOptionData.address) {
          // If no property information exists but we have an address, auto-populate basic fields
          setTimeout(() => {
            parseAndPopulateAddress(dealOptionData.address, false);
          }, 100);
        }
        setDealOptionAddress(dealOptionData.address);

        // Load property images
        try {
          const imageUrls = await getPropertyImageUrls(dealOptionId);
          setPropertyImages(imageUrls);
        } catch (imageError) {
          console.error("Error loading property images:", imageError);
          // Don't show error toast for images, just log it
        }
      } catch (error) {
        console.error("Error fetching property information:", error);
        toast.error("Failed to load property information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dealOptionId]);

  // Autosave functionality with proper debouncing
  useEffect(() => {
    if (isLoading) return; // Don't save while loading initial data

    const timeoutId = setTimeout(async () => {
      if (!dealOptionId) return;

      try {
        setIsSaving(true);
        await updateDealOption(dealOptionId, { 
          property_information_response: propertyInfo as unknown as Record<string, string>
        });
      } catch (error) {
        console.error("Error saving property information:", error);
        toast.error("Failed to save property information");
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [propertyInfo, dealOptionId, isLoading]);


  const handleInputChange = (field: keyof PropertyInformation, value: string) => {
    setPropertyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = async (newAddress: string) => {
    if (!dealOptionId || !newAddress.trim()) return;
    
    try {
      await updateDealOption(dealOptionId, { address: newAddress });
      setDealOptionAddress(newAddress);
      setIsEditingAddress(false);
      toast.success("Deal option address updated");
    } catch (error) {
      console.error("Error updating deal option address:", error);
      toast.error("Failed to update address");
    }
  };

  // Parse address and auto-populate property information fields
  const parseAndPopulateAddress = (address: string, showToast: boolean = true) => {
    if (!address) return;


    // Handle Mapbox format: "123 Main St, City, State ZIP, United States"
    // Remove "United States" if present
    const cleanAddress = address.replace(/,\s*United States\s*$/i, '');
    const addressParts = cleanAddress.split(',').map(part => part.trim());
    
    
    if (addressParts.length >= 3) {
      // Last part should contain "State ZIP"
      const lastPart = addressParts[addressParts.length - 1];
      const stateZipMatch = lastPart.match(/^([A-Za-z\s]+)\s+(\d{5}(?:-\d{4})?)$/);
      
      let state = '';
      let zip = '';
      
      if (stateZipMatch) {
        const stateName = stateZipMatch[1].trim();
        zip = stateZipMatch[2];
        
        // Convert state name to abbreviation if needed
        const stateAbbreviations: { [key: string]: string } = {
          'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
          'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
          'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
          'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
          'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
          'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
          'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
          'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
          'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
          'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        
        // Check if it's already an abbreviation (2 letters) or convert from full name
        if (stateName.length === 2) {
          state = stateName.toUpperCase();
        } else {
          state = stateAbbreviations[stateName] || stateName;
        }
      }
      
      // City is the second-to-last part
      const city = addressParts.length >= 3 ? addressParts[addressParts.length - 2] : '';
      
      // Extract street number and name from the first part
      const firstPart = addressParts[0];
      const streetMatch = firstPart.match(/^(\d+)\s+(.+)$/);
      const streetNumber = streetMatch ? streetMatch[1] : '';
      const streetName = streetMatch ? streetMatch[2] : firstPart;

      // Update property information with parsed data
      const updatedInfo = {
        property_address: address,
        street_number_name: `${streetNumber} ${streetName}`.trim(),
        city: city,
        state: state,
        zip_code: zip,
      };
      
      
      setPropertyInfo(prev => ({
        ...prev,
        ...updatedInfo,
      }));

      if (showToast) {
        toast.success("Address fields populated from deal option address");
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !dealOptionId) return;

    // Validate file types and sizes
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      setIsUploadingImages(true);
      await uploadPropertyImages(validFiles, dealOptionId);
      
      // Reload images
      const imageUrls = await getPropertyImageUrls(dealOptionId);
      setPropertyImages(imageUrls);
      
      toast.success(`${validFiles.length} image(s) uploaded successfully`);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imagePath: string) => {
    if (!dealOptionId) return;

    try {
      setIsDeletingImage(true);
      await deletePropertyImage(imagePath, dealOptionId);
      
      // Reload images
      const imageUrls = await getPropertyImageUrls(dealOptionId);
      setPropertyImages(imageUrls);
      
      toast.success("Image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsDeletingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading property information...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-6">
      <Card className="border rounded-lg shadow-sm overflow-hidden h-full">
        <CardHeader className="bg-white p-4 border-b flex flex-row justify-between items-start">
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Property Information</h1>
              {isEditingAddress ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={dealOptionAddress}
                    onChange={(e) => setDealOptionAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddressChange(dealOptionAddress);
                      } else if (e.key === 'Escape') {
                        setIsEditingAddress(false);
                      }
                    }}
                    className="text-sm h-7"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddressChange(dealOptionAddress)}
                    className="h-7 px-2"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAddress(true)}
                  className="text-sm text-gray-500 hover:text-gray-700 text-left"
                >
                  {dealOptionAddress || "Click to add address"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Saving...
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* Add Party Section - Only for buy and rent deals */}
          {dealSide && (dealSide === "buy" || dealSide === "rent") && (
            <AddPartySection
              dealOptionId={dealOptionId}
              dealSide={dealSide}
              dealOptionAddress={dealOptionAddress}
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Property Images */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  Property Images
                </CardTitle>
                <CardDescription>
                  Upload and manage property photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
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
                    disabled={isUploadingImages}
                    className="flex items-center gap-2"
                  >
                    {isUploadingImages ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add Images
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-gray-500">
                    Upload up to 10 images (max 10MB each)
                  </span>
                </div>
                
                <ImageGallery
                  images={propertyImages}
                  onDeleteImage={handleDeleteImage}
                  isDeleting={isDeletingImage}
                />
              </CardContent>
            </Card>

            {/* Basic Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Basic Identification
                </CardTitle>
                <CardDescription>
                  Primary property identification and location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="property_address">Property Address</Label>
                    <Input
                      id="property_address"
                      value={propertyInfo.property_address}
                      onChange={(e) => handleInputChange("property_address", e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={propertyInfo.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="Los Angeles"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={propertyInfo.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                        placeholder="CA"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip_code">ZIP Code</Label>
                      <Input
                        id="zip_code"
                        value={propertyInfo.zip_code}
                        onChange={(e) => handleInputChange("zip_code", e.target.value)}
                        placeholder="90210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_suite">Unit/Suite</Label>
                      <Input
                        id="unit_suite"
                        value={propertyInfo.unit_suite}
                        onChange={(e) => handleInputChange("unit_suite", e.target.value)}
                        placeholder="Apt 2B"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select
                      value={propertyInfo.property_type}
                      onValueChange={(value) => handleInputChange("property_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single-family">Single-Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="multi-family">Multi-Family</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mls_listing_number">MLS/Listing Number</Label>
                      <Input
                        id="mls_listing_number"
                        value={propertyInfo.mls_listing_number}
                        onChange={(e) => handleInputChange("mls_listing_number", e.target.value)}
                        placeholder="MLS123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tax_parcel_apn">Tax Parcel/APN</Label>
                      <Input
                        id="tax_parcel_apn"
                        value={propertyInfo.tax_parcel_apn}
                        onChange={(e) => handleInputChange("tax_parcel_apn", e.target.value)}
                        placeholder="123-456-789"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Physical Characteristics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Physical Characteristics
                </CardTitle>
                <CardDescription>
                  Building specifications and physical features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_built">Year Built</Label>
                    <Input
                      id="year_built"
                      value={propertyInfo.year_built}
                      onChange={(e) => handleInputChange("year_built", e.target.value)}
                      placeholder="1985"
                    />
                  </div>
                  <div>
                    <Label htmlFor="building_square_footage">Building Sq Ft</Label>
                    <Input
                      id="building_square_footage"
                      value={propertyInfo.building_square_footage}
                      onChange={(e) => handleInputChange("building_square_footage", e.target.value)}
                      placeholder="2,500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      value={propertyInfo.bedrooms}
                      onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      value={propertyInfo.bathrooms}
                      onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                      placeholder="2.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="lot_size">Lot Size</Label>
                  <Input
                    id="lot_size"
                    value={propertyInfo.lot_size}
                    onChange={(e) => handleInputChange("lot_size", e.target.value)}
                    placeholder="0.25 acres"
                  />
                </div>
                <div>
                  <Label htmlFor="lot_dimensions">Lot Dimensions</Label>
                  <Input
                    id="lot_dimensions"
                    value={propertyInfo.lot_dimensions}
                    onChange={(e) => handleInputChange("lot_dimensions", e.target.value)}
                    placeholder="100ft x 120ft"
                  />
                </div>
                <div>
                  <Label htmlFor="construction_type">Construction Type & Materials</Label>
                  <Input
                    id="construction_type"
                    value={propertyInfo.construction_type}
                    onChange={(e) => handleInputChange("construction_type", e.target.value)}
                    placeholder="Frame, brick, stucco"
                  />
                </div>
                <div>
                  <Label htmlFor="roof_foundation_type">Roof & Foundation Type</Label>
                  <Input
                    id="roof_foundation_type"
                    value={propertyInfo.roof_foundation_type}
                    onChange={(e) => handleInputChange("roof_foundation_type", e.target.value)}
                    placeholder="Shingle roof, concrete foundation"
                  />
                </div>
                <div>
                  <Label htmlFor="architectural_style">Architectural Style</Label>
                  <Select
                    value={propertyInfo.architectural_style}
                    onValueChange={(value) => handleInputChange("architectural_style", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ranch">Ranch</SelectItem>
                      <SelectItem value="colonial">Colonial</SelectItem>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                      <SelectItem value="traditional">Traditional</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="craftsman">Craftsman</SelectItem>
                      <SelectItem value="victorian">Victorian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Legal Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Legal Description
                </CardTitle>
                <CardDescription>
                  Legal and zoning information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="legal_description">Legal Description</Label>
                  <Textarea
                    id="legal_description"
                    value={propertyInfo.legal_description}
                    onChange={(e) => handleInputChange("legal_description", e.target.value)}
                    placeholder="Lot/Block/Subdivision text as recorded in County records"
                    className="min-h-[80px]"
                  />
                </div>
                <div>
                  <Label htmlFor="zoning_classification">Zoning Classification</Label>
                  <Input
                    id="zoning_classification"
                    value={propertyInfo.zoning_classification}
                    onChange={(e) => handleInputChange("zoning_classification", e.target.value)}
                    placeholder="R-1, Commercial, Industrial"
                  />
                </div>
                <div>
                  <Label htmlFor="easements_encumbrances">Easements/Encumbrances</Label>
                  <Textarea
                    id="easements_encumbrances"
                    value={propertyInfo.easements_encumbrances}
                    onChange={(e) => handleInputChange("easements_encumbrances", e.target.value)}
                    placeholder="Utility easements, rights-of-way, etc."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Utilities & Services */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Utilities & Services
                </CardTitle>
                <CardDescription>
                  Available utilities and service providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="water_source">Water Source</Label>
                  <Select
                    value={propertyInfo.water_source}
                    onValueChange={(value) => handleInputChange("water_source", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select water source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="well">Well</SelectItem>
                      <SelectItem value="shared-well">Shared Well</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sewer_septic">Sewer/Septic</Label>
                  <Select
                    value={propertyInfo.sewer_septic}
                    onValueChange={(value) => handleInputChange("sewer_septic", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sewer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public-sewer">Public Sewer</SelectItem>
                      <SelectItem value="septic-tank">Septic Tank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="electric_provider">Electric Provider</Label>
                  <Input
                    id="electric_provider"
                    value={propertyInfo.electric_provider}
                    onChange={(e) => handleInputChange("electric_provider", e.target.value)}
                    placeholder="PG&E, SCE, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="gas_type">Gas</Label>
                  <Select
                    value={propertyInfo.gas_type}
                    onValueChange={(value) => handleInputChange("gas_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gas type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural-gas">Natural Gas</SelectItem>
                      <SelectItem value="propane">Propane</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="other_services">Other Services</Label>
                  <Textarea
                    id="other_services"
                    value={propertyInfo.other_services}
                    onChange={(e) => handleInputChange("other_services", e.target.value)}
                    placeholder="Trash pickup, cable/internet providers"
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ownership & Taxation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Ownership & Taxation
                </CardTitle>
                <CardDescription>
                  Ownership details and tax information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_owners">Current Owner(s) Name(s)</Label>
                  <Input
                    id="current_owners"
                    value={propertyInfo.current_owners}
                    onChange={(e) => handleInputChange("current_owners", e.target.value)}
                    placeholder="John & Jane Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="ownership_type">Ownership Type</Label>
                  <Select
                    value={propertyInfo.ownership_type}
                    onValueChange={(value) => handleInputChange("ownership_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ownership type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fee-simple">Fee Simple</SelectItem>
                      <SelectItem value="leasehold">Leasehold</SelectItem>
                      <SelectItem value="trust">Trust</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="annual_property_taxes">Annual Property Taxes</Label>
                  <Input
                    id="annual_property_taxes"
                    value={propertyInfo.annual_property_taxes}
                    onChange={(e) => handleInputChange("annual_property_taxes", e.target.value)}
                    placeholder="$12,000"
                  />
                </div>
                <div>
                  <Label htmlFor="hoa_association">HOA/Condominium Association</Label>
                  <Input
                    id="hoa_association"
                    value={propertyInfo.hoa_association}
                    onChange={(e) => handleInputChange("hoa_association", e.target.value)}
                    placeholder="Sunset Hills HOA"
                  />
                </div>
                <div>
                  <Label htmlFor="hoa_dues">HOA Dues Amount & Frequency</Label>
                  <Input
                    id="hoa_dues"
                    value={propertyInfo.hoa_dues}
                    onChange={(e) => handleInputChange("hoa_dues", e.target.value)}
                    placeholder="$250/month"
                  />
                </div>
                <div>
                  <Label htmlFor="special_assessments">Special Assessments</Label>
                  <Textarea
                    id="special_assessments"
                    value={propertyInfo.special_assessments}
                    onChange={(e) => handleInputChange("special_assessments", e.target.value)}
                    placeholder="Pending or ongoing assessments"
                    className="min-h-[60px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Market & Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Market & Transaction Details
                </CardTitle>
                <CardDescription>
                  Listing and transaction information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="listing_price">Listing Price</Label>
                    <Input
                      id="listing_price"
                      value={propertyInfo.listing_price}
                      onChange={(e) => handleInputChange("listing_price", e.target.value)}
                      placeholder="$750,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_listed">Date Listed</Label>
                    <Input
                      id="date_listed"
                      type="date"
                      value={propertyInfo.date_listed}
                      onChange={(e) => handleInputChange("date_listed", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="occupancy_status">Occupancy Status</Label>
                  <Select
                    value={propertyInfo.occupancy_status}
                    onValueChange={(value) => handleInputChange("occupancy_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occupancy status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner-occupied">Owner-Occupied</SelectItem>
                      <SelectItem value="tenant-occupied">Tenant-Occupied</SelectItem>
                      <SelectItem value="vacant">Vacant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="showing_instructions">Showing Instructions/Access</Label>
                  <Textarea
                    id="showing_instructions"
                    value={propertyInfo.showing_instructions}
                    onChange={(e) => handleInputChange("showing_instructions", e.target.value)}
                    placeholder="Lockbox code, appointment required, gate code"
                    className="min-h-[60px]"
                  />
                </div>
                <div>
                  <Label htmlFor="seller_disclosures">Seller Disclosures Provided</Label>
                  <Select
                    value={propertyInfo.seller_disclosures}
                    onValueChange={(value) => handleInputChange("seller_disclosures", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disclosure status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}