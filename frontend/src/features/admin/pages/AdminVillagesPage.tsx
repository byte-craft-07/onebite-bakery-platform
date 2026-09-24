import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Edit2, MapPin, Plus, Search, Trash2, Truck, XCircle } from "lucide-react";

import { Badge, Card, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { villageService, type Village } from "@/services/village.service";

const villageSchema = z.object({
  name: z.string().trim().min(2, "Village name is required."),
  district: z.string().trim().min(2, "District name is required."),
  pincode: z.string().trim().regex(/^\d{4,10}$/, "Valid 4-10 digit pincode required."),
  deliveryCharge: z.number().min(0, "Delivery charge must be 0 or more.").optional(),
  freeDeliveryThreshold: z.number().min(0, "Free delivery threshold must be 0 or more.").optional(),
  isActive: z.boolean().optional(),
});

type VillageFormData = z.infer<typeof villageSchema>;

export const AdminVillagesPage: React.FC = () => {
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const villageForm = useForm<VillageFormData>({
    resolver: zodResolver(villageSchema),
    defaultValues: {
      name: "",
      district: "",
      pincode: "",
      deliveryCharge: 49,
      freeDeliveryThreshold: 799,
      isActive: true,
    },
  });

  const editForm = useForm<VillageFormData>({
    resolver: zodResolver(villageSchema),
  });

  const loadVillages = async () => {
    setIsLoading(true);
    try {
      const data = await villageService.getAdminVillages();
      setVillages(data);
      setErrorMsg(null);
    } catch (_err) {
      setErrorMsg("Failed to load villages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVillages();
  }, []);

  const handleAddVillage = async (data: VillageFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await villageService.createVillage(data);
      setIsAddModalOpen(false);
      villageForm.reset();
      loadVillages();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to create village.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (village: Village) => {
    setEditingVillage(village);
    editForm.reset({
      name: village.name,
      district: village.district,
      pincode: village.pincode,
      deliveryCharge: village.deliveryCharge ?? 49,
      freeDeliveryThreshold: village.freeDeliveryThreshold ?? 799,
      isActive: village.isActive,
    });
  };

  const handleUpdateVillage = async (data: VillageFormData) => {
    if (!editingVillage) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await villageService.updateVillage(editingVillage.id, data);
      setEditingVillage(null);
      loadVillages();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Failed to update village.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (village: Village) => {
    try {
      await villageService.updateVillage(village.id, {
        isActive: !village.isActive,
      });
      loadVillages();
    } catch (_err) {
      // Ignore
    }
  };

  const handleDeleteVillage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this village?")) return;
    try {
      await villageService.deleteVillage(id);
      loadVillages();
    } catch (_err) {
      // Ignore
    }
  };

  const filteredVillages = villages.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.pincode.includes(searchQuery),
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B302B]">Village & Delivery Charge Management</h1>
          <p className="text-xs text-[#7A6E65]">
            Set custom delivery charges and thresholds for each individual village / service area.
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Add New Village</span>
        </Button>
      </div>

      {errorMsg ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-800 font-bold ml-2 text-sm leading-none"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ) : null}

      {/* Filter / Search Bar */}
      <Card className="flex items-center gap-3 p-3">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by Village Name, District, or Pincode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#3B302B] outline-none"
        />
      </Card>

      {/* Villages List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : filteredVillages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVillages.map((village) => (
            <Card key={village.id} className="space-y-3 relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FFF8EC] text-[#596B58]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#3B302B]">{village.name}</h3>
                    <p className="text-xs text-[#7A6E65]">District: {village.district} &bull; {village.pincode}</p>
                  </div>
                </div>
                <Badge variant={village.isActive ? "success" : "neutral"}>
                  {village.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* Village Delivery Charge Box */}
              <div className="p-2.5 bg-[#FFF8EC] rounded-xl border border-[#E5DEC9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#3B302B] font-bold">
                  <Truck className="h-4 w-4 text-[#596B58]" />
                  <span>Fee: ₹{village.deliveryCharge ?? 49}</span>
                </div>
                <span className="text-[11px] text-[#7A6E65]">
                  Free &gt; ₹{village.freeDeliveryThreshold ?? 799}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between text-xs text-[#7A6E65]">
                <span>Status: <strong>{village.isActive ? "Serving" : "Disabled"}</strong></span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(village)}
                    title="Edit Village Delivery Charge"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-[#596B58] hover:bg-[#FFF8EC] transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4 text-[#596B58]" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(village)}
                    title={village.isActive ? "Deactivate Village" : "Activate Village"}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#596B58] hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {village.isActive ? (
                      <XCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteVillage(village.id)}
                    title="Delete Village"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12 space-y-3 border-dashed">
          <MapPin className="h-10 w-10 text-[#596B58] mx-auto opacity-50" />
          <p className="text-sm font-bold text-[#3B302B]">No Villages Found</p>
          <p className="text-xs text-[#7A6E65]">
            {searchQuery ? "No village matches your search criteria." : "Click 'Add New Village' to create your first village."}
          </p>
        </Card>
      )}

      {/* Add Village Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Village & Set Delivery Charge">
        <form onSubmit={villageForm.handleSubmit(handleAddVillage)} className="space-y-4 pt-2">
          <Input
            label="Village Name *"
            placeholder="e.g. Rampur"
            {...villageForm.register("name")}
            error={villageForm.formState.errors.name?.message}
          />

          <Input
            label="District Name *"
            placeholder="e.g. Hamirpur / Central"
            {...villageForm.register("district")}
            error={villageForm.formState.errors.district?.message}
          />

          <Input
            label="Pincode *"
            placeholder="210502"
            maxLength={6}
            {...villageForm.register("pincode")}
            error={villageForm.formState.errors.pincode?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Charge (₹) *"
              type="number"
              min={0}
              placeholder="49"
              {...villageForm.register("deliveryCharge", { valueAsNumber: true })}
              error={villageForm.formState.errors.deliveryCharge?.message}
            />

            <Input
              label="Free Delivery Above (₹)"
              type="number"
              min={0}
              placeholder="799"
              {...villageForm.register("freeDeliveryThreshold", { valueAsNumber: true })}
              error={villageForm.formState.errors.freeDeliveryThreshold?.message}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              {...villageForm.register("isActive")}
              className="rounded border-gray-300 text-[#596B58]"
            />
            <span>Active for customer selection & delivery</span>
          </label>

          <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>
            Save Village
          </Button>
        </form>
      </Modal>

      {/* Edit Village Modal */}
      <Modal
        isOpen={Boolean(editingVillage)}
        onClose={() => setEditingVillage(null)}
        title={`Edit Delivery Fee for ${editingVillage?.name || "Village"}`}
      >
        <form onSubmit={editForm.handleSubmit(handleUpdateVillage)} className="space-y-4 pt-2">
          <Input
            label="Village Name *"
            {...editForm.register("name")}
            error={editForm.formState.errors.name?.message}
          />

          <Input
            label="District Name *"
            {...editForm.register("district")}
            error={editForm.formState.errors.district?.message}
          />

          <Input
            label="Pincode *"
            maxLength={6}
            {...editForm.register("pincode")}
            error={editForm.formState.errors.pincode?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Delivery Charge (₹) *"
              type="number"
              min={0}
              placeholder="49"
              {...editForm.register("deliveryCharge", { valueAsNumber: true })}
              error={editForm.formState.errors.deliveryCharge?.message}
            />

            <Input
              label="Free Delivery Above (₹)"
              type="number"
              min={0}
              placeholder="799"
              {...editForm.register("freeDeliveryThreshold", { valueAsNumber: true })}
              error={editForm.formState.errors.freeDeliveryThreshold?.message}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              {...editForm.register("isActive")}
              className="rounded border-gray-300 text-[#596B58]"
            />
            <span>Active for customer delivery</span>
          </label>

          <Button type="submit" className="w-full mt-4" isLoading={isSubmitting}>
            Update Village & Delivery Fee
          </Button>
        </form>
      </Modal>
    </div>
  );
};
