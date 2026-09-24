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

const LOCAL_BRANCHES_KEY = "onebitebakery_mock_branches";

const INITIAL_DEFAULT_BRANCHES: BranchDetails[] = [
  {
    id: "branch_hq_central",
    _id: "branch_hq_central",
    name: "Onebite Bakery Main Store",
    code: "TOB-HQ",
    type: "MAIN",
    address: {
      street: "Onebite Bakery, N 80°14, terha 25°49'43.3, 54.7\"E",
      city: "Hamirpur",
      state: "Uttar Pradesh",
      pincode: "210502",
    },
    phone: "7897671632",
    email: "ajaykterha@gmail.com",
    managerName: "Ajay Prajapati",
    managerPhone: "7897671632",
    managerEmail: "ajaykterha@gmail.com",
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
    name: "Franchise Banda Onebite Bakery",
    code: "BANDA",
    type: "FRANCHISE",
    address: {
      street: "Main Market, Station Road",
      city: "Banda",
      state: "Banda Nagar",
      pincode: "210001",
    },
    phone: "9876543211",
    email: "banda@onebitebakery.com",
    managerName: "Rajesh Kumar",
    managerPhone: "9876543210",
    managerEmail: "rajesh@onebitebakery.in",
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
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_e) {
    // Ignore
  }
  return [];
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

const sanitizeBranch = (b: BranchDetails): BranchDetails => {
  const sanitizeStr = (s?: string) =>
    s ? s.replace(/The Online Bakery/gi, "Onebite Bakery").replace(/Online Bakery/gi, "Onebite Bakery") : "";
  return {
    ...b,
    id: b.id || b._id || "",
    name: sanitizeStr(b.name) || "Onebite Bakery",
    address: {
      ...b.address,
      street: sanitizeStr(b.address?.street),
      city: b.address?.city || "",
      state: b.address?.state || "",
      pincode: b.address?.pincode || "",
    },
  };
};

export const adminBranchService = {
  getAllBranches: async (): Promise<BranchDetails[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { branches: BranchDetails[] };
    }>("/branches");
    const list = response.data?.data?.branches || [];
    return list.map(sanitizeBranch);
  },

  getBranchById: async (id: string): Promise<BranchDetails> => {
    const response = await apiClient.get<{
      success: boolean;
      data: { branch: BranchDetails };
    }>(`/branches/${id}`);
    const b = response.data.data.branch;
    return sanitizeBranch({
      ...b,
      id: b.id || b._id || id,
    });
  },

  createBranch: async (payload: CreateBranchPayload): Promise<BranchDetails> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { branch: BranchDetails };
    }>("/branches", payload);
    const created = response.data.data.branch;
    return {
      ...created,
      id: created.id || created._id || "",
    };
  },

  updateBranch: async (id: string, payload: UpdateBranchPayload): Promise<BranchDetails> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { branch: BranchDetails };
    }>(`/branches/${id}`, payload);
    const updated = response.data.data.branch;
    return {
      ...updated,
      id: updated.id || updated._id || id,
    };
  },

  updateBranchStatus: async (id: string, isActive: boolean): Promise<BranchDetails> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: { branch: BranchDetails };
    }>(`/branches/${id}/status`, { isActive });
    const updated = response.data.data.branch;
    return {
      ...updated,
      id: updated.id || updated._id || id,
    };
  },

  assignServiceArea: async (branchId: string, villageId: string) => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data?: { village: unknown };
    }>(`/branches/${branchId}/service-areas`, { villageId });
    return response.data;
  },

  unassignServiceArea: async (branchId: string, serviceAreaId: string) => {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/branches/${branchId}/service-areas/${serviceAreaId}`);
    return response.data;
  },

  assignBranchAdmin: async (branchId: string, userId: string): Promise<BranchDetails> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { branch: BranchDetails };
    }>(`/branches/${branchId}/assign-admin`, { userId });
    return response.data.data.branch;
  },

  removeBranchAdmin: async (branchId: string, userId: string): Promise<BranchDetails> => {
    const response = await apiClient.delete<{
      success: boolean;
      data: { branch: BranchDetails };
    }>(`/branches/${branchId}/admin/${userId}`);
    return response.data.data.branch;
  },
};
