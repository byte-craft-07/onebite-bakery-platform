import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Plus,
  MapPin,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Search,
  Edit,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, Card, Skeleton } from "@/components/ui/DisplayComponents";
import { CustomSelect } from "@/components/ui/FormControls";
import {
  adminBranchService,
  type BranchDetails,
  type CreateBranchPayload,
} from "../services/adminBranch.service";
import { villageService, type Village } from "@/services/village.service";

export const AdminBranchManagementPage: React.FC = () => {
  const [branches, setBranches] = useState<BranchDetails[]>([]);
  const [unassignedVillages, setUnassignedVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchDetails | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState("");

  const [formData, setFormData] = useState<CreateBranchPayload>({
    name: "",
    code: "",
    type: "FRANCHISE",
    address: {
      street: "",
      city: "Kanpur",
      state: "Civil Lines",
      pincode: "208001",
    },
    phone: "9876543210",
    email: "",
  });

  const [adminCreds, setAdminCreds] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDetails | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    type: "MAIN" | "FRANCHISE";
    address: { street: string; city: string; state: string; pincode: string };
    phone: string;
    email: string;
  }>({
    name: "",
    type: "FRANCHISE",
    address: { street: "", city: "", state: "", pincode: "" },
    phone: "",
    email: "",
  });
  const [editAdminCreds, setEditAdminCreds] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const handleOpenEditModal = (branch: BranchDetails) => {
    setEditingBranch(branch);
    setEditFormData({
      name: branch.name,
      type: branch.type,
      address: {
        street: branch.address?.street || "",
        city: branch.address?.city || "Kanpur",
        state: branch.address?.state || "Civil Lines",
        pincode: branch.address?.pincode || "208001",
      },
      phone: branch.phone || "",
      email: branch.email || "",
    });
    setEditAdminCreds({
      name: branch.managerName || "",
      phone: branch.managerPhone || "",
      email: branch.managerEmail || "",
      password: "",
    });
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    if (!editFormData.name || !editFormData.email || !editFormData.address.street) {
      setEditFormError("Please fill in all required fields.");
      return;
    }

    setIsEditSubmitting(true);
    setEditFormError(null);

    try {
      await adminBranchService.updateBranch(editingBranch.id, {
        ...editFormData,
        ...(editAdminCreds.phone.trim()
          ? {
              adminCredentials: {
                name: editAdminCreds.name.trim() || editingBranch.name + " Admin",
                phone: editAdminCreds.phone.trim(),
                email: editAdminCreds.email.trim() || undefined,
                password: editAdminCreds.password.trim() || undefined,
              },
            }
          : {}),
      });
      setIsEditModalOpen(false);
      setEditingBranch(null);
      await fetchBranchesAndVillages();
    } catch (err: any) {
      setEditFormError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to update branch details.",
      );
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const fetchBranchesAndVillages = async () => {
    try {
      setIsLoading(true);
      const [bList, vList] = await Promise.all([
        adminBranchService.getAllBranches(),
        villageService.getVillages(),
      ]);
      setBranches(bList || []);
      setUnassignedVillages(vList || []);
    } catch (_err) {
      const fallback = await adminBranchService.getAllBranches();
      setBranches(fallback);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchBranchesAndVillages();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.email || !formData.address.street) {
      setFormError("Please fill in all required branch fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await adminBranchService.createBranch({
        ...formData,
        code: formData.code.toUpperCase().trim(),
        ...(adminCreds.name.trim() && adminCreds.phone.trim()
          ? {
              adminCredentials: {
                name: adminCreds.name.trim(),
                phone: adminCreds.phone.trim(),
                email: adminCreds.email.trim() || undefined,
                password: adminCreds.password.trim() || undefined,
              },
            }
          : {}),
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        code: "",
        type: "FRANCHISE",
        address: { street: "", city: "Guwahati", state: "Assam", pincode: "781001" },
        phone: "9876543210",
        email: "",
      });
      setAdminCreds({ name: "", phone: "", email: "", password: "" });
      await fetchBranchesAndVillages();
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data?.error?.message ||
          "Failed to create branch. Verify branch code uniqueness.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: BranchDetails) => {
    try {
      await adminBranchService.updateBranchStatus(branch.id, !branch.isActive);
      await fetchBranchesAndVillages();
    } catch (_err) {
      // Ignore
    }
  };

  const handleOpenManageVillages = async (branch: BranchDetails) => {
    setSelectedBranch(branch);
    try {
      const fullBranch = await adminBranchService.getBranchById(branch.id);
      setSelectedBranch(fullBranch);
    } catch (_e) {
      // Keep branch
    }
  };

  const handleAssignVillage = async () => {
    if (!selectedBranch || !selectedVillageId) return;
    try {
      await adminBranchService.assignServiceArea(selectedBranch.id, selectedVillageId);
      setSelectedVillageId("");
      const updatedBranch = await adminBranchService.getBranchById(selectedBranch.id);
      setSelectedBranch(updatedBranch);
      await fetchBranchesAndVillages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign village.");
    }
  };

  const [unassigningVillageId, setUnassigningVillageId] = useState<string | null>(null);

  const handleUnassignVillage = async (villageId: string) => {
    if (!selectedBranch || !villageId) return;
    setUnassigningVillageId(villageId);
    try {
      await adminBranchService.unassignServiceArea(selectedBranch.id, villageId);
      // Immediately remove from modal list
      setSelectedBranch((prev) =>
        prev
          ? {
              ...prev,
              villages: (prev.villages || []).filter(
                (v: any) => (v.id || v._id?.toString() || v._id) !== villageId,
              ),
              villageCount: Math.max(0, (prev.villageCount || 1) - 1),
            }
          : null,
      );
      const updatedBranch = await adminBranchService.getBranchById(selectedBranch.id);
      setSelectedBranch(updatedBranch);
      await fetchBranchesAndVillages();
    } catch (err: any) {
      console.error("Failed to unassign village:", err);
      alert(err?.response?.data?.message || "Failed to remove village from branch.");
    } finally {
      setUnassigningVillageId(null);
    }
  };

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedTypeFilter === "ALL" || b.type === selectedTypeFilter;

    const matchesStatus =
      selectedStatusFilter === "ALL" ||
      (selectedStatusFilter === "ACTIVE" ? b.isActive : !b.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#596B58]" />
            <h1 className="text-2xl font-extrabold text-[#3B302B]">
              Branch & Franchise Network
            </h1>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Manage Onebite Bakery Main and Franchise branches, service areas, and branch admin assignments.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Branch</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-[#E5DEC9]">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by branch name, code, district, or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="w-36">
            <CustomSelect
              value={selectedTypeFilter}
              onChange={(val) => setSelectedTypeFilter(val)}
              options={[
                { value: "ALL", label: "All Types" },
                { value: "MAIN", label: "MAIN" },
                { value: "FRANCHISE", label: "FRANCHISE" },
              ]}
            />
          </div>

          <div className="w-36">
            <CustomSelect
              value={selectedStatusFilter}
              onChange={(val) => setSelectedStatusFilter(val)}
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Branch Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map((branch) => (
          <Card key={branch.id} className="space-y-4 border-[#E5DEC9] relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#3B302B]">{branch.name}</span>
                    <Badge variant={branch.type === "MAIN" ? "primary" : "neutral"}>
                      {branch.type}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#7A6E65]">
                    Code: {branch.code}
                  </span>
                </div>

                <Badge variant={branch.isActive ? "success" : "danger"}>
                  {branch.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="text-xs text-[#7A6E65] space-y-1 bg-[#FFF8EC] p-3 rounded-xl border border-[#E5DEC9]/60">
                <p className="font-semibold text-[#3B302B]">📍 {branch.address.street}, {branch.address.city}</p>
                <p>📞 {branch.phone} &bull; ✉️ {branch.email}</p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-[#3B302B]">
                  <MapPin className="h-4 w-4 text-[#596B58]" />
                  <span className="font-semibold">{branch.villageCount ?? 0} Villages Served</span>
                </div>
                {branch.managerName ? (
                  <div className="flex items-center gap-1 text-xs text-[#27AE60] font-semibold">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{branch.managerName}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No Manager</span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(branch)}
                  className="text-xs flex items-center gap-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenManageVillages(branch)}
                  className="text-xs"
                >
                  Manage Villages
                </Button>

                <Link to="/admin/branch/orders">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1 border-[#596B58]/50 text-[#596B58] hover:bg-[#FFF8EC]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Orders</span>
                  </Button>
                </Link>
              </div>

              <Button
                variant={branch.isActive ? "danger" : "outline"}
                size="sm"
                onClick={() => handleToggleStatus(branch)}
                className="text-xs"
              >
                {branch.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Branch Modal */}
      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#FFF8EC] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-[#3B302B]">Create New Branch</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {formError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                  {formError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Branch Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Franchise Banda"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Branch Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BANDA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs font-mono uppercase bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <CustomSelect
                    label="Branch Type *"
                    value={formData.type}
                    onChange={(val) => setFormData({ ...formData, type: val as "MAIN" | "FRANCHISE" })}
                    options={[
                      { value: "FRANCHISE", label: "FRANCHISE" },
                      { value: "MAIN", label: "MAIN BRANCH" },
                    ]}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Phone Number *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3B302B]">Official Email *</label>
                <input
                  type="email"
                  placeholder="banda@onebitebakery.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3B302B]">Street Address *</label>
                <input
                  type="text"
                  placeholder="Main Market, Near Clock Tower"
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">District *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kanpur"
                    value={formData.address.city}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Village / Area *</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Lines"
                    value={formData.address.state}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Pincode *</label>
                  <input
                    type="text"
                    placeholder="e.g. 208001"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>
              </div>

              {/* Branch Admin Login Credentials Section */}
              <div className="bg-[#FFF8EC] p-3.5 rounded-xl border border-[#E5DEC9] space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-[#596B58]" />
                    <span>Branch Admin Credentials (For Login)</span>
                  </h3>
                  <p className="text-[11px] text-[#7A6E65]">
                    Set the Branch Admin account name & login phone. They will use this phone to log in to the Branch Admin portal.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={adminCreds.name}
                      onChange={(e) => setAdminCreds({ ...adminCreds, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Login Phone *</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={adminCreds.phone}
                      onChange={(e) => setAdminCreds({ ...adminCreds, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Login Email (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@onebitebakery.in"
                      value={adminCreds.email}
                      onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Login Password *</label>
                    <input
                      type="password"
                      placeholder="e.g. Branch@123"
                      value={adminCreds.password}
                      onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E5DEC9]">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Create Branch
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Branch Modal */}
      {isEditModalOpen && editingBranch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-[#FFF8EC] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-[#3B302B]">Edit Branch Details</h2>
                <p className="text-xs font-mono text-[#7A6E65]">Code: {editingBranch.code}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBranch(null);
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {editFormError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                  {editFormError}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Branch Name *</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <CustomSelect
                    label="Branch Type *"
                    value={editFormData.type}
                    onChange={(val) => setEditFormData({ ...editFormData, type: val as "MAIN" | "FRANCHISE" })}
                    options={[
                      { value: "FRANCHISE", label: "FRANCHISE" },
                      { value: "MAIN", label: "MAIN BRANCH" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Phone Number *</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Official Email *</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3B302B]">Street Address *</label>
                <input
                  type="text"
                  value={editFormData.address.street}
                  onChange={(e) => setEditFormData({ ...editFormData, address: { ...editFormData.address, street: e.target.value } })}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">District *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kanpur"
                    value={editFormData.address.city}
                    onChange={(e) => setEditFormData({ ...editFormData, address: { ...editFormData.address, city: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Village / Area *</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Lines"
                    value={editFormData.address.state}
                    onChange={(e) => setEditFormData({ ...editFormData, address: { ...editFormData.address, state: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3B302B]">Pincode *</label>
                  <input
                    type="text"
                    placeholder="e.g. 208001"
                    value={editFormData.address.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, address: { ...editFormData.address, pincode: e.target.value } })}
                    className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    required
                  />
                </div>
              </div>

              {/* Branch Admin Login Credentials Section */}
              <div className="bg-[#FFF8EC] p-3.5 rounded-xl border border-[#E5DEC9] space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-[#596B58]" />
                    <span>Branch Admin Credentials (For Login)</span>
                  </h3>
                  <p className="text-[11px] text-[#7A6E65]">
                    Assign or update Branch Admin login details. Use this phone number to log in as Branch Admin.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      value={editAdminCreds.name}
                      onChange={(e) => setEditAdminCreds({ ...editAdminCreds, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Login Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={editAdminCreds.phone}
                      onChange={(e) => setEditAdminCreds({ ...editAdminCreds, phone: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">Admin Login Email</label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@onebitebakery.in"
                      value={editAdminCreds.email}
                      onChange={(e) => setEditAdminCreds({ ...editAdminCreds, email: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3B302B]">New Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing"
                      value={editAdminCreds.password}
                      onChange={(e) => setEditAdminCreds({ ...editAdminCreds, password: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] text-xs bg-white focus:outline-none focus:border-[#596B58]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#E5DEC9]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBranch(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isEditSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Manage Villages Drawer / Modal */}
      {selectedBranch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-[#FFF8EC] rounded-2xl shadow-xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-[#3B302B]">{selectedBranch.name}</h2>
                <p className="text-xs text-[#7A6E65]">Service Area & Village Assignment</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBranch(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Assign Village Dropdown */}
              <div className="space-y-2 bg-white p-3.5 rounded-xl border border-[#E5DEC9]">
                <label className="block text-xs font-bold text-[#3B302B]">
                  Assign Active Village
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <CustomSelect
                      value={selectedVillageId}
                      onChange={(val) => setSelectedVillageId(val)}
                      placeholder="Select a village to assign..."
                      searchable={true}
                      options={unassignedVillages
                        .filter(
                          (v) =>
                            !selectedBranch.villages?.some(
                              (assigned: any) =>
                                (assigned.id || assigned._id?.toString() || assigned._id) ===
                                (v.id || (v as any)._id?.toString() || (v as any)._id),
                            ),
                        )
                        .map((v) => ({
                          value: v.id,
                          label: `${v.name} (${v.district})`,
                        }))}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAssignVillage}
                    disabled={!selectedVillageId}
                    className="h-11"
                  >
                    Assign
                  </Button>
                </div>
              </div>

              {/* Assigned Villages List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#3B302B]">
                  Currently Assigned Villages ({selectedBranch.villages?.length ?? 0})
                </h3>

                {!selectedBranch.villages || selectedBranch.villages.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-800 text-xs font-semibold rounded-xl text-center border border-amber-200">
                    No villages assigned yet. Add villages to start servicing orders in this branch.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {selectedBranch.villages.map((v: any) => {
                      const villageId = v.id || v._id?.toString() || v._id;
                      return (
                        <div
                          key={villageId || v.name}
                          className="flex items-center justify-between p-2.5 bg-white border border-[#E5DEC9] rounded-xl text-xs"
                        >
                          <div>
                            <strong className="text-[#3B302B]">{v.name}</strong>
                            <span className="text-gray-400 ml-1 font-medium">({v.district})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnassignVillage(villageId)}
                            disabled={unassigningVillageId === villageId}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-bold cursor-pointer"
                          >
                            {unassigningVillageId === villageId ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
