import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface PropertySectionProps {
  propertyInfo: any;
  isEditing: boolean;
  handleChange: (key: string, value: string) => void;
}

export const FinancialInformation: React.FC<PropertySectionProps> = ({
  propertyInfo,
  isEditing,
  handleChange,
}) => {
  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/[^0-9.]/g, '');
    // Format with commas
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    handleChange(field, formatted);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <DollarSign className="h-5 w-5" />
        Financial Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchase_price">Purchase Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="purchase_price"
              value={propertyInfo.purchase_price}
              onChange={(e) => handleCurrencyChange("purchase_price", e.target.value)}
              disabled={!isEditing}
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="list_price">List Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="list_price"
              value={propertyInfo.list_price}
              onChange={(e) => handleCurrencyChange("list_price", e.target.value)}
              disabled={!isEditing}
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="assessed_value">Assessed Value</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="assessed_value"
              value={propertyInfo.assessed_value}
              onChange={(e) => handleCurrencyChange("assessed_value", e.target.value)}
              disabled={!isEditing}
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="annual_property_taxes">Annual Property Taxes</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="annual_property_taxes"
              value={propertyInfo.annual_property_taxes}
              onChange={(e) => handleCurrencyChange("annual_property_taxes", e.target.value)}
              disabled={!isEditing}
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="tax_exemptions">Tax Exemptions</Label>
          <Input
            id="tax_exemptions"
            value={propertyInfo.tax_exemptions}
            onChange={(e) => handleChange("tax_exemptions", e.target.value)}
            disabled={!isEditing}
            placeholder="Homestead, Senior, etc."
          />
        </div>
        
        <div>
          <Label htmlFor="additional_monthly_fees">Additional Monthly Fees</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="additional_monthly_fees"
              value={propertyInfo.additional_monthly_fees}
              onChange={(e) => handleCurrencyChange("additional_monthly_fees", e.target.value)}
              disabled={!isEditing}
              placeholder="0"
              className="pl-8"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="hoa_condo_fees">HOA/Condo Fees</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="hoa_condo_fees"
              value={propertyInfo.hoa_condo_fees}
              onChange={(e) => handleCurrencyChange("hoa_condo_fees", e.target.value)}
              disabled={!isEditing}
              placeholder="0/month"
              className="pl-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};