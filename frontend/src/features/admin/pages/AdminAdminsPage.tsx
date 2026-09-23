import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Crown,
  Key,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { Badge, Card, Modal, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  adminOperationsService,
  type AdminMember,
} from "@/features/admin/services/adminOperations.service";
import { adminBranchService } from "@/features/admin/services/adminBranch.service";
import { useToast } from "@/contexts/toast.context";
import { UserAvatar } from "@/components/common/UserAvatar";

const grantAdminSchema = z
  .object({
    name: z.string().trim().optional(),
    email: z.string().trim().email("Please enter a valid email address.").optional().or(z.literal("")),
    phone: z.string().trim().regex(/^[0-9]{10,15}$/, "Enter a valid 10-15 digit phone number.").optional().or(z.literal("")),
    role: z.enum(["admin", "branch_admin"]),
    branchId: z.string().optional(),
  })
  .refine((data) => (data.email && data.email.length > 0) || (data.phone && data.phone.length > 0), {
    message: "Either Email or Phone number is required to grant admin access.",
    path: ["email"],
  });

type GrantAdminFormData = z.infer<typeof grantAdminSchema>;

export const AdminAdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { addToast } = useToast();

  const form = useForm<GrantAdminFormData>({
    resolver: zodResolver(grantAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "admin",
      branchId: "",
    },
  });

  const selectedRole = form.watch("role");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [adminList, branchList] = await Promise.all([
        adminOperationsService.getAdmins(),
        adminBranchService.getAllBranches().catch(() => []),
      ]);
      setAdmins(adminList);
      setBranches(branchList);
    } catch (_err) {
      setErrorMsg("Failed to load admin team list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGrantAdmin = async (data: GrantAdminFormData) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        role: data.role,
        branchId: data.branchId || undefined,
      };
      if (data.name?.trim()) payload.name = data.name.trim();
      if (data.email?.trim()) payload.email = data.email.trim();
      if (data.phone?.trim()) payload.phone = data.phone.trim();

      const newAdmin = await adminOperationsService.grantAdminAccess(payload);
      addToast(
        "success",
        "Admin Access Granted",
        `Successfully granted ${data.role === "admin" ? "Central Admin" : "Branch Admin"} access to ${newAdmin.name} (${newAdmin.email || newAdmin.phone}).`,
      );
      setIsAddModalOpen(false);
      form.reset();
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to grant admin access.";
      setErrorMsg(msg);
      addToast("error", "Grant Access Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!selectedAdmin) return;
    setIsSubmitting(true);
    try {
      await adminOperationsService.revokeAdminAccess(selectedAdmin.id);
      addToast(
        "info",
        "Admin Access Revoked",
        `Revoked admin privileges for ${selectedAdmin.name}. Role set to customer.`,
      );
      setIsRevokeModalOpen(false);
      setSelectedAdmin(null);
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to revoke admin access.";
      addToast("error", "Revocation Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminMember) => {
    try {
      await adminOperationsService.toggleCustomerStatus(admin.id, admin.status);
      addToast(
        "success",
        "Status Updated",
        `${admin.name} is now ${admin.status === "active" ? "Blocked" : "Active"}.`,
      );
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to update status.";
      addToast("error", "Status Update Failed", msg);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.name.toLowerCase().includes(q) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.phone && a.phone.includes(q));

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "admin" && a.role === "admin") ||
      (roleFilter === "branch_admin" && a.role === "branch_admin");

    return matchesSearch && matchesRole;
  });

  const totalAdmins = admins.length;
  const centralAdmins = admins.filter((a) => a.role === "admin").length;
  const branchAdmins = admins.filter((a) => a.role === "branch_admin").length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#3B302B]">Admin Team & Access Delegation</h1>
            <Badge variant="primary" className="text-xs">
              {totalAdmins} Total Staff
            </Badge>
          </div>
          <p className="text-xs text-[#7A6E65] mt-1">
            Grant, manage, and revoke Admin Panel access to any email or phone number.
          </p>
        </div>

        <Button
          onClick={() => {
            setErrorMsg(null);
            form.reset({
              name: "",
              email: "",
              phone: "",
              role: "admin",
              branchId: "",
            });
            setIsAddModalOpen(true);
          }}
          className="bg-[#596B58] hover:bg-[#495948] text-white flex items-center gap-2 text-xs font-bold"
        >
          <UserPlus className="h-4 w-4" />
          <span>Grant New Admin Access</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-[#E5DEC9] bg-white flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#7A6E65] uppercase">Total Admin Staff</span>
            <p className="text-2xl font-black text-[#3B302B]">{totalAdmins}</p>
          </div>
        </Card>

        <Card className="p-4 border-[#E5DEC9] bg-white flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#7A6E65] uppercase">Central Admins</span>
            <p className="text-2xl font-black text-[#3B302B]">{centralAdmins}</p>
          </div>
        </Card>

        <Card className="p-4 border-[#E5DEC9] bg-white flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-800">
            <Building className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#7A6E65] uppercase">Branch Admins</span>
            <p className="text-2xl font-black text-[#3B302B]">{branchAdmins}</p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 border-[#E5DEC9] bg-white shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7A6E65]" />
            <input
              type="text"
              placeholder="Search admin by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-[#FFF8EC]/40 text-[#3B302B] focus:outline-none focus:border-[#596B58]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-none focus:border-[#596B58]"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Central Admins Only</option>
              <option value="branch_admin">Branch Admins Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Admin List Table */}
      <Card className="border-[#E5DEC9] bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShieldAlert className="h-10 w-10 text-[#7A6E65] mx-auto opacity-50" />
            <p className="text-sm font-bold text-[#3B302B]">No Admin Accounts Found</p>
            <p className="text-xs text-[#7A6E65]">
              {searchQuery ? "Try refining your search query." : "Click 'Grant New Admin Access' to delegate admin panel access to another email or phone."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5DEC9] bg-[#FFF8EC]/60 text-[#7A6E65] font-bold uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Admin User</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Role / Scope</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Added Date</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DEC9]">
                {filteredAdmins.map((admin) => {
                  const branchName = admin.branchId
                    ? branches.find((b) => b.id === admin.branchId || b._id === admin.branchId)?.name || "Assigned Branch"
                    : null;

                  return (
                    <tr key={admin.id} className="hover:bg-[#FFF8EC]/30 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={admin as any} size="sm" className="ring-1 ring-[#596B58]/30" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#3B302B] text-sm">{admin.name}</span>
                              {admin.isPrimaryOwner && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300 shadow-2xs">
                                  <Crown className="h-2.5 w-2.5 text-amber-600" />
                                  Primary Owner
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#7A6E65]">ID: {admin.id.slice(-8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {admin.email && (
                            <div className="flex items-center gap-1.5 text-[#3B302B] font-medium">
                              <Mail className="h-3.5 w-3.5 text-[#596B58]" />
                              <span>{admin.email}</span>
                            </div>
                          )}
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-[#7A6E65]">
                              <Phone className="h-3.5 w-3.5 text-[#7A6E65]" />
                              <span>+91 {admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          {admin.role === "admin" ? (
                            <Badge variant="warning" className="font-extrabold flex items-center gap-1 w-max">
                              <Shield className="h-3 w-3" />
                              <span>Central Super Admin</span>
                            </Badge>
                          ) : (
                            <Badge variant="primary" className="font-extrabold flex items-center gap-1 w-max">
                              <Building className="h-3 w-3" />
                              <span>Branch Admin</span>
                            </Badge>
                          )}
                          {branchName && (
                            <p className="text-[10px] text-[#7A6E65] font-semibold">📍 {branchName}</p>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            admin.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              admin.status === "active" ? "bg-emerald-600" : "bg-red-600"
                            }`}
                          />
                          {admin.status === "active" ? "Active Access" : "Blocked"}
                        </span>
                      </td>

                      <td className="p-3.5 text-[#7A6E65] font-medium">
                        {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        {admin.isPrimaryOwner ? (
                          <span className="text-[11px] font-bold text-[#7A6E65] italic">Permanent Owner</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(admin)}
                              className={`text-[11px] font-bold py-1 px-2 h-7 ${
                                admin.status === "active"
                                  ? "text-amber-700 hover:bg-amber-50 border-amber-300"
                                  : "text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                              }`}
                            >
                              {admin.status === "active" ? "Block Access" : "Unblock"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setIsRevokeModalOpen(true);
                              }}
                              className="text-[11px] font-bold text-red-600 hover:bg-red-50 border-red-200 py-1 px-2 h-7"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              <span>Revoke</span>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Grant Admin Access Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Grant Admin Panel Access"
      >
        <p className="text-xs text-[#7A6E65] -mt-2 mb-3">
          Authorize a team member by email or phone number to access the Bakery Administration Panel.
        </p>
        <form onSubmit={form.handleSubmit(handleGrantAdmin)} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">
              Admin / Staff Full Name <span className="text-[#7A6E65] font-normal">(Optional)</span>
            </label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Ajay Kumar"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Admin Email Address
              </label>
              <Input
                type="email"
                {...form.register("email")}
                placeholder="e.g. manager@gmail.com"
                className="text-xs"
              />
              {form.formState.errors.email && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Admin Phone Number
              </label>
              <Input
                type="tel"
                {...form.register("phone")}
                placeholder="e.g. 9876543210"
                className="text-xs"
              />
              {form.formState.errors.phone && (
                <p className="text-[10px] text-red-600 mt-1 font-semibold">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#7A6E65] italic">
            * Provide an email for Google sign-in. A phone number is optional contact information.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#3B302B] mb-1">
              Admin Access Level / Role
            </label>
            <select
              {...form.register("role")}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-none focus:border-[#596B58]"
            >
              <option value="admin">👑 Central Super Admin (Full Control: Orders, Catalog, Admins, Settings)</option>
              <option value="branch_admin">🏪 Branch Admin (Branch-specific Orders & Inventory)</option>
            </select>
          </div>

          {selectedRole === "branch_admin" && (
            <div>
              <label className="block text-xs font-bold text-[#3B302B] mb-1">
                Assign Branch Store
              </label>
              <select
                {...form.register("branchId")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5DEC9] bg-white text-[#3B302B] font-semibold focus:outline-none focus:border-[#596B58]"
              >
                <option value="">Select Branch Store...</option>
                {branches.map((b) => (
                  <option key={b.id || b._id} value={b.id || b._id}>
                    {b.name} ({b.code}) - {b.address?.city || "Bakery"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#596B58] hover:bg-[#495948] text-white font-bold"
            >
              {isSubmitting ? "Granting Access..." : "Grant Admin Access"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal
        isOpen={isRevokeModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsRevokeModalOpen(false);
        }}
        title="Revoke Admin Access"
      >
        <p className="text-xs text-[#7A6E65] -mt-2 mb-3">
          Are you sure you want to remove admin privileges from this account?
        </p>
        <div className="space-y-4 pt-2">
          {selectedAdmin && (
            <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-1">
              <p className="text-sm font-extrabold text-[#3B302B]">{selectedAdmin.name}</p>
              <p className="text-xs text-[#7A6E65]">
                {selectedAdmin.email || `Phone: +91 ${selectedAdmin.phone}`}
              </p>
              <p className="text-[11px] text-amber-800 font-semibold mt-1">
                Role will be demoted to regular Customer. They will no longer be able to log in to or view the Admin Panel.
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsRevokeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleRevokeConfirm}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {isSubmitting ? "Revoking..." : "Confirm & Revoke Access"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default AdminAdminsPage;
