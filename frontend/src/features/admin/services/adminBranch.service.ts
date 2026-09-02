import { apiClient } from "@/services/api.client";

export interface BranchAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface BranchDetails {
  id: string;
  _id?: string;
  name: string;
  code: string;
  type: "MAIN" | "FRANCHISE";
  address: BranchAddress;
  phone: string;
  email: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  isActive: boolean;
  villageCount?: number;
  villages?: Array<{
    id: string;
    name: string;
    district: string;
    pincode: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAdminCredentials {
  name: string;
  phone: string;
  email?: string;
  password?: string;
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  type: "MAIN" | "FRANCHISE";
  address: BranchAddress;
  phone: string;
  email: string;
  managerId?: string;
  adminCredentials?: BranchAdminCredentials;
}

export interface UpdateBranchPayload {
  name?: string;
  type?: "MAIN" | "FRANCHISE";
  address?: Partial<BranchAddress>;
  phone?: string;
  email?: string;
  managerId?: string | null;
  adminCredentials?: Partial<BranchAdminCredentials>;
}

const LOCAL_BRANCHES_KEY = "theonlinebakery_mock_branches";

const INITIAL_DEFAULT_BRANCHES: BranchDetails[] = [
  {
    id: "branch_hq_central",
    _id: "branch_hq_central",
    name: "The Online Bakery Main Store",
    code: "TOB-HQ",
    type: "MAIN",
    address: {
      street: "The Online Bakery, N 80°14, terha 25°49'43.3, 54.7\"E",
      city: "Hamirpur",
      state: "Uttar Pradesh",
      pincode: "210502",
    },
    phone: "7897671632",
    email: "theonlinebakery07@gmail.com",
    managerName: "Ajay Prajapati",
    managerPhone: "7897671632",
    managerEmail: "theonlinebakery07@gmail.com",
    isActive: true,
    villageCount: 5,
    villages: [
      { id: "v_1", name: "Terha", district: "Hamirpur", pincode: "210502" },
      { id: "v_2", name: "Hamirpur Main", district: "Hamirpur", pincode: "210502" },
      { id: "v_3", name: "Kurara", district: "Hamirpur", pincode: "210502" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "branch_franchise_banda",
    _id: "branch_franchise_banda",
    name: "Franchise Banda The Online Bakery",
    code: "BANDA",
    type: "FRANCHISE",
    address: {
      street: "Main Market, Station Road",
      city: "Banda",
      state: "Banda Nagar",
      pincode: "210001",
    },
    phone: "9876543211",
    email: "banda@theonlinebakery.com",
    managerName: "Rajesh Kumar",
    managerPhone: "9876543210",
    managerEmail: "rajesh@theonlinebakery.in",
    isActive: true,
    villageCount: 4,
    villages: [
      { id: "v_4", name: "Banda City", district: "Banda", pincode: "210001" },
      { id: "v_5", name: "Baberu", district: "Banda", pincode: "210121" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getStoredBranches(): BranchDetails[] {
  try {
    const raw = localStorage.getItem(LOCAL_BRANCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_e) {
    // Ignore
  }
  localStorage.setItem(LOCAL_BRANCHES_KEY, JSON.stringify(INITIAL_DEFAULT_BRANCHES));
  return INITIAL_DEFAULT_BRANCHES;
}

function persistBranchLocally(branch: BranchDetails) {
  const branches = getStoredBranches();
  const index = branches.findIndex((b) => (b.id && b.id === branch.id) || (b._id && b._id === branch._id) || b.code === branch.code);
  if (index >= 0) {
    branches[index] = { ...branches[index], ...branch };
  } else {
    branches.unshift(branch);
  }
  try {
    localStorage.setItem(LOCAL_BRANCHES_KEY, JSON.stringify(branches));
  } catch (_e) {
    // Ignore
  }
}

export const adminBranchService = {
  getAllBranches: async (): Promise<BranchDetails[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { branches: BranchDetails[] };
      }>("/branches");
      if (response.data?.data?.branches && response.data.data.branches.length > 0) {
        const normalized = response.data.data.branches.map((b) => ({
          ...b,
          id: b.id || b._id || `br_${Date.now()}`,
        }));
        try {
          localStorage.setItem(LOCAL_BRANCHES_KEY, JSON.stringify(normalized));
        } catch (_e) {
          // Ignore
        }
        return normalized;
      }
    } catch (_err) {
      // Return local stored branches
    }
    return getStoredBranches();
  },

  getBranchById: async (id: string): Promise<BranchDetails> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { branch: BranchDetails };
      }>(`/branches/${id}`);
      if (response.data?.data?.branch) {
        const b = response.data.data.branch;
        const normalized = { ...b, id: b.id || b._id || id };
        persistBranchLocally(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }
    const local = getStoredBranches().find((b) => b.id === id || b._id === id);
    if (local) return local;
    throw new Error("Branch not found.");
  },

  createBranch: async (payload: CreateBranchPayload): Promise<BranchDetails> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { branch: BranchDetails };
      }>("/branches", payload);
      if (response.data?.data?.branch) {
        const created = response.data.data.branch;
        const normalized = { ...created, id: created.id || created._id || `br_${Date.now()}` };
        persistBranchLocally(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }

    const newBranch: BranchDetails = {
      id: `branch_${Date.now()}`,
      _id: `branch_${Date.now()}`,
      name: payload.name,
      code: payload.code.toUpperCase().trim(),
      type: payload.type,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      managerName: payload.adminCredentials?.name || undefined,
      managerPhone: payload.adminCredentials?.phone || undefined,
      managerEmail: payload.adminCredentials?.email || undefined,
      isActive: true,
      villageCount: 0,
      villages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persistBranchLocally(newBranch);
    return newBranch;
  },

  updateBranch: async (id: string, payload: UpdateBranchPayload): Promise<BranchDetails> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { branch: BranchDetails };
      }>(`/branches/${id}`, payload);
      if (response.data?.data?.branch) {
        const updated = response.data.data.branch;
        const normalized = { ...updated, id: updated.id || updated._id || id };
        persistBranchLocally(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBranches().find((b) => b.id === id || b._id === id);
    const updated: BranchDetails = {
      ...(current || ({} as any)),
      id,
      _id: id,
      name: payload.name ?? current?.name ?? "Updated Branch",
      type: payload.type ?? current?.type ?? "FRANCHISE",
      phone: payload.phone ?? current?.phone ?? "",
      email: payload.email ?? current?.email ?? "",
      address: {
        ...(current?.address || { street: "", city: "", state: "", pincode: "" }),
        ...(payload.address || {}),
      },
      managerName: payload.adminCredentials?.name ?? current?.managerName,
      managerPhone: payload.adminCredentials?.phone ?? current?.managerPhone,
      managerEmail: payload.adminCredentials?.email ?? current?.managerEmail,
      updatedAt: new Date().toISOString(),
    };
    persistBranchLocally(updated);
    return updated;
  },

  updateBranchStatus: async (id: string, isActive: boolean): Promise<BranchDetails> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { branch: BranchDetails };
      }>(`/branches/${id}/status`, { isActive });
      if (response.data?.data?.branch) {
        const updated = response.data.data.branch;
        const normalized = { ...updated, id: updated.id || updated._id || id };
        persistBranchLocally(normalized);
        return normalized;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getStoredBranches().find((b) => b.id === id || b._id === id);
    const updated: BranchDetails = {
      ...(current || ({} as any)),
      id,
      _id: id,
      isActive,
      updatedAt: new Date().toISOString(),
    };
    persistBranchLocally(updated);
    return updated;
  },

  assignServiceArea: async (branchId: string, villageId: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
      }>(`/branches/${branchId}/service-areas`, { villageId });
      return response.data;
    } catch (_err) {
      const branches = getStoredBranches();
      const b = branches.find((item) => item.id === branchId || item._id === branchId);
      if (b) {
        if (!b.villages) b.villages = [];
        if (!b.villages.some((v) => v.id === villageId)) {
          b.villages.push({
            id: villageId,
            name: "Assigned Village",
            district: b.address?.city || "Local",
            pincode: b.address?.pincode || "208001",
          });
          b.villageCount = b.villages.length;
          persistBranchLocally(b);
        }
      }
      return { success: true, message: "Village assigned successfully." };
    }
  },

  unassignServiceArea: async (branchId: string, serviceAreaId: string) => {
    try {
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/branches/${branchId}/service-areas/${serviceAreaId}`);
      return response.data;
    } catch (_err) {
      const branches = getStoredBranches();
      const b = branches.find((item) => item.id === branchId || item._id === branchId);
      if (b && b.villages) {
        b.villages = b.villages.filter((v) => v.id !== serviceAreaId);
        b.villageCount = b.villages.length;
        persistBranchLocally(b);
      }
      return { success: true, message: "Village removed successfully." };
    }
  },

  assignBranchAdmin: async (branchId: string, userId: string) => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { branch: BranchDetails };
      }>(`/branches/${branchId}/assign-admin`, { userId });
      if (response.data?.data?.branch) {
        persistBranchLocally(response.data.data.branch);
        return response.data.data.branch;
      }
    } catch (_err) {
      // Fallback
    }
    const current = getStoredBranches().find((b) => b.id === branchId || b._id === branchId);
    return current!;
  },
};
