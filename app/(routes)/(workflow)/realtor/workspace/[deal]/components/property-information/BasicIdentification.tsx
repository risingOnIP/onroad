import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertySectionProps {
  propertyInfo: any;
  isEditing: boolean;
  handleChange: (key: string, value: string) => void;
}

export const BasicIdentification: React.FC<PropertySectionProps> = ({
  propertyInfo,
  isEditing,
  handleChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic Identification</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="property_address">Property Address</Label>
          <Input
            id="property_address"
            value={propertyInfo.property_address}
            onChange={(e) => handleChange("property_address", e.target.value)}
            disabled={!isEditing}
            placeholder="Enter full property address"
          />
        </div>
        
        <div>
          <Label htmlFor="street_number_name">Street Number & Name</Label>
          <Input
            id="street_number_name"
            value={propertyInfo.street_number_name}
            onChange={(e) => handleChange("street_number_name", e.target.value)}
            disabled={!isEditing}
            placeholder="123 Main Street"
          />
        </div>
        
        <div>
          <Label htmlFor="unit_suite">Unit/Suite</Label>
          <Input
            id="unit_suite"
            value={propertyInfo.unit_suite}
            onChange={(e) => handleChange("unit_suite", e.target.value)}
            disabled={!isEditing}
            placeholder="Apt 4B"
          />
        </div>
        
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={propertyInfo.city}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={!isEditing}
            placeholder="City name"
          />
        </div>
        
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={propertyInfo.state}
            onChange={(e) => handleChange("state", e.target.value)}
            disabled={!isEditing}
            placeholder="TX"
          />
        </div>
        
        <div>
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            value={propertyInfo.zip_code}
            onChange={(e) => handleChange("zip_code", e.target.value)}
            disabled={!isEditing}
            placeholder="12345"
          />
        </div>
        
        <div>
          <Label htmlFor="property_type">Property Type</Label>
          <Select
            value={propertyInfo.property_type}
            onValueChange={(value) => handleChange("property_type", value)}
            disabled={!isEditing}
          >
            <SelectTrigger id="property_type">
              <SelectValue placeholder="Select property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single_family">Single Family Home</SelectItem>
              <SelectItem value="condo">Condominium</SelectItem>
              <SelectItem value="townhouse">Townhouse</SelectItem>
              <SelectItem value="multi_family">Multi-Family</SelectItem>
              <SelectItem value="land">Land/Lot</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="mls_listing_number">MLS Listing Number</Label>
          <Input
            id="mls_listing_number"
            value={propertyInfo.mls_listing_number}
            onChange={(e) => handleChange("mls_listing_number", e.target.value)}
            disabled={!isEditing}
            placeholder="MLS#123456"
          />
        </div>
        
        <div>
          <Label htmlFor="tax_parcel_apn">Tax Parcel/APN</Label>
          <Input
            id="tax_parcel_apn"
            value={propertyInfo.tax_parcel_apn}
            onChange={(e) => handleChange("tax_parcel_apn", e.target.value)}
            disabled={!isEditing}
            placeholder="123-456-789"
          />
        </div>
      </div>
    </div>
  );
};