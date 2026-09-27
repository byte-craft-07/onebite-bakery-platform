import React, { useEffect, useState } from "react";
import {
  MapPin,
  X,
  Check,
  Navigation,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";
import { villageService, type Village } from "@/services/village.service";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/FormControls";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { currentLocation, updateCurrentLocation } = useAuth();

  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedVillageId, setSelectedVillageId] = useState<string>("");

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load districts when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadInitialData = async () => {
      setIsLoadingDistricts(true);
      setErrorMessage(null);

      try {
        const districtList = await villageService.getDistricts();
        setDistricts(districtList);

        if (currentLocation?.district && districtList.includes(currentLocation.district)) {
          setSelectedDistrict(currentLocation.district);
        } else {
          // Do not auto-select district if no active location
          setSelectedDistrict("");
        }
      } catch (_err) {
        setErrorMessage("Failed to load delivery areas. Please try again.");
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadInitialData();
  }, [isOpen, currentLocation]);

  // Load villages whenever selected district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setVillages([]);
      setSelectedVillageId("");
      return;
    }

    const loadVillages = async () => {
      setIsLoadingVillages(true);
      try {
        const list = await villageService.getVillages(selectedDistrict);
        setVillages(list);

        if (currentLocation?.villageId && list.some((v) => v.id === currentLocation.villageId)) {
          setSelectedVillageId(currentLocation.villageId);
        } else {
          // Do not auto-select first village
          setSelectedVillageId("");
        }
      } catch (_err) {
        setVillages([]);
      } finally {
        setIsLoadingVillages(false);
      }
    };

    loadVillages();
  }, [selectedDistrict, currentLocation]);

  if (!isOpen) return null;

  // Handler for manual village submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || !selectedVillageId) {
      setErrorMessage("Please select both a District and a Village / Service Area.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await updateCurrentLocation(selectedVillageId, selectedDistrict);
      toast.success("Location Confirmed", "Your delivery area has been set.");
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to update location. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#FFF8EC] rounded-2xl sm:rounded-3xl shadow-xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 text-[#3B302B]">
            <MapPin className="h-5 w-5 text-[#596B58]" />
            <h2 className="text-base sm:text-lg font-bold">Select Delivery Location</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-[#3B302B] hover:bg-[#F7F2E7] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-4 overflow-y-auto pb-6">
          {/* Active Location */}
          {currentLocation && (
            <div className="p-3 bg-white border border-[#E5DEC9] rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Navigation className="h-5 w-5 text-[#596B58] shrink-0" />
                <div className="text-xs min-w-0">
                  <span className="font-semibold text-[#7A6E65]">Current Selected Location: </span>
                  <strong className="text-[#3B302B] block sm:inline font-bold truncate">
                    {currentLocation.villageName}, {currentLocation.district} ({currentLocation.pincode})
                  </strong>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#596B58] text-white rounded-full shrink-0">
                Active
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* District Dropdown */}
          <div className="space-y-1.5">
            <CustomSelect
              label="1. Select District"
              value={selectedDistrict}
              onChange={(val) => setSelectedDistrict(val)}
              disabled={isLoadingDistricts}
              placeholder={isLoadingDistricts ? "Loading districts..." : "Select District"}
              options={districts.map((d) => ({
                value: d,
                label: d,
              }))}
            />
          </div>

          {/* Village Dropdown */}
          <div className="space-y-1.5">
            <CustomSelect
              label="2. Select Village / Service Area"
              value={selectedVillageId}
              onChange={(val) => setSelectedVillageId(val)}
              disabled={isLoadingVillages || !selectedDistrict}
              placeholder={
                isLoadingVillages
                  ? "Loading villages..."
                  : !selectedDistrict
                  ? "First select a district"
                  : villages.length === 0
                  ? "No active villages in this district"
                  : "Select Village / Service Area"
              }
              searchable={villages.length > 5}
              options={villages.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.pincode})`,
              }))}
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!selectedVillageId || isLoadingVillages}
              className="text-xs flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Location</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
