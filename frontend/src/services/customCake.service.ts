import { apiClient } from "./api.client";

export interface CustomCakeOption {
  _id?: string;
  id?: string;
  name: string;
  type: "FLAVOR" | "DESIGN" | "SHAPE" | "TIER";
  slug: string;
  description?: string;
  priceModifier: number;
  category?: string;
  imageUrl?: string;
  colorCode?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CustomCakeInquiry {
  _id: string;
  inquiryNumber: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tiers: number;
  shape?: string;
  flavor?: string;
  designTheme?: string;
  weightKg?: number;
  isEggless: boolean;
  cakeMessage?: string;
  queryText: string;
  referenceImageUrl?: string;
  estimatedPrice?: number;
  budgetRange?: string;
  eventDate?: string;
  occasion?: string;
  status: "PENDING" | "REVIEWED" | "QUOTED" | "ACCEPTED" | "REJECTED" | "CONVERTED";
  adminNotes?: string;
  adminRecommendation?: {
    recommendedProductId?: {
      _id: string;
      name: string;
      slug: string;
      price: number;
      thumbnailUrl?: string;
      mainImage?: string;
    };
    recommendedCakeTitle?: string;
    quotedPrice?: number;
    message?: string;
    recommendedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubmitInquiryPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tiers?: number;
  shape?: string;
  flavor?: string;
  designTheme?: string;
  weightKg?: number;
  isEggless?: boolean;
  cakeMessage?: string;
  queryText: string;
  referenceImageUrl?: string;
  estimatedPrice?: number;
  budgetRange?: string;
  eventDate?: string;
  occasion?: string;
}

export const FALLBACK_FLAVORS: CustomCakeOption[] = [
  {
    id: "flv_1",
    _id: "flv_1",
    name: "Belgian Dark Chocolate Ganache",
    type: "FLAVOR",
    slug: "belgian-dark-chocolate",
    description: "Rich 70% pure Belgian cocoa ganache layered with moist sponge.",
    priceModifier: 750,
    category: "Chocolate Indulgence",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
    colorCode: "#3E2723",
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "flv_2",
    _id: "flv_2",
    name: "Classic Red Velvet Cream Cheese",
    type: "FLAVOR",
    slug: "classic-red-velvet",
    description: "Crimson cocoa sponge infused with velvety Philadelphia cream cheese.",
    priceModifier: 650,
    category: "Signature Classics",
    imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#B71C1C",
    isActive: true,
    displayOrder: 2,
  },
  {
    id: "flv_3",
    _id: "flv_3",
    name: "Fresh Blueberry Cheesecake Swirl",
    type: "FLAVOR",
    slug: "fresh-blueberry-cheesecake",
    description: "Graham crust base, creamy NY cheesecake with wild blueberry compote.",
    priceModifier: 750,
    category: "Fruit & Exotic",
    imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80",
    colorCode: "#4A148C",
    isActive: true,
    displayOrder: 3,
  },
  {
    id: "flv_4",
    _id: "flv_4",
    name: "Madagascar Vanilla Bean & Berries",
    type: "FLAVOR",
    slug: "madagascar-vanilla-berries",
    description: "Real bourbon vanilla sponge layered with strawberry & raspberry crush.",
    priceModifier: 600,
    category: "Signature Classics",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
    colorCode: "#F5EE9E",
    isActive: true,
    displayOrder: 4,
  },
  {
    id: "flv_5",
    _id: "flv_5",
    name: "Pistachio Raspberry Royale",
    type: "FLAVOR",
    slug: "pistachio-raspberry-royale",
    description: "Roasted Iranian pistachio mousse coupled with tart raspberry coulis.",
    priceModifier: 850,
    category: "Luxury Nuts",
    imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#558B2F",
    isActive: true,
    displayOrder: 5,
  },
  {
    id: "flv_6",
    _id: "flv_6",
    name: "Butterscotch Caramel Crunch",
    type: "FLAVOR",
    slug: "butterscotch-caramel-crunch",
    description: "Golden praline butterscotch crunch with warm salted caramel layers.",
    priceModifier: 600,
    category: "Signature Classics",
    imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80",
    colorCode: "#FF8F00",
    isActive: true,
    displayOrder: 6,
  },
  {
    id: "flv_7",
    _id: "flv_7",
    name: "Ferrero Rocher & Hazelnut Praline",
    type: "FLAVOR",
    slug: "ferrero-rocher-hazelnut",
    description: "Nutella ganache, toasted Italian hazelnuts & wafer crunch pearls.",
    priceModifier: 850,
    category: "Chocolate Indulgence",
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80",
    colorCode: "#4E342E",
    isActive: true,
    displayOrder: 7,
  },
  {
    id: "flv_8",
    _id: "flv_8",
    name: "Fresh Fruit Cocktail Supreme",
    type: "FLAVOR",
    slug: "fresh-fruit-cocktail-supreme",
    description: "Light chiffon sponge loaded with kiwi, seasonal berries, mango and pineapple.",
    priceModifier: 650,
    category: "Fruit & Exotic",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=400&q=80",
    colorCode: "#495948",
    isActive: true,
    displayOrder: 8,
  },
];

export const FALLBACK_DESIGNS: CustomCakeOption[] = [
  {
    id: "dsg_1",
    _id: "dsg_1",
    name: "Royal Gold Drip & Macarons",
    type: "DESIGN",
    slug: "royal-gold-drip-macarons",
    description: "24k edible gold foil accents, chocolate drip, luxury French macarons & sprinkles.",
    priceModifier: 350,
    category: "Luxury Celebration",
    imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=400&q=80",
    colorCode: "#D4AF37",
    isActive: true,
    displayOrder: 1,
  },
  {
    id: "dsg_2",
    _id: "dsg_2",
    name: "Minimalist Korean Vintage Pastels",
    type: "DESIGN",
    slug: "minimalist-korean-vintage",
    description: "Smooth pastel cream frosting, vintage border piping, retro handwriting message plaque.",
    priceModifier: 200,
    category: "Trendy & Aesthetic",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
    colorCode: "#F8BBD0",
    isActive: true,
    displayOrder: 2,
  },
  {
    id: "dsg_3",
    _id: "dsg_3",
    name: "Enchanted Floral Meadow",
    type: "DESIGN",
    slug: "enchanted-floral-meadow",
    description: "Organic edible flowers, rosemary sprigs, buttercream floral cascade & pearls.",
    priceModifier: 400,
    category: "Weddings & Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=400&q=80",
    colorCode: "#E8F5E9",
    isActive: true,
    displayOrder: 3,
  },
  {
    id: "dsg_4",
    _id: "dsg_4",
    name: "Kids Magical Fantasy & Cartoon",
    type: "DESIGN",
    slug: "kids-magical-fantasy",
    description: "Vibrant colors, customized fondant 2D/3D cutouts, rainbow sprinkles & chocolate gems.",
    priceModifier: 300,
    category: "Kids & Fun",
    imageUrl: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#80DEEA",
    isActive: true,
    displayOrder: 4,
  },
  {
    id: "dsg_5",
    _id: "dsg_5",
    name: "Rustic Semi-Naked Botanical",
    type: "DESIGN",
    slug: "rustic-semi-naked",
    description: "Exposed rustic sponge edges, light vanilla crumb coat, fresh eucalyptus & figs.",
    priceModifier: 150,
    category: "Weddings & Anniversaries",
    imageUrl: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=400&q=80",
    colorCode: "#D7CCC8",
    isActive: true,
    displayOrder: 5,
  },
  {
    id: "dsg_6",
    _id: "dsg_6",
    name: "Custom Edible Photo / Plaque Print",
    type: "DESIGN",
    slug: "custom-edible-photo-print",
    description: "High-definition food-safe sugar sheet printing with ornate buttercream framing.",
    priceModifier: 250,
    category: "Personalized",
    imageUrl: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=400&q=80",
    colorCode: "#ECEFF1",
    isActive: true,
    displayOrder: 6,
  },
];

const LOCAL_OPTIONS_KEY = "theonlinebakery_custom_cake_options";
const LOCAL_INQUIRIES_KEY = "theonlinebakery_custom_cake_inquiries";

function getLocalOptions(type?: string): CustomCakeOption[] {
  try {
    const raw = localStorage.getItem(LOCAL_OPTIONS_KEY);
    if (raw) {
      const all: CustomCakeOption[] = JSON.parse(raw);
      if (type) return all.filter((o) => o.type === type);
      return all;
    }
  } catch (_e) {
    // Ignore
  }
  const initial = [...FALLBACK_FLAVORS, ...FALLBACK_DESIGNS];
  try {
    localStorage.setItem(LOCAL_OPTIONS_KEY, JSON.stringify(initial));
  } catch (_e) {
    // Ignore
  }
  if (type) return initial.filter((o) => o.type === type);
  return initial;
}

function saveLocalOption(option: CustomCakeOption): CustomCakeOption {
  const current = getLocalOptions();
  const index = current.findIndex((o) => (o.id && o.id === option.id) || (o._id && o._id === option._id) || o.slug === option.slug);
  if (index >= 0) {
    current[index] = { ...current[index], ...option };
  } else {
    current.unshift(option);
  }
  try {
    localStorage.setItem(LOCAL_OPTIONS_KEY, JSON.stringify(current));
  } catch (_e) {
    // Ignore
  }
  return option;
}

function deleteLocalOption(id: string) {
  const current = getLocalOptions();
  const filtered = current.filter((o) => o.id !== id && o._id !== id);
  try {
    localStorage.setItem(LOCAL_OPTIONS_KEY, JSON.stringify(filtered));
  } catch (_e) {
    // Ignore
  }
}

function getLocalInquiries(): CustomCakeInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_e) {
    // Ignore
  }
  return [];
}

