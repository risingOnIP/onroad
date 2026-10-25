"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Search, SearchFilters } from "@/components/files/types/client";

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
type AddSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleSave: (filters: Partial<Search>) => void;
  presetRealtorEmail?: string;
};

export default function AddSearchDialog({
  open,
  onOpenChange,
  handleSave,
  presetRealtorEmail =""
}: AddSearchDialogProps) {
  const [searchName, setSearchName] = useState("");
  const [propertyType, setPropertyType] =
    useState<SearchFilters["propertyType"]>("residential");
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(0);
  const [schoolZone, setSchoolZone] = useState(5);
  const [location, setLocation] = useState("");

  /** Realtor controls */
  const [noRealtor, setNoRealtor] = useState(false);
  const [realtorEmail, setRealtorEmail] = useState(presetRealtorEmail ||"");
  const [emailError, setEmailError] = useState<string | null>(null);
  

  /* ------------------------------ submit ----------------------------- */
  const onSubmit = async () => {
    // validate only if user **has** a realtor
    setEmailError(null);

    const filters: SearchFilters = {
      searchName,
      propertyType,
      minBudget,
      maxBudget,
      schoolZone,
      location,
    };

    const insertingSearch: Partial<Search> = {
      search_name: searchName,
      realtor_email: noRealtor ? "" : realtorEmail,
      searchFilters: filters,
    };

    handleSave(insertingSearch);
    onOpenChange(false);
  };

  /* ------------------------------ render ----------------------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a new property search</DialogTitle>
        </DialogHeader>

        {/* -------------------------- FORM BODY ------------------------- */}
        <div className="space-y-5 pt-3">

          {/* Row 1: Realtor toggle & (optional) email */}
          <div className="space-y-1">
          {!(presetRealtorEmail && (presetRealtorEmail !== "")) && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">No&nbsp;realtor?</label>
              <Switch
                checked={noRealtor}
                onCheckedChange={(v) => setNoRealtor(v)}
              />
            </div>
          )}

          {!noRealtor && (
            <>
              <Input
                placeholder="Realtor e-mail address"
                value={realtorEmail}
                onChange={(e) => setRealtorEmail(e.target.value)}
                className={emailError ? "border-red-500" : ""}
                disabled={presetRealtorEmail !== "" && presetRealtorEmail !== null}
              />
              {emailError && (
                <p className="text-sm text-red-600">{emailError}</p>
              )}
            </>
          )}
        </div>

          {/* Row 2: Search name & property type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Search&nbsp;name</label>
              <Input
                placeholder="e.g. Austin Investment"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Property&nbsp;type</label>
              <Select
                value={propertyType}
                onValueChange={(v) =>
                  setPropertyType(v as SearchFilters["propertyType"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="improved_land">Improved&nbsp;Land</SelectItem>
                  <SelectItem value="unimproved_land">Unimproved&nbsp;Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Min&nbsp;budget&nbsp;($)
              </label>
              <Input
                step={5000}
                type="number"
                min={0}
                value={minBudget}
                onChange={(e) => setMinBudget(+e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Max&nbsp;budget&nbsp;($)
              </label>
              <Input
                step={5000}
                type="number"
                min={0}
                value={maxBudget}
                onChange={(e) => setMaxBudget(+e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: School-zone slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              School-zone priority ({schoolZone})
            </label>
            <Slider
              min={1}
              max={10}
              step={1}
              defaultValue={[schoolZone]}
              onValueChange={([v]) => setSchoolZone(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Don’t care</span>
              <span>High priority</span>
            </div>
          </div>

          {/* Row 5: Location */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="City, ZIP, neighborhood…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* -------------------------- FOOTER --------------------------- */}
        <DialogFooter className="pt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
