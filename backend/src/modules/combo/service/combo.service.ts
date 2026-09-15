import { Types } from "mongoose";
import { type Combo } from "../model/combo.model.js";
import { comboRepository } from "../repository/combo.repository.js";

const DEFAULT_SEED_COMBOS: Partial<Combo>[] = [
  {
    title: "Birthday Party Celebration Combo",
    slug: "birthday-party-celebration-combo",
    description: "Curated celebration hamper with Belgian chocolate cake, assorted fresh macarons and festive party poppers.",
    items: ["1kg Belgian Chocolate Cake", "12 Assorted Macarons", "2 Party Poppers"],
    price: 1199,
    originalPrice: 1499,
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
    badge: "Popular Value",
    isActive: true,
    isAvailable: true,
    displayOrder: 1,
  },
  {
    title: "Romantic Anniversary Surprise Hamper",
    slug: "romantic-anniversary-surprise-hamper",
    description: "Special romantic delight with Red Velvet cake, chocolate truffles, and sparkling decoration candles.",
    items: ["1kg Red Velvet Heart Cake", "Box of 6 Truffle Pops", "Sparkler & Candles Pack"],
    price: 1349,
    originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    badge: "Anniversary Special",
    isActive: true,
    isAvailable: true,
    displayOrder: 2,
  },
  {
    title: "Weekend High-Tea French Pastry Box",
    slug: "weekend-high-tea-french-pastry-box",
    description: "Assortment of fresh French butter croissants, fruit tarts, cheesecake slices, and artisanal brioche.",
    items: ["4 French Butter Croissants", "4 Blueberry Tarts", "2 NY Cheesecake Slices"],
    price: 899,
    originalPrice: 1149,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    badge: "Chef Choice",
    isActive: true,
    isAvailable: true,
    displayOrder: 3,
  },
  {
    title: "Kids Theme Party Mega Celebration Bundle",
    slug: "kids-theme-party-mega-celebration-bundle",
    description: "Complete children's party package featuring pinata pull-me cake, cupcake pack, caps, and balloon garlands.",
    items: ["1.5kg Chocolate Pinata Hammer Cake", "12 Rainbow Cupcakes", "Party Caps & Balloon Garland"],
    price: 1799,
    originalPrice: 2299,
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80",
    badge: "Mega Saver",
    isActive: true,
    isAvailable: true,
    displayOrder: 4,
  },
];

export interface CreateComboInput {
  title: string;
  slug?: string;
  description?: string;
  items: string[];
  price: number;
  originalPrice: number;
  image: string;
  images?: string[];
  badge?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  displayOrder?: number;
}

export class ComboService {
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async ensureSeeded(): Promise<void> {
    const count = await comboRepository.count();
    if (count === 0) {
      for (const item of DEFAULT_SEED_COMBOS) {
        await comboRepository.create(item);
      }
    }
  }

  async getActiveCombos(): Promise<Combo[]> {
    await this.ensureSeeded();
    return comboRepository.findActive();
  }

  async getAllCombosAdmin(): Promise<Combo[]> {
    await this.ensureSeeded();
    return comboRepository.findAllAdmin();
  }

  async getComboById(idOrSlug: string): Promise<Combo | null> {
    if (Types.ObjectId.isValid(idOrSlug)) {
      const found = await comboRepository.findById(idOrSlug);
      if (found) return found;
    }
    return comboRepository.findBySlug(idOrSlug);
  }

  async createCombo(input: CreateComboInput): Promise<Combo> {
    const slug = input.slug?.trim() ? this.generateSlug(input.slug) : this.generateSlug(input.title);

    const existing = await comboRepository.findBySlug(slug);
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    return comboRepository.create({
      ...input,
      slug: finalSlug,
      isActive: input.isActive ?? true,
      isAvailable: input.isAvailable ?? true,
      displayOrder: input.displayOrder ?? 0,
    });
  }

  async updateCombo(id: string, input: Partial<CreateComboInput>): Promise<Combo | null> {
    const updateData: Partial<Combo> = { ...input };
    if (input.slug) {
      updateData.slug = this.generateSlug(input.slug);
    }
    return comboRepository.update(id, updateData);
  }

  async toggleComboStatus(id: string): Promise<Combo | null> {
    const combo = await comboRepository.findById(id);
    if (!combo) return null;
    return comboRepository.update(id, { isActive: !combo.isActive });
  }

  async deleteCombo(id: string): Promise<boolean> {
    return comboRepository.delete(id);
  }
}

export const comboService = new ComboService();