function saveLocalInquiry(inquiry: CustomCakeInquiry): CustomCakeInquiry {
  const current = getLocalInquiries();
  const index = current.findIndex((i) => i._id === inquiry._id || i.inquiryNumber === inquiry.inquiryNumber);
  if (index >= 0) {
    current[index] = { ...current[index], ...inquiry };
  } else {
    current.unshift(inquiry);
  }
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(current));
  } catch (_e) {
    // Ignore
  }
  return inquiry;
}

function deleteLocalInquiry(id: string) {
  const current = getLocalInquiries();
  const filtered = current.filter((i) => i._id !== id);
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(filtered));
  } catch (_e) {
    // Ignore
  }
}

export const customCakeService = {
  // Public
  getOptions: async (type?: "FLAVOR" | "DESIGN" | "SHAPE" | "TIER"): Promise<CustomCakeOption[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { options: CustomCakeOption[] };
      }>("/custom-cake/options", { params: { type } });
      if (response.data?.data?.options && response.data.data.options.length > 0) {
        return response.data.data.options;
      }
    } catch (_err) {
      // Return local stored options
    }
    return getLocalOptions(type);
  },

  submitInquiry: async (payload: SubmitInquiryPayload): Promise<CustomCakeInquiry> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: { inquiry: CustomCakeInquiry };
      }>("/custom-cake/inquiries", payload);
      if (response.data?.data?.inquiry) {
        saveLocalInquiry(response.data.data.inquiry);
        return response.data.data.inquiry;
      }
    } catch (_err) {
      // Fallback local inquiry
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const mockInquiry: CustomCakeInquiry = {
      _id: `inq_${Date.now()}`,
      inquiryNumber: `CC-${new Date().getFullYear()}-${randomNum}`,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      tiers: payload.tiers || 1,
      shape: payload.shape || "Round",
      flavor: payload.flavor,
      designTheme: payload.designTheme,
      weightKg: payload.weightKg || 0.5,
      isEggless: payload.isEggless ?? true,
      cakeMessage: payload.cakeMessage,
      queryText: payload.queryText,
      referenceImageUrl: payload.referenceImageUrl,
      estimatedPrice: payload.estimatedPrice,
      budgetRange: payload.budgetRange,
      eventDate: payload.eventDate,
      occasion: payload.occasion,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalInquiry(mockInquiry);
    return mockInquiry;
  },

  trackInquiry: async (ticketNumber: string): Promise<CustomCakeInquiry> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { inquiry: CustomCakeInquiry };
      }>(`/custom-cake/inquiries/track/${encodeURIComponent(ticketNumber)}`);
      if (response.data?.data?.inquiry) {
        return response.data.data.inquiry;
      }
    } catch (_err) {
      // Check local
    }
    const local = getLocalInquiries().find((i) => i.inquiryNumber.toUpperCase() === ticketNumber.toUpperCase());
    if (local) return local;
    throw new Error("Inquiry not found.");
  },

  // Admin Options
  adminGetOptions: async (type?: string): Promise<CustomCakeOption[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { options: CustomCakeOption[] };
      }>("/custom-cake/admin/options", { params: { type } });
      if (response.data?.data?.options && response.data.data.options.length > 0) {
        return response.data.data.options;
      }
    } catch (_err) {
      // Fallback
    }
    return getLocalOptions(type);
  },

  adminCreateOption: async (payload: Partial<CustomCakeOption>): Promise<CustomCakeOption> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { option: CustomCakeOption };
      }>("/custom-cake/admin/options", payload);
      if (response.data?.data?.option) {
        saveLocalOption(response.data.data.option);
        return response.data.data.option;
      }
    } catch (_err) {
      // Fallback
    }

    const newOpt: CustomCakeOption = {
      id: `opt_${Date.now()}`,
      _id: `opt_${Date.now()}`,
      name: payload.name || "Untitled Flavor",
      type: payload.type || "FLAVOR",
      slug: payload.slug || payload.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `opt-${Date.now()}`,
      description: payload.description || "",
      priceModifier: payload.priceModifier || 600,
      category: payload.category || "General",
      imageUrl: payload.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80",
      colorCode: payload.colorCode || "#596B58",
      isActive: payload.isActive ?? true,
      displayOrder: payload.displayOrder || 10,
    };
    saveLocalOption(newOpt);
    return newOpt;
  },

  adminUpdateOption: async (id: string, payload: Partial<CustomCakeOption>): Promise<CustomCakeOption> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { option: CustomCakeOption };
      }>(`/custom-cake/admin/options/${id}`, payload);
      if (response.data?.data?.option) {
        saveLocalOption(response.data.data.option);
        return response.data.data.option;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalOptions().find((o) => o.id === id || o._id === id);
    const updated = {
      ...(current || {}),
      ...payload,
      id,
      _id: id,
    } as CustomCakeOption;
    saveLocalOption(updated);
    return updated;
  },

  adminDeleteOption: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/custom-cake/admin/options/${id}`);
    } catch (_err) {
      // Ignore
    }
    deleteLocalOption(id);
  },

  // Admin Inquiries
  adminGetInquiries: async (filters?: { status?: string; search?: string }): Promise<CustomCakeInquiry[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { inquiries: CustomCakeInquiry[] };
      }>("/custom-cake/admin/inquiries", { params: filters });
      if (response.data?.data?.inquiries) {
        return response.data.data.inquiries;
      }
    } catch (_err) {
      // Fallback
    }
    let local = getLocalInquiries();
    if (filters?.status && filters.status !== "ALL") {
      local = local.filter((i) => i.status === filters.status);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      local = local.filter(
        (i) =>
          i.inquiryNumber.toLowerCase().includes(term) ||
          i.customerName.toLowerCase().includes(term) ||
          i.customerPhone.includes(term) ||
          (i.queryText && i.queryText.toLowerCase().includes(term)),
      );
    }
    return local;
  },

  adminGetInquiryById: async (id: string): Promise<CustomCakeInquiry> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { inquiry: CustomCakeInquiry };
      }>(`/custom-cake/admin/inquiries/${id}`);
      if (response.data?.data?.inquiry) {
        return response.data.data.inquiry;
      }
    } catch (_err) {
      // Fallback
    }
    const local = getLocalInquiries().find((i) => i._id === id);
    if (local) return local;
    throw new Error("Inquiry not found.");
  },

  adminUpdateInquiry: async (
    id: string,
    payload: {
      status?: string;
      adminNotes?: string;
      adminRecommendation?: {
        recommendedProductId?: string;
        recommendedCakeTitle?: string;
        quotedPrice?: number;
        message?: string;
      };
    },
  ): Promise<CustomCakeInquiry> => {
    try {
      const response = await apiClient.patch<{
        success: boolean;
        data: { inquiry: CustomCakeInquiry };
      }>(`/custom-cake/admin/inquiries/${id}`, payload);
      if (response.data?.data?.inquiry) {
        saveLocalInquiry(response.data.data.inquiry);
        return response.data.data.inquiry;
      }
    } catch (_err) {
      // Fallback
    }

    const current = getLocalInquiries().find((i) => i._id === id);
    const updated: CustomCakeInquiry = {
      ...(current || ({} as any)),
      _id: id,
      status: (payload.status as any) || current?.status || "PENDING",
      adminNotes: payload.adminNotes ?? current?.adminNotes,
      adminRecommendation: payload.adminRecommendation
        ? {
            ...payload.adminRecommendation,
            recommendedAt: new Date().toISOString(),
          }
        : current?.adminRecommendation,
      updatedAt: new Date().toISOString(),
    };
    saveLocalInquiry(updated);
    return updated;
  },

  adminDeleteInquiry: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/custom-cake/admin/inquiries/${id}`);
    } catch (_err) {
      // Ignore
    }
    deleteLocalInquiry(id);
  },
};
