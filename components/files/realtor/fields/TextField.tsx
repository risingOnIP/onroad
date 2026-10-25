import React, { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import clsx from "clsx";
import { SchemaItem } from "../../types/realtor";

// Common country codes
const countryCodes = [
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
];

interface TextFieldProps {
  schema: SchemaItem;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const TextField = React.memo<TextFieldProps>(
  ({
    schema,
    value,
    onChange,
    onBlur,
    disabled = false,
    shouldDisableForClientIntake = false,
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const [countryCode, setCountryCode] = useState("+1"); // Default to USA
    const [phoneNumber, setPhoneNumber] = useState(""); // Separate state for phone number part
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false); // Track if user is actively typing
    
    // Only sync with prop value on initial mount or when not actively typing
    React.useEffect(() => {
      // Don't update local state if user is typing or debounce is pending
      if (isTypingRef.current || debounceRef.current) {
        return;
      }
      
      if (schema.display_attributes.special_input?.text?.phone && value) {
        // Check if value starts with a country code
        const matchedCode = countryCodes.find(cc => value.startsWith(cc.code));
        if (matchedCode) {
          setCountryCode(matchedCode.code);
          // Remove country code from phone number for display
          const phoneOnly = value.substring(matchedCode.code.length).trim();
          setPhoneNumber(phoneOnly);
          setLocalValue(phoneOnly);
        } else {
          // If no country code detected, treat entire value as phone number
          setPhoneNumber(value);
          setLocalValue(value);
        }
      } else if (!schema.display_attributes.special_input?.text?.phone) {
        setLocalValue(value);
      }
    }, [value, schema.display_attributes.special_input?.text?.phone]);

    // Handle immediate UI updates with debounced onChange
    const handleChange = useCallback(
      (newValue: string, isPhoneField = false, newCountryCode?: string) => {
        // Mark as typing
        isTypingRef.current = true;
        
        if (isPhoneField) {
          setPhoneNumber(newValue);
          setLocalValue(newValue);
        } else {
          setLocalValue(newValue);
        }

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Debounce the onChange callback - 2 second delay
        debounceRef.current = setTimeout(() => {
          if (isPhoneField) {
            // Combine country code with phone number
            const code = newCountryCode || countryCode;
            const fullPhone = newValue ? `${code} ${newValue}` : "";
            onChange(fullPhone);
          } else {
            onChange(newValue);
          }
          // Clear typing flag after save
          isTypingRef.current = false;
          debounceRef.current = null;
        }, 2000);
      },
      [onChange, countryCode]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const blurValue = e.target.value;

        // Clear debounce timer
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        
        // Clear typing flag on blur
        isTypingRef.current = false;

        // For phone fields, combine with country code
        const finalValue = schema.display_attributes.special_input?.text?.phone 
          ? (blurValue ? `${countryCode} ${blurValue}` : "")
          : blurValue;

        // Don't call onChange on blur - let the parent handle it
        // This prevents double-saving and status conflicts
        onBlur(finalValue);
        onChange(finalValue);
      },
      [onBlur, onChange, schema.display_attributes.special_input?.text?.phone, countryCode]
    );

    // No longer sync with prop changes during user interaction
    // TextField maintains its own state until user is done typing

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    const { input_type, special_input, placeholder } =
      schema.display_attributes;

    // Text Area
    if (input_type === "text-area") {
      const minRows = special_input?.text?.minRows || 4;
      const maxRows = special_input?.text?.maxRows;
      const autoResize = special_input?.text?.autoResize;

      return (
        <div className="relative">
          <Textarea
            value={localValue}
            onChange={(e) => {
              handleChange(e.target.value);
              // Auto-resize functionality
              if (autoResize) {
                const textarea = e.target;
                textarea.style.height = "auto";
                const newHeight = Math.min(
                  textarea.scrollHeight,
                  maxRows ? maxRows * 24 : Infinity
                );
                textarea.style.height = `${newHeight}px`;
              }
            }}
            onBlur={handleBlur}
            placeholder={placeholder || ""}
            disabled={disabled || shouldDisableForClientIntake}
            rows={minRows}
            className={clsx(
              "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none",
              shouldDisableForClientIntake
                ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                : "bg-white",
              autoResize && "overflow-hidden"
            )}
            style={{
              minHeight: `${minRows * 24}px`,
              maxHeight: maxRows ? `${maxRows * 24}px` : undefined,
            }}
          />
        </div>
      );
    }

    // Text Input variants
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, isPhoneField = false) => {
      const inputValue = e.target.value;
      let processedValue = inputValue;

      // Phone formatting - Format as (XXX) XXX-XXXX
      if (special_input?.text?.phone || isPhoneField) {
        // Remove all non-digits
        const digitsOnly = inputValue.replace(/\D/g, "");
        
        // Format the phone number
        if (digitsOnly.length <= 3) {
          processedValue = digitsOnly;
        } else if (digitsOnly.length <= 6) {
          processedValue = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
        } else if (digitsOnly.length <= 10) {
          processedValue = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
        } else {
          // Handle numbers longer than 10 digits (international or with country code)
          processedValue = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
          if (digitsOnly.length > 10) {
            processedValue += ` x${digitsOnly.slice(10)}`;
          }
        }
        handleChange(processedValue, true);
        return;
      }
      // Number formatting
      else if (special_input?.text?.number) {
        processedValue = inputValue.replace(/[^0-9.-]/g, "");
      }
      // Email validation (basic formatting)
      else if (special_input?.text?.email) {
        // Allow standard email characters
        processedValue = inputValue.replace(/[^a-zA-Z0-9@._-]/g, "");
      }
      // Currency formatting - allows text and numbers
      else if (special_input?.text?.currency) {
        // Allow text input as well as numbers for currency fields
        // This enables users to type things like "TBD", "N/A", "Negotiable", etc.
        processedValue = inputValue;
      }
      // Percentage formatting
      else if (special_input?.text?.percentage) {
        const numericValue = inputValue.replace(/[^0-9.]/g, "");
        const parts = numericValue.split(".");
        let formattedValue = parts[0];

        if (parts.length > 1) {
          formattedValue += "." + parts[1].slice(0, 2);
        }

        if (formattedValue) {
          formattedValue += "%";
        }
        processedValue = formattedValue;
      }

      handleChange(processedValue);
    };

    const getInputType = () => {
      if (special_input?.text?.url) return "url";
      if (special_input?.text?.email) return "email";
      if (special_input?.text?.phone) return "tel";
      return "text";
    };

    const getPlaceholder = () => {
      if (special_input?.text?.phone) return placeholder || "(555) 555-5555";
      if (special_input?.text?.number) return placeholder || "0";
      if (special_input?.text?.currency) return placeholder || "0.00";
      if (special_input?.text?.percentage) return placeholder || "0.00%";
      if (special_input?.text?.url) return placeholder || "https://example.com";
      if (special_input?.text?.email) return placeholder || "email@example.com";
      return placeholder || "";
    };

    // Phone input with country code dropdown
    if (special_input?.text?.phone) {
      return (
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={(newCode) => {
              setCountryCode(newCode);
              // Trigger debounced update with new country code
              handleChange(phoneNumber, true, newCode);
            }}
            disabled={disabled || shouldDisableForClientIntake}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countryCodes.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.code}</span>
                    <span className="text-xs text-gray-500">({country.country})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => handleTextChange(e, true)}
            onBlur={handleBlur}
            placeholder={getPlaceholder()}
            disabled={disabled || shouldDisableForClientIntake}
            className={clsx(
              "flex-1 transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              shouldDisableForClientIntake
                ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                : "bg-white"
            )}
          />
        </div>
      );
    }

    // Regular text input for non-phone fields
    return (
      <Input
        type={getInputType()}
        value={localValue}
        onChange={(e) => handleTextChange(e, false)}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        disabled={disabled || shouldDisableForClientIntake}
        className={clsx(
          "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          shouldDisableForClientIntake
            ? "bg-blue-50 border-blue-200 cursor-not-allowed"
            : "bg-white"
        )}
      />
    );
  }
);

TextField.displayName = "TextField";

export default TextField;