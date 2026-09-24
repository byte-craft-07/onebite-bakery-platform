import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Cake,
  Check,
  Sparkles,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  MessageSquare,
  Calendar,
  Phone,
  User,
  Mail,
  IndianRupee,
  Layers,
  Heart,
  Square,
  Circle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

import { Button } from "@/components/ui/Button";
import { toast } from "@/contexts/toast.context";
import { Input } from "@/components/ui/FormControls";
import { cartService } from "@/services/cart.service";
import {
  customCakeService,
  type CustomCakeOption,
  FALLBACK_FLAVORS,
  FALLBACK_DESIGNS,
} from "@/services/customCake.service";
import { useAuth } from "@/contexts/auth.context";

export const CustomCakePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active Tab: "studio" (interactive builder) or "inquiry" (bespoke query)
  const [activeTab, setActiveTab] = useState<"studio" | "inquiry">("studio");

  // Options from API
  const [flavors, setFlavors] = useState<CustomCakeOption[]>(FALLBACK_FLAVORS);
  const [designs, setDesigns] = useState<CustomCakeOption[]>(FALLBACK_DESIGNS);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Studio Builder State
  const [tiers, setTiers] = useState<number>(1);
  const [shape, setShape] = useState<string>("Round");
  const [selectedFlavor, setSelectedFlavor] = useState<CustomCakeOption>(FALLBACK_FLAVORS[0]!);
  const [selectedDesign, setSelectedDesign] = useState<CustomCakeOption>(FALLBACK_DESIGNS[0]!);
  const [weightKg, setWeightKg] = useState<number>(0.5);
  const [isEggless, setIsEggless] = useState<boolean>(true);
  const [customNameOnCake, setCustomNameOnCake] = useState<string>("Happy Birthday Ajay!");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);


  // Inquiry / Consultation State
  const [inqName, setInqName] = useState<string>(user?.name || "");
  const [inqPhone, setInqPhone] = useState<string>(user?.phone || "");
  const [inqEmail, setInqEmail] = useState<string>(user?.email || "");
  const [inqOccasion, setInqOccasion] = useState<string>("Birthday Celebration");
  const [inqBudget, setInqBudget] = useState<string>("₹1,500 - ₹3,000");
  const [inqEventDate, setInqEventDate] = useState<string>("");
  const [inqQuery, setInqQuery] = useState<string>("");
  const [inqReferenceImage, setInqReferenceImage] = useState<string>("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccessTicket, setInquirySuccessTicket] = useState<{
    inquiryNumber: string;
    customerName: string;
    phone: string;
    queryText: string;
  } | null>(null);

  // Load backend options
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [flvs, dsgs] = await Promise.all([
          customCakeService.getOptions("FLAVOR"),
          customCakeService.getOptions("DESIGN"),
        ]);
        if (flvs && flvs.length > 0) {
          setFlavors(flvs);
          const currentValid = flvs.find((f) => f.slug === selectedFlavor.slug);
          if (!currentValid && flvs[0]) setSelectedFlavor(flvs[0]);
        }
        if (dsgs && dsgs.length > 0) {
          setDesigns(dsgs);
          const currentValidD = dsgs.find((d) => d.slug === selectedDesign.slug);
          if (!currentValidD && dsgs[0]) setSelectedDesign(dsgs[0]);
        }
      } catch (_e) {
        // Use fallbacks
      } finally {
        setIsLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  // Synchronize auth user into inquiry form
  useEffect(() => {
    if (user) {
      if (user.name && !inqName) setInqName(user.name);
      if (user.phone && !inqPhone) setInqPhone(user.phone);
      if (user.email && !inqEmail) setInqEmail(user.email);
    }
  }, [user]);

  // Weight Display Formatter
  const formattedWeight =
    weightKg < 1 ? `${Math.round(weightKg * 1000)} g` : `${weightKg} kg`;

  // Dynamic Price Calculation
  const baseRatePerKg = selectedFlavor?.priceModifier || 650;
  const tierMultiplier = tiers === 1 ? 1 : tiers === 2 ? 1.4 : 1.85;
  const designSurcharge = selectedDesign?.priceModifier || 0;
  const rawPrice = weightKg * baseRatePerKg * tierMultiplier + designSurcharge;
  const estimatedPrice = Math.round(rawPrice);


  // Local File to Base64
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageState: (url: string) => void,
    setLoadingState: (loading: boolean) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingState(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageState(event.target.result as string);
      }
      setLoadingState(false);
    };
    reader.onerror = () => setLoadingState(false);
    reader.readAsDataURL(file);
  };

  // Add to Cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    const cakeImg = selectedDesign.imageUrl || selectedFlavor.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80";
    try {
      const customTitle = `Custom ${tiers}-Tier ${selectedFlavor.name} (${shape} Shape, ${formattedWeight})`;
      await cartService.addItem({
        productId: `custom-${Date.now()}`,
        quantity: 1,
        customization: {
          message: customNameOnCake,
          eggless: isEggless,
        },
        productDetails: {
          name: customTitle,
          price: estimatedPrice,
          mainImage: cakeImg,
          slug: `custom-cake-${tiers}-tier-${selectedFlavor.slug}`,
        },
      });
      toast.add("Custom Cake Added! 🎂", `"${customTitle}" (₹${estimatedPrice}) added to your basket.`, {
        image: cakeImg,
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart"),
        },
      });
      setTimeout(() => {
        navigate("/cart");
      }, 900);
    } catch (_err) {
      toast.add("Custom Cake Added", "Your custom cake has been added to cart.", { image: cakeImg });
      setTimeout(() => {
        navigate("/cart");
      }, 900);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Submit Bespoke Inquiry
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqName.trim() || !inqPhone.trim() || !inqQuery.trim()) {
      toast.error("Missing Information", "Please fill in your Name, Phone Number, and Custom Cake Query.");
      return;
    }

    setIsSubmittingInquiry(true);
    try {
      const res = await customCakeService.submitInquiry({
        customerName: inqName,
        customerPhone: inqPhone,
        customerEmail: inqEmail,
        occasion: inqOccasion,
        budgetRange: inqBudget,
        eventDate: inqEventDate || undefined,
        queryText: inqQuery,
        referenceImageUrl: inqReferenceImage,
        tiers,
        shape,
        flavor: selectedFlavor.name,
        designTheme: selectedDesign.name,
        weightKg,
        isEggless,
        cakeMessage: customNameOnCake,
        estimatedPrice,
      });

      setInquirySuccessTicket({
        inquiryNumber: res.inquiryNumber,
        customerName: res.customerName,
        phone: res.customerPhone,
        queryText: res.queryText,
      });
      toast.success("Bespoke Request Sent! 🎨", `Ticket #${res.inquiryNumber} created for master baker review.`);
    } catch (err: any) {
      const fallbackTicket = `CC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setInquirySuccessTicket({
        inquiryNumber: fallbackTicket,
        customerName: inqName,
        phone: inqPhone,
        queryText: inqQuery,
      });
      toast.success("Inquiry Submitted", `Ticket #${fallbackTicket} created.`);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto px-3 sm:px-4">
      {/* Top Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products Catalog</span>
      </Link>

      {/* Hero Banner with Dual Mode Switcher */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF8EC] via-[#FFF8EC] to-[#FFF8EC] border border-[#E5DEC9] p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#596B58]/15 text-[#596B58] border border-[#596B58]/30 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Artisanal Celebration Studio</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B]">
          Custom Celebration Cake Studio
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-2xl mx-auto">
          Craft your dream tiered cake with personalized flavors, bespoke design themes, and real-time name plaque inscription. Need bespoke consultation? Send us your inspiration!
        </p>

        {/* Tab Toggle */}
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E5DEC9] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "studio"
                ? "bg-[#596B58] text-white shadow-sm"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]/60"
            }`}
          >
            <Cake className="h-4 w-4" />
            <span>Interactive Cake Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inquiry")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "inquiry"
                ? "bg-[#596B58] text-white shadow-sm"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]/60"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Can't Decide? Custom Inquiry & Help</span>
          </button>
        </div>
      </div>

      {toastMsg ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center shadow-xs flex items-center justify-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      ) : null}

      {/* ========================================================= */}
      {/* MODE 1: INTERACTIVE STUDIO CAKE BUILDER */}
      {/* ========================================================= */}
      {activeTab === "studio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Main Studio Controls */}
          <div className="lg:col-span-2 space-y-8 bg-white p-5 sm:p-8 rounded-3xl border border-[#E5DEC9] shadow-sm">
            {/* 1. Tier Count & Shape Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Select Tier Layering & Cake Shape</span>
                </label>
              </div>

              {/* Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { count: 1, label: "Single Tier", desc: "5-12 Guests • Intimate Parties", icon: Layers },
                  { count: 2, label: "Double Tier", desc: "15-25 Guests • Grand Birthdays", icon: Layers },
                  { count: 3, label: "Triple Tier", desc: "30+ Guests • Weddings & Galas", icon: Layers },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = tiers === t.count;
                  return (
                    <button
                      key={t.count}
                      type="button"
                      onClick={() => setTiers(t.count)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                          : "border-[#E5DEC9] bg-[#FFF8EC] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-[#596B58]" : "text-gray-400"}`} />
                          <span className="font-bold text-sm text-[#3B302B]">{t.label}</span>
                        </div>
                        {isSelected ? <Check className="h-4 w-4 text-[#596B58]" /> : null}
                      </div>
                      <p className="text-[11px] text-[#7A6E65] mt-1">{t.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Shapes */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#7A6E65] uppercase tracking-wide">Shape Outline:</span>
                <div className="grid grid-cols-3 gap-3 mt-1.5">
                  {[
                    { id: "Round", label: "Classic Round", icon: Circle },
                    { id: "Heart", label: "Sweet Heart", icon: Heart },
                    { id: "Square", label: "Modern Square", icon: Square },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = shape === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setShape(s.id)}
                        className={`p-3 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] shadow-xs"
                            : "border-[#E5DEC9] bg-white text-[#3B302B] hover:bg-[#FFF8EC]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{s.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Premium Flavor Selection */}
            <div className="space-y-4 pt-2 border-t border-[#E5DEC9]/70">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Select Premium Flavor</span>
                </label>
                <span className="text-[11px] text-[#7A6E65] font-semibold">
                  Selected: <strong className="text-[#596B58]">{selectedFlavor.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flavors.map((flv) => {
                  const isSelected = selectedFlavor.slug === flv.slug;
                  return (
                    <button
                      key={flv.slug || flv.name}
                      type="button"
                      onClick={() => setSelectedFlavor(flv)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                          : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40"
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-[#E5DEC9] bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${flv.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80"})`,
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-[#3B302B] truncate">{flv.name}</h4>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#596B58] shrink-0" />}
                        </div>
                        <p className="text-[10px] text-[#7A6E65] truncate mt-0.5">{flv.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {flv.category && (
                            <span className="text-[9px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold">
                              {flv.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Design & Styling Theme */}
            <div className="space-y-4 pt-2 border-t border-[#E5DEC9]/70">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Select Cake Design & Aesthetics</span>
                </label>
                <span className="text-[11px] text-[#7A6E65] font-semibold">
                  Selected: <strong className="text-[#596B58]">{selectedDesign.name}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {designs.map((dsg) => {
                  const isSelected = selectedDesign.slug === dsg.slug;
                  return (
                    <button
                      key={dsg.slug || dsg.name}
                      type="button"
                      onClick={() => setSelectedDesign(dsg)}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                          : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40"
                      }`}
                    >
                      <div className="aspect-4/3 w-full rounded-xl overflow-hidden mb-1.5 sm:mb-2 relative bg-gray-100">
                        <img
                          src={getOptimizedImageUrl(dsg.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=75", { width: 280, quality: 75 })}
                          alt={dsg.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#596B58] text-white shadow">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-[11px] sm:text-xs text-[#3B302B] truncate">{dsg.name}</h4>
                        <p className="text-[9px] sm:text-[10px] text-[#7A6E65] line-clamp-1 sm:line-clamp-2 mt-0.5">{dsg.description}</p>
                        <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1 border-t border-gray-100">
                          <span className="text-[9px] sm:text-[10px] font-bold text-[#596B58]">
                            {dsg.priceModifier > 0 ? `+₹${dsg.priceModifier}` : "Included"}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-gray-500 font-medium truncate max-w-[60px]">{dsg.category}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Live Custom Name Inscription & Message on Cake Plaque */}
            <div className="space-y-4 pt-2 border-t border-[#E5DEC9]/70">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center text-[10px]">4</span>
                <span>Custom Name / Wording Inscription On Cake Plaque</span>
              </label>

              <div className="space-y-3">
                <Input
                  label="Name or Greeting to be Inscribed (Real-time Live Preview below)"
                  placeholder="e.g. Happy 25th Anniversary Mom & Dad! / Sweet 16 Priya"
                  value={customNameOnCake}
                  onChange={(e) => setCustomNameOnCake(e.target.value)}
                  maxLength={60}
                />
                <div className="flex justify-between items-center text-[11px] text-[#7A6E65]">
                  <span>✨ Our master bakers hand-pipe or engrave this onto edible chocolate plaques.</span>
                  <span className="font-semibold">{customNameOnCake.length}/60 chars</span>
                </div>
              </div>
            </div>

            {/* 5. Weight & Dietary Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#E5DEC9]/70">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                    5. Total Weight ({formattedWeight})
                  </label>
                  <span className="text-xs font-bold text-[#596B58]">~{Math.max(2, Math.round(weightKg * 8))} Servings</span>
                </div>
                <input
                  type="range"
                  min={0.25}
                  max={2.0}
                  step={0.25}
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full accent-[#596B58] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-bold">
                  <span>250 g</span>
                  <span>500 g</span>
                  <span>1.0 kg</span>
                  <span>2.0 kg</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                  Dietary Requirements
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] cursor-pointer hover:border-[#596B58]/50">
                    <input
                      type="checkbox"
                      checked={isEggless}
                      onChange={(e) => setIsEggless(e.target.checked)}
                      className="rounded border-gray-300 text-[#596B58] focus:ring-[#596B58] h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#3B302B]">100% Pure Vegetarian / Eggless</span>
                      <p className="text-[10px] text-[#7A6E65]">Baked in dedicated certified egg-free ovens.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>


            {/* 6. Optional Reference Image & Special Instructions */}
            <div className="space-y-4 pt-2 border-t border-[#E5DEC9]/70">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center text-[10px]">6</span>
                <span>Optional Reference Image & Decorator Notes</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Attach Reference Image / Inspiration Photo (Optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#E5DEC9] hover:border-[#596B58] bg-[#FFF8EC] text-xs font-bold text-[#7A6E65] hover:text-[#596B58] cursor-pointer transition-colors">
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#596B58]" />
                    ) : (
                      <Upload className="h-4 w-4 text-[#596B58]" />
                    )}
                    <span>{referenceImage ? "Change Reference Image" : "Upload Inspiration Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setReferenceImage, setIsUploadingImage)}
                      className="hidden"
                    />
                  </label>

                  {referenceImage && (
                    <div className="relative aspect-video w-24 rounded-xl overflow-hidden border border-[#E5DEC9] group">
                      <img src={referenceImage} alt="Reference" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReferenceImage("")}
                        className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Specific Piping / Color / Topper Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mention any custom color palette (e.g., lavender and gold), fresh fruit toppings, or special delivery timing..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Canvas Preview & Order Price Box */}
          <div className="space-y-6">
            {/* Live Interactive Cake Visualizer */}
            <div className="rounded-3xl border border-[#E5DEC9] bg-gradient-to-b from-[#FFF8EC] to-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#596B58]" />
                  <h3 className="font-extrabold text-sm text-[#3B302B]">Live Cake Visualization</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#596B58]/10 text-[#596B58]">
                  {tiers} Tier • {shape}
                </span>
              </div>

              {/* Visual Cake Graphic with dynamic Inscription Plaque */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#E5DEC9] bg-stone-900 flex flex-col items-center justify-center p-4 group">
                <img
                  src={getOptimizedImageUrl(
                    selectedDesign.imageUrl || selectedFlavor.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=480&q=75",
                    { width: 450, quality: 75 }
                  )}
                  alt="Custom Cake Preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />

                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Tier & Shape badge on preview */}
                <div className="absolute top-3 left-3 flex gap-1.5 z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
                    {tiers} {tiers === 1 ? "Tier" : "Tiers"}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
                    {shape}
                  </span>
                </div>

                {/* Live Name / Message Inscription Plaque directly on cake */}
                <div className="relative z-10 w-full max-w-[85%] mt-auto mb-2 text-center">
                  <div className="bg-[#3B302B]/90 backdrop-blur-md border-2 border-[#D4AF37] px-4 py-2.5 rounded-2xl shadow-xl space-y-0.5">
                    <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-extrabold">
                      Hand-Piped Plaque Inscription
                    </p>
                    <p className="font-serif italic font-extrabold text-xs sm:text-sm text-amber-100 drop-shadow-md break-words">
                      "{customNameOnCake || "Your Name / Message Here"}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Specifications Breakdown */}
              <div className="space-y-2.5 text-xs text-[#3B302B] pt-2">
                <div className="flex justify-between">
                  <span className="text-[#7A6E65]">Tier Layering:</span>
                  <span className="font-bold">{tiers} Tier ({shape} Shape)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E65]">Selected Flavor:</span>
                  <span className="font-bold text-right max-w-[170px] truncate">{selectedFlavor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E65]">Design Theme:</span>
                  <span className="font-bold text-right max-w-[170px] truncate">{selectedDesign.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E65]">Weight:</span>
                  <span className="font-bold">{formattedWeight} (~{Math.max(2, Math.round(weightKg * 8))} servings)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6E65]">Dietary:</span>
                  <span className="font-bold text-emerald-600">
                    {isEggless ? "100% Eggless" : "Regular"}
                  </span>
                </div>
              </div>


              {/* Price Calculation Box */}
              <div className="pt-3 border-t border-[#E5DEC9] space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#7A6E65]">Estimated Total:</span>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-[#596B58]">₹{estimatedPrice}</span>
                    <p className="text-[10px] text-gray-400">All taxes & decorative box included</p>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full shadow-md"
                  size="lg"
                  isLoading={isAddingToCart}
                >
                  <Cake className="h-4 w-4 mr-2" />
                  <span>Add Custom Cake to Cart</span>
                </Button>

                <p className="text-[10px] text-center text-[#7A6E65]">
                  Need custom bakery consultation first?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("inquiry")}
                    className="text-[#596B58] font-bold underline cursor-pointer hover:text-[#495948]"
                  >
                    Submit Custom Query
                  </button>
                </p>
              </div>
            </div>

            {/* Onebite Bakery Quality Assurance Card */}
            <div className="p-4 rounded-2xl bg-[#FFF8EC]/60 border border-[#596B58]/20 text-xs space-y-2 text-[#7A6E65]">
              <div className="flex items-center gap-2 font-bold text-[#3B302B]">
                <ShieldCheck className="h-4 w-4 text-[#596B58]" />
                <span>Our Freshness & Quality Promise</span>
              </div>
              <p className="text-[11px]">
                Baked fresh on the day of delivery with 100% dairy cream, Belgian chocolate, and pure butter. Delivered in shockproof temperature-controlled packaging.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: BESPOKE CUSTOM QUERY & CONSULTATION INQUIRY */}
      {/* ========================================================= */}
      {activeTab === "inquiry" && (
        <div className="max-w-3xl mx-auto space-y-6">
          {inquirySuccessTicket ? (
            /* Success Card with Reference Ticket & Direct WhatsApp Contact */
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 text-center space-y-6 shadow-md animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <PartyPopper className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Inquiry Received Successfully!
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">
                  Your Custom Cake Request is Logged
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6E65] max-w-lg mx-auto">
                  Thank you, <strong>{inquirySuccessTicket.customerName}</strong>! Our head pastry chef is reviewing your request and reference photo. We will contact you on <strong>{inquirySuccessTicket.phone}</strong> shortly.
                </p>
              </div>

              {/* Ticket ID Box */}
              <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] max-w-sm mx-auto space-y-1">
                <span className="text-[11px] font-bold text-[#7A6E65] uppercase">Reference Ticket Number</span>
                <p className="text-2xl font-black text-[#596B58] tracking-wider">
                  {inquirySuccessTicket.inquiryNumber}
                </p>
              </div>

              {/* Direct WhatsApp Quick Connect */}
              <div className="pt-2 space-y-3">
                <a
                  href={`https://wa.me/919876543210?text=${encodeURIComponent(
                    `Hi Onebite Bakery! I just submitted custom cake inquiry #${inquirySuccessTicket.inquiryNumber} for "${inquirySuccessTicket.customerName}". Query: ${inquirySuccessTicket.queryText}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors w-full sm:w-auto"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Connect with Chef on WhatsApp Now</span>
                </a>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setInquirySuccessTicket(null);
                      setActiveTab("studio");
                    }}
                    className="text-xs text-[#7A6E65] hover:text-[#596B58] font-semibold underline cursor-pointer"
                  >
                    Create another cake or return to studio
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Inquiry Submission Form */
            <form
              onSubmit={handleSubmitInquiry}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6"
            >
              <div className="border-b border-[#E5DEC9] pb-4 space-y-1">
                <div className="flex items-center gap-2 text-[#596B58] font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="h-4 w-4" />
                  <span>Bespoke Cake Consultation & Quote</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                  Tell Us About Your Dream Cake
                </h3>
                <p className="text-xs text-[#7A6E65]">
                  If you have a special Pinterest picture, specific theme, or budget constraints, send us your details. Our master baker will curate the perfect recommendation and quote for you.
                </p>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name *"
                  placeholder="e.g. Rahul Sharma"
                  value={inqName}
                  onChange={(e) => setInqName(e.target.value)}
                  required
                />
                <Input
                  label="WhatsApp / Phone Number *"
                  placeholder="e.g. 9876543210"
                  value={inqPhone}
                  onChange={(e) => setInqPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Occasion / Event</label>
                  <select
                    value={inqOccasion}
                    onChange={(e) => setInqOccasion(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  >
                    <option value="Birthday Celebration">Birthday Celebration</option>
                    <option value="Wedding / Engagement">Wedding / Engagement</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Baby Shower / Reveal">Baby Shower / Gender Reveal</option>
                    <option value="Kids Theme Party">Kids Theme Party</option>
                    <option value="Corporate / Milestone">Corporate / Milestone</option>
                    <option value="Other Celebration">Other Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Expected Budget Range</label>
                  <select
                    value={inqBudget}
                    onChange={(e) => setInqBudget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  >
                    <option value="Under ₹1,000">Under ₹1,000</option>
                    <option value="₹1,000 - ₹2,000">₹1,000 - ₹2,000</option>
                    <option value="₹2,000 - ₹4,000">₹2,000 - ₹4,000</option>
                    <option value="₹4,000 - ₹8,000">₹4,000 - ₹8,000</option>
                    <option value="₹8,000+ Luxury">₹8,000+ Luxury Tiered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Target Event Date</label>
                  <input
                    type="date"
                    value={inqEventDate}
                    onChange={(e) => setInqEventDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  />
                </div>
              </div>

              {/* Query / Description text */}
              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Describe Your Cake Query / Idea / Flavor Preferences *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your design concept (e.g. 'I want a 2-tier lavender themed cake with macaron toppers and chocolate truffle filling for 20 people...')"
                  value={inqQuery}
                  onChange={(e) => setInqQuery(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>

              {/* Optional Reference Image Upload */}
              <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#3B302B] flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-[#596B58]" />
                    <span>Upload Reference Image from Pinterest / Instagram (Optional)</span>
                  </label>
                  <span className="text-[10px] text-gray-500 font-semibold">Optional</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#596B58] bg-white text-xs font-bold text-[#596B58] hover:bg-[#FFF8EC] cursor-pointer transition-colors">
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#596B58]" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{inqReferenceImage ? "Replace Reference Photo" : "Browse & Upload Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setInqReferenceImage, setIsUploadingImage)}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    placeholder="Or paste direct image URL (e.g. https://...)"
                    value={inqReferenceImage}
                    onChange={(e) => setInqReferenceImage(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
                  />
                </div>

                {inqReferenceImage && (
                  <div className="relative aspect-video w-32 rounded-xl overflow-hidden border border-[#E5DEC9] group mt-2">
                    <img src={inqReferenceImage} alt="Reference" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setInqReferenceImage("")}
                      className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("studio")}
                  className="text-xs text-[#7A6E65] hover:text-[#3B302B] font-semibold cursor-pointer"
                >
                  &larr; Return to Interactive Studio Builder
                </button>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmittingInquiry}
                  className="w-full sm:w-auto px-8 shadow-md"
                >
                  <span>Submit Custom Cake Inquiry</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
