import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  X,
  Check,
  Navigation,
  AlertCircle,
  Home,
  Building,
  Plus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";
import { villageService, type Village } from "@/services/village.service";
import { addressService, type Address } from "@/services/address.service";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/ui/FormControls";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, currentLocation, updateCurrentLocation } = useAuth();

  const [districts, setDistricts] = useState<string[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedVillageId, setSelectedVillageId] = useState<string>("");

  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load districts and saved addresses when modal opens
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

      if (isAuthenticated) {
        setIsLoadingAddresses(true);
        try {
          const addrs = await addressService.getAddresses();
          setSavedAddresses(addrs || []);
        } catch (_err) {
          setSavedAddresses([]);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    loadInitialData();
  }, [isOpen, currentLocation, isAuthenticated]);

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

  // Handler for selecting one of the user's saved addresses
  const handleSelectSavedAddress = async (addr: Address) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const addrDistrict = addr.district || "Hamirpur";
      const vList = await villageService.getVillages(addrDistrict);

      const matched = vList.find(
        (v) =>
          (addr.village && v.name.toLowerCase() === addr.village.trim().toLowerCase()) ||
          (addr.city && v.name.toLowerCase() === addr.city.trim().toLowerCase()),
      );

      if (matched) {
        await updateCurrentLocation(matched.id, matched.district);
      } else if (vList.length > 0) {
        await updateCurrentLocation(vList[0].id, vList[0].district);
      } else {
        await updateCurrentLocation(addr.id || "addr_loc", addrDistrict);
      }

      toast.success("Delivery Address Selected", `${addr.name} (${addr.village || addr.city || addr.street})`);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to select this address. Please try manual area selection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2 className="text-base sm:text-lg font-bold">Select Delivery Address & Location</h2>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-4 overflow-y-auto min-h-[360px] pb-6">
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

          {/* Section: Saved Addresses for Logged-In Users */}
          {isAuthenticated && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3B302B]">
                  Aapke Saved Addresses (Your Saved Addresses):
                </span>
                <Link
                  to="/customer/addresses"
                  onClick={onClose}
                  className="text-[11px] font-semibold text-[#596B58] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Manage</span>
                </Link>
              </div>

              {isLoadingAddresses ? (
                <div className="p-3 bg-white/60 border border-[#E5DEC9] rounded-xl flex items-center justify-center gap-2 text-xs text-[#7A6E65]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#596B58]" />
                  <span>Loading saved addresses...</span>
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                  {savedAddresses.map((addr) => {
                    const isSelected =
                      currentLocation &&
                      ((addr.village && currentLocation.villageName.toLowerCase() === addr.village.toLowerCase()) ||
                        (addr.city && currentLocation.villageName.toLowerCase() === addr.city.toLowerCase()) ||
                        currentLocation.pincode === addr.pincode);

                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        disabled={isSubmitting}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? "bg-[#596B58]/10 border-[#596B58] ring-1 ring-[#596B58]"
                            : "bg-white border-[#E5DEC9] hover:border-[#596B58]/60 hover:bg-[#FDFBF7]"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {addr.addressType === "WORK" ? (
                            <Building className="h-4 w-4 text-[#596B58] shrink-0 mt-0.5" />
                          ) : (
                            <Home className="h-4 w-4 text-[#596B58] shrink-0 mt-0.5" />
                          )}
                          <div className="text-xs min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#3B302B] truncate">{addr.name}</span>
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm bg-[#596B58]/15 text-[#596B58]">
                                {addr.addressType || "HOME"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-amber-100 text-amber-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[#7A6E65] text-[11px] truncate mt-0.5">
                              {addr.street}, {addr.village || addr.city}, {addr.district} ({addr.pincode})
                            </p>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="text-[11px] font-bold text-[#596B58] flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-full border border-[#596B58]/30">
                            <Check className="h-3.5 w-3.5" /> Selected
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#596B58] hover:underline shrink-0 pt-0.5">
                            Deliver Here
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Link
                  to="/customer/addresses"
                  onClick={onClose}
                  className="p-2.5 border border-dashed border-[#596B58]/40 rounded-xl flex items-center justify-between text-xs text-[#596B58] hover:bg-white transition-colors"
                >
                  <span className="font-semibold">+ Naya Delivery Address Add Karein (+ Add New Address)</span>
                  <Plus className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {/* Section Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#E5DEC9]"></div>
            <span className="shrink-0 mx-2 text-[11px] text-[#7A6E65] font-semibold">
              {isAuthenticated && savedAddresses.length > 0
                ? "Ya Area Khud Chunein (Or Select Area Manually)"
                : "Select Village / Service Area"}
            </span>
            <div className="flex-grow border-t border-[#E5DEC9]"></div>
          </div>

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
