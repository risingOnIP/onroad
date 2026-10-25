import React, { useCallback, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, User, UserCheck, Mail, Plus } from 'lucide-react';
import clsx from 'clsx';
import { SchemaItem, SignatureInput } from '../../types/realtor';

interface PartyOption {
  id: string;
  type: "deal_party" | "deal_option_party";
  label: string;
  email: string;
  role?: string;
}

interface SignatureFieldProps {
  schema: SchemaItem;
  value: SignatureInput | string;
  onChange: (value: SignatureInput | string) => void;
  onBlur: (value: SignatureInput | string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
  partyOptions?: PartyOption[];
  onPartySelection?: (item: SchemaItem, partyId: string) => void;
  onSignatureClear: (item: SchemaItem) => void;
  loadingParties?: boolean;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onAddPartyClick?: () => void;
}

const SignatureField = React.memo<SignatureFieldProps>(({
  schema,
  value,
  onChange,
  onBlur,
  disabled = false,
  shouldDisableForClientIntake = false,
  partyOptions = [],
  onPartySelection,
  onSignatureClear,
  loadingParties = false,
  dealId,
  dealOptionId,
  dealSide,
  dealOptionName,
  onAddPartyClick
}) => {
  const { special_input } = schema.display_attributes;
  const [isSelectingParty, setIsSelectingParty] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  
  // Parse current signature value
  const signatureValue = typeof value === 'string' ? null : value as SignatureInput;

  const handlePartySelection = useCallback((partyId: string) => {
    if (onPartySelection) {
      onPartySelection(schema, partyId);
    } else {
      // Fallback to local handling if no parent handler
      if (partyId === "__none__") {
        onChange({} as SignatureInput);
        onBlur({} as SignatureInput);
        return;
      }

      const selectedParty = partyOptions.find(p => p.id === partyId);
      if (!selectedParty) return;

      const signatureInput: SignatureInput = {
        actionAs: "signer",
        email: selectedParty.email,
      };

      onChange(signatureInput);
      onBlur(signatureInput);
    }
    setIsSelectingParty(false);
  }, [schema, onPartySelection, partyOptions, onChange, onBlur]);

  const handleActionChange = useCallback((newAction: "signer" | "delegator") => {
    if (!signatureValue) return;

    const updatedSignature: SignatureInput = {
      ...signatureValue,
      actionAs: newAction,
    };

    onChange(updatedSignature);
  }, [signatureValue, onChange]);

  const handleClearSignature = useCallback(() => {
    onSignatureClear(schema);
  }, [onSignatureClear, schema]);

  const handleAddPartyClick = useCallback(() => {
    setSelectOpen(false); // Close dropdown first
    onAddPartyClick?.(); // Then open modal
  }, [onAddPartyClick]);


  if (!signatureValue || typeof value === 'string') {
    // Show party selection
    return (
      <div className="space-y-3">
        <Select 
          value="__none__" 
          onValueChange={handlePartySelection}
          open={selectOpen}
          onOpenChange={setSelectOpen}
          disabled={disabled || shouldDisableForClientIntake || loadingParties}
        >
          <SelectTrigger className={clsx(
            "w-full",
            shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed"
          )}>
            <SelectValue placeholder={loadingParties ? "Loading parties..." : "Select a party to sign..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Select a party...
              </div>
            </SelectItem>
            {partyOptions.length === 0 && !loadingParties ? (
              <SelectItem value="no-parties" disabled>
                No parties found - check deal setup
              </SelectItem>
            ) : (
              partyOptions.map((party) => (
                <SelectItem key={party.id} value={party.id}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{party.label}</div>
                      <div className="text-xs text-gray-500">{party.email}</div>
                    </div>
                    
                  </div>
                </SelectItem>
              ))
            )}
            {onAddPartyClick && (
              <div className="p-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddPartyClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Party
                </Button>
              </div>
            )}
          </SelectContent>
        </Select>
        
        {partyOptions.length === 0 &&
          !loadingParties &&
          (dealId || dealOptionId) && (
            <div className="text-xs text-amber-600">
              Debug: dealId={dealId}, dealOptionId={dealOptionId}
              <button
                onClick={() => {
                  // This would trigger a reload of parties in the parent component
                }}
                className="ml-2 text-blue-600 underline"
              >
                Retry loading parties
              </button>
            </div>
          )}
      </div>
    );
  }

  // Show signature details
  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-green-600" />
          <div>
            <div className="font-medium text-gray-900">
              {(() => {
                const party = partyOptions.find(p => p.email === signatureValue.email);
                return party ? party.label : signatureValue.email;
              })()}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {signatureValue.email}
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearSignature}
          disabled={disabled || shouldDisableForClientIntake}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Action
          </label>
          <Select 
            value={signatureValue.actionAs} 
            onValueChange={handleActionChange}
            disabled={disabled || shouldDisableForClientIntake}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="signer">Signer</SelectItem>
              <SelectItem value="delegator">Delegator</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Signature will be collected during document finalization
        </div>
      </div>
    </div>
  );
});

SignatureField.displayName = 'SignatureField';

export default SignatureField;