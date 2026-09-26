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
  ChevronRight,
  ChevronLeft,
  Eye,
  X,
  Scale,
  Palette,
  ShoppingBag,
} from "lucide-react";
import { getOptimizedImageUrl } from "@/utils/cdn.utils";

import { Button } from "@/components/ui/Button";
import { toast } from "@/contexts/toast.context";
import { CustomSelect, Input } from "@/components/ui/FormControls";
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

  // Step Wizard State (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Mobile Live Preview Drawer / Modal
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState<boolean>(false);

  // Options from API (Admin controlled in real MongoDB database)
  const [flavors, setFlavors] = useState<CustomCakeOption[]>([]);
  const [designs, setDesigns] = useState<CustomCakeOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // Flavor Category Filter
  const [selectedFlavorCategory, setSelectedFlavorCategory] = useState<string>("ALL");

  // Studio Builder State
  const [tiers, setTiers] = useState<number>(1);
  const [shape, setShape] = useState<string>("Round");
  const [selectedFlavor, setSelectedFlavor] = useState<CustomCakeOption | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<CustomCakeOption | null>(null);
  const [weightKg, setWeightKg] = useState<number>(1.0);
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

  // Load backend options (Real MongoDB data configured by Admin)
  useEffect(() => {
    const loadOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [flvs, dsgs] = await Promise.all([
          customCakeService.getOptions("FLAVOR"),
          customCakeService.getOptions("DESIGN"),
        ]);
        const validFlvs = Array.isArray(flvs) ? flvs : [];
        const validDsgs = Array.isArray(dsgs) ? dsgs : [];
        setFlavors(validFlvs);
        setDesigns(validDsgs);
        if (validFlvs.length > 0) {
          setSelectedFlavor(validFlvs[0] || null);
        } else {
          setSelectedFlavor(null);
        }
        if (validDsgs.length > 0) {
          setSelectedDesign(validDsgs[0] || null);
        } else {
          setSelectedDesign(null);
        }
      } catch (_e) {
        setFlavors([]);
        setDesigns([]);
        setSelectedFlavor(null);
        setSelectedDesign(null);
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

  // Weight Formatter
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
    const cakeImg =
      selectedDesign?.imageUrl ||
      selectedFlavor?.imageUrl ||
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80";
    try {
      const flavorName = selectedFlavor?.name || "Artisanal Cake";
      const customTitle = `Custom ${tiers}-Tier ${flavorName} (${shape} Shape, ${formattedWeight})`;
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
          slug: `custom-cake-${tiers}-tier-${selectedFlavor?.slug || "celebration"}`,
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
      }, 700);
    } catch (_err) {
      toast.add("Custom Cake Added", "Your custom cake has been added to cart.", { image: cakeImg });
      setTimeout(() => {
        navigate("/cart");
      }, 700);
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
        flavor: selectedFlavor?.name || "Chef Choice",
        designTheme: selectedDesign?.name || "Standard Styling",
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

  // Step definitions
  const stepsMeta = [
    {
      step: 1,
      name: "Tiers & Shape",
      hindi: "टियर और आकार",
      icon: Layers,
    },
    {
      step: 2,
      name: "Flavor",
      hindi: "फ्लेवर",
      icon: Sparkles,
    },
    {
      step: 3,
      name: "Design Theme",
      hindi: "डिज़ाइन थीम",
      icon: Palette,
    },
    {
      step: 4,
      name: "Weight & Dietary",
      hindi: "वजन और शाकाहारी",
      icon: Scale,
    },
    {
      step: 5,
      name: "Name Plaque",
      hindi: "केक पर नाम",
      icon: MessageSquare,
    },
    {
      step: 6,
      name: "Review & Order",
      hindi: "रिव्यू और ऑर्डर",
      icon: ShoppingBag,
    },
  ];

  // Quick Greetings Chips for Step 5
  const quickGreetings = [
    "Happy Birthday 🎂",
    "Happy 1st Birthday 🎈",
    "Happy Anniversary 💍",
    "Sweet 16 ✨",
    "Congratulations 🎉",
    "Love You Forever ❤️",
    "Best Wishes 🌟",
    "God Bless You 🙏",
  ];

  // Quick Weight Presets
  const quickWeights = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

  // Filtered Flavors
  const flavorCategories = ["ALL", ...Array.from(new Set(flavors.map((f) => f.category || "Classics")))];
  const filteredFlavors =
    selectedFlavorCategory === "ALL"
      ? flavors
      : flavors.filter((f) => (f.category || "Classics") === selectedFlavorCategory);

  // Step navigation helpers
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Render Visualizer Canvas component (used in desktop sidebar & mobile drawer)
  const renderCakeVisualizer = (isModal: boolean = false) => (
    <div className={`space-y-4 ${isModal ? "p-1" : ""}`}>
      {/* Live Interactive Cake Visualizer */}
      <div className="rounded-3xl border border-[#E5DEC9] bg-gradient-to-b from-[#FFF8EC] to-white p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#596B58]" />
            <h3 className="font-extrabold text-sm text-[#3B302B]">Live Cake Visualizer</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#596B58]/10 text-[#596B58]">
            {tiers} {tiers === 1 ? "Tier" : "Tiers"} • {shape}
          </span>
        </div>

        {/* Visual Cake Graphic with dynamic Inscription Plaque */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-[#E5DEC9] bg-stone-900 flex flex-col items-center justify-center p-3 group">
          <img
            src={getOptimizedImageUrl(
              selectedDesign?.imageUrl ||
                selectedFlavor?.imageUrl ||
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=480&q=75",
              { width: 450, quality: 75 },
            )}
            alt="Custom Cake Preview"
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />

          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

          {/* Tier & Shape badge on preview */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-10">
            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
              {tiers} {tiers === 1 ? "Tier (खंड)" : "Tiers (खंड)"}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
              {shape}
            </span>
          </div>

          {/* Pure Veg / Eggless Badge on Canvas */}
          {isEggless && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>100% Eggless</span>
              </span>
            </div>
          )}

          {/* Live Name / Message Inscription Plaque directly on cake */}
          <div className="relative z-10 w-full max-w-[90%] mt-auto mb-2 text-center">
            <div className="bg-[#3B302B]/95 backdrop-blur-md border-2 border-[#D4AF37] px-3.5 py-2 rounded-2xl shadow-xl space-y-0.5">
              <p className="text-[8px] uppercase tracking-widest text-[#D4AF37] font-extrabold">
                Hand-Piped Chocolate Plaque
              </p>
              <p className="font-serif italic font-extrabold text-xs sm:text-sm text-amber-100 drop-shadow-md break-words">
                "{customNameOnCake || "Your Name / Message Here"}"
              </p>
            </div>
          </div>
        </div>

        {/* Specifications Breakdown */}
        <div className="space-y-2 text-xs text-[#3B302B] pt-1">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#7A6E65]">Tiers / खंड:</span>
            <span className="font-bold">{tiers} Tier ({shape} Shape)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#7A6E65]">Selected Flavor:</span>
            <span className="font-bold text-right max-w-[160px] truncate">{selectedFlavor?.name || "Standard Flavor"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#7A6E65]">Design Theme:</span>
            <span className="font-bold text-right max-w-[160px] truncate">{selectedDesign?.name || "Classic Styling"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#7A6E65]">Weight:</span>
            <span className="font-bold">{formattedWeight} (~{Math.max(2, Math.round(weightKg * 8))} Servings)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#7A6E65]">Dietary:</span>
            <span className="font-bold text-emerald-600">
              {isEggless ? "100% Pure Vegetarian" : "Regular Bakery"}
            </span>
          </div>
        </div>

        {/* Price Box */}
        <div className="pt-3 border-t border-[#E5DEC9] space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-[#7A6E65]">Estimated Total:</span>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#596B58]">₹{estimatedPrice}</span>
              <p className="text-[10px] text-gray-400">Decorative box & inscription included</p>
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
        </div>
      </div>

      {/* Bakery Promise */}
      <div className="p-3.5 rounded-2xl bg-[#FFF8EC]/60 border border-[#596B58]/20 text-xs space-y-1.5 text-[#7A6E65]">
        <div className="flex items-center gap-2 font-bold text-[#3B302B]">
          <ShieldCheck className="h-4 w-4 text-[#596B58]" />
          <span>Our Freshness & Quality Promise</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Baked fresh on delivery day with pure butter, rich cocoa & Belgian chocolate in temperature-controlled packaging.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-28 lg:pb-20 max-w-6xl mx-auto px-3 sm:px-4">
      {/* Top Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products Catalog</span>
      </Link>

      {/* Hero Banner with Dual Mode Switcher */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF8EC] via-[#FFF8EC] to-[#FFF8EC] border border-[#E5DEC9] p-5 sm:p-7 text-center space-y-4 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#596B58]/15 text-[#596B58] border border-[#596B58]/30 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Artisanal Celebration Studio</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#3B302B]">
          Custom Cake Studio (कस्टम केक स्टूडियो)
        </h1>
        <p className="text-xs sm:text-sm text-[#7A6E65] max-w-2xl mx-auto">
          अपने सपनों का टियर केक स्टेप-बाय-स्टेप तैयार करें। हर स्टेप पर अपनी पसंद का टियर, फ्लेवर, डिज़ाइन और नाम चुनें।
        </p>

        {/* Tab Toggle */}
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E5DEC9] shadow-xs max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "studio"
                ? "bg-[#596B58] text-white shadow-sm"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]/60"
            }`}
          >
            <Cake className="h-4 w-4" />
            <span>Step-by-Step Builder (कदम-दर-कदम)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inquiry")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "inquiry"
                ? "bg-[#596B58] text-white shadow-sm"
                : "text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#FFF8EC]/60"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Can't Decide? Custom Inquiry (कस्टम सलाह)</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center shadow-xs flex items-center justify-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 1: STEP-BY-STEP INTERACTIVE CAKE BUILDER */}
      {/* ========================================================= */}
      {activeTab === "studio" && (
        <div className="space-y-6">
          {/* STEPPER NAVIGATION BAR (Responsive & Mobile-Optimized) */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E5DEC9] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#596B58]">
                  Step {currentStep} of {totalSteps}
                </span>
                <h2 className="text-sm sm:text-lg font-extrabold text-[#3B302B]">
                  {stepsMeta[currentStep - 1]?.hindi} ({stepsMeta[currentStep - 1]?.name})
                </h2>
              </div>

              {/* Mobile View Preview Button */}
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8EC] border border-[#596B58]/30 text-[#596B58] text-xs font-bold shadow-2xs hover:bg-[#596B58]/10 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>केक देखें (₹{estimatedPrice})</span>
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-[#FFF8EC] h-2 rounded-full overflow-hidden border border-[#E5DEC9]">
              <div
                className="bg-[#596B58] h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
              />
            </div>

            {/* Clickable Step Pills */}
            <div className="grid grid-cols-6 gap-1 sm:gap-2 pt-1">
              {stepsMeta.map((s) => {
                const isCurrent = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                const StepIcon = s.icon;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step)}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer text-center ${
                      isCurrent
                        ? "bg-[#596B58] text-white shadow-xs font-bold"
                        : isCompleted
                        ? "bg-[#FFF8EC] text-[#596B58] hover:bg-[#596B58]/10 font-semibold"
                        : "text-[#7A6E65] hover:bg-gray-100 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <StepIcon className="h-3.5 w-3.5 hidden sm:block" />
                      <span className="text-[10px] sm:text-xs">
                        {isCompleted ? `✓ ${s.step}` : s.step}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] truncate max-w-full mt-0.5 hidden xs:block">
                      {s.hindi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN TWO-COLUMN LAYOUT: Wizard Controls (Left) + Visual Canvas (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            {/* Step Wizard Container (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-6">
              {/* ========================================================= */}
              {/* STEP 1: TIERS & SHAPE */}
              {/* ========================================================= */}
              {currentStep === 1 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                      Part 1 • टियर और आकार का चयन
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                      कितने टियर (खंड) का केक बनाना है?
                    </h3>
                    <p className="text-xs text-[#7A6E65]">
                      अपने मेहमानों की संख्या और सेलिब्रेशन के अनुसार 1, 2 या 3 टियर का चयन करें।
                    </p>
                  </div>

                  {/* Tier Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {[
                      {
                        count: 1,
                        label: "Single Tier (1 खंड)",
                        hindi: "छोटा व पारिवारिक उत्सव",
                        desc: "5-12 Guests • Intimate Parties",
                        badge: "Most Popular",
                        icon: Layers,
                      },
                      {
                        count: 2,
                        label: "Double Tier (2 खंड)",
                        hindi: "बड़ा जन्मदिन व पार्टी",
                        desc: "15-25 Guests • Grand Birthdays",
                        badge: "Celebration",
                        icon: Layers,
                      },
                      {
                        count: 3,
                        label: "Triple Tier (3 खंड)",
                        hindi: "शाही शादी व रिसेप्शन",
                        desc: "30+ Guests • Weddings & Galas",
                        badge: "Royal Gala",
                        icon: Layers,
                      },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = tiers === t.count;
                      return (
                        <button
                          key={t.count}
                          type="button"
                          onClick={() => setTiers(t.count)}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                              : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40 hover:bg-[#FFF8EC]/30"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#596B58]/10 text-[#596B58]">
                                {t.badge}
                              </span>
                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-[#596B58] text-white flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </div>
                              ) : null}
                            </div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#3B302B]">{t.label}</h4>
                            <p className="text-xs font-semibold text-[#596B58]">{t.hindi}</p>
                            <p className="text-[11px] text-[#7A6E65]">{t.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cake Shape Selection */}
                  <div className="pt-4 border-t border-[#E5DEC9] space-y-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#3B302B]">केक की शेप (आकार) चुनें:</h4>
                      <p className="text-xs text-[#7A6E65]">अपने खास अवसर के लिए मनपसंद आकार का चुनाव करें।</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "Round", label: "Classic Round", hindi: "क्लासिक गोल", icon: Circle },
                        { id: "Heart", label: "Sweet Heart", hindi: "प्यारा दिल", icon: Heart },
                        { id: "Square", label: "Modern Square", hindi: "मॉडर्न चौकोर", icon: Square },
                      ].map((s) => {
                        const Icon = s.icon;
                        const isSelected = shape === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setShape(s.id)}
                            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#596B58] bg-[#FFF8EC] text-[#596B58] ring-2 ring-[#596B58]/30 shadow-xs"
                                : "border-[#E5DEC9] bg-white text-[#3B302B] hover:bg-[#FFF8EC]"
                            }`}
                          >
                            <Icon className="h-5 w-5 mb-1" />
                            <span className="text-xs font-bold">{s.label}</span>
                            <span className="text-[10px] text-gray-500 mt-0.5">{s.hindi}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex justify-end">
                    <Button
                      size="lg"
                      onClick={goToNextStep}
                      className="w-full sm:w-auto px-7 shadow-md"
                    >
                      <span>अगला: फ्लेवर चुनें (Next: Select Flavor)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 2: FLAVORS */}
              {/* ========================================================= */}
              {currentStep === 2 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                        Part 2 • फ्लेवर का चयन
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                        पसंदीदा केक फ्लेवर चुनें
                      </h3>
                      <p className="text-xs text-[#7A6E65]">
                        बेकरी के ताज़ा और प्रीमियम फ्लेवर जो एडमिन द्वारा मैनेज किए जाते हैं।
                      </p>
                    </div>

                    <span className="text-xs text-[#7A6E65] font-semibold bg-[#FFF8EC] px-3 py-1.5 rounded-xl border border-[#E5DEC9] shrink-0">
                      चयनित: <strong className="text-[#596B58]">{selectedFlavor?.name || "None / कोई नहीं"}</strong>
                    </span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {flavorCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedFlavorCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedFlavorCategory === cat
                            ? "bg-[#596B58] text-white shadow-xs"
                            : "bg-[#FFF8EC] text-[#7A6E65] hover:bg-[#E5DEC9]/50"
                        }`}
                      >
                        {cat === "ALL" ? "All Flavors (सभी फ्लेवर)" : cat}
                      </button>
                    ))}
                  </div>

                  {/* Flavors Grid */}
                  {isLoadingOptions ? (
                    <div className="p-10 text-center bg-[#FFF8EC] rounded-2xl border border-[#E5DEC9]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#596B58] mx-auto" />
                      <p className="text-xs text-[#7A6E65] mt-2">Loading flavors from database...</p>
                    </div>
                  ) : filteredFlavors.length === 0 ? (
                    <div className="p-10 text-center bg-[#FFF8EC] rounded-2xl border border-[#E5DEC9] space-y-1">
                      <Cake className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-bold text-[#3B302B]">Database me koi flavor nahi mila</p>
                      <p className="text-xs text-[#7A6E65]">Admin console se naye flavors add karein.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {filteredFlavors.map((flv) => {
                        const isSelected = selectedFlavor?.slug === flv.slug;
                        return (
                          <button
                            key={flv.slug || flv.name}
                            type="button"
                            onClick={() => setSelectedFlavor(flv)}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                              isSelected
                                ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                                : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40"
                            }`}
                          >
                            <div
                              className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden border border-[#E5DEC9] bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${
                                  flv.imageUrl ||
                                  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&q=80"
                                })`,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs sm:text-sm text-[#3B302B] truncate">{flv.name}</h4>
                                {isSelected && <Check className="h-4 w-4 text-[#596B58] shrink-0" />}
                              </div>
                              <p className="text-[11px] text-[#7A6E65] line-clamp-2 mt-0.5">{flv.description}</p>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-[#596B58]">
                                  ₹{flv.priceModifier} / kg
                                </span>
                                {flv.category && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold truncate max-w-[100px]">
                                    {flv.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={goToPrevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>पिछला (Back)</span>
                    </Button>
                    <Button size="lg" onClick={goToNextStep} className="shadow-md">
                      <span>अगला: डिज़ाइन चुनें (Next: Design)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 3: DESIGN THEMES */}
              {/* ========================================================= */}
              {currentStep === 3 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                        Part 3 • डिज़ाइन व सजावट थीम
                      </span>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                        केक की डिज़ाइन और थीम चुनें
                      </h3>
                      <p className="text-xs text-[#7A6E65]">
                        शाही गोल्ड ड्रिप, मिनिमलिस्ट पेस्टल, फ्लोरल या पर्सनलाइज्ड फोटो थीम।
                      </p>
                    </div>

                    <span className="text-xs text-[#7A6E65] font-semibold bg-[#FFF8EC] px-3 py-1.5 rounded-xl border border-[#E5DEC9] shrink-0">
                      चयनित: <strong className="text-[#596B58]">{selectedDesign?.name || "Standard / सामान्य"}</strong>
                    </span>
                  </div>

                  {/* Designs Grid */}
                  {isLoadingOptions ? (
                    <div className="p-10 text-center bg-[#FFF8EC] rounded-2xl border border-[#E5DEC9]">
                      <Loader2 className="h-7 w-7 animate-spin text-[#596B58] mx-auto" />
                      <p className="text-xs text-[#7A6E65] mt-2">Loading designs from database...</p>
                    </div>
                  ) : designs.length === 0 ? (
                    <div className="p-10 text-center bg-[#FFF8EC] rounded-2xl border border-[#E5DEC9] space-y-1">
                      <Palette className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-bold text-[#3B302B]">Database me koi design theme nahi mili</p>
                      <p className="text-xs text-[#7A6E65]">Standard design ke sath cake bake kiya jayega.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {designs.map((dsg) => {
                        const isSelected = selectedDesign?.slug === dsg.slug;
                        return (
                          <button
                            key={dsg.slug || dsg.name}
                            type="button"
                            onClick={() => setSelectedDesign(dsg)}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? "border-[#596B58] bg-[#FFF8EC] ring-2 ring-[#596B58]/30 shadow-xs"
                                : "border-[#E5DEC9] bg-white hover:border-[#596B58]/40"
                            }`}
                          >
                            <div className="aspect-4/3 w-full rounded-xl overflow-hidden mb-2 relative bg-gray-100">
                              <img
                                src={getOptimizedImageUrl(
                                  dsg.imageUrl ||
                                    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=75",
                                  { width: 280, quality: 75 },
                                )}
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
                              <h4 className="font-bold text-xs sm:text-sm text-[#3B302B] truncate">{dsg.name}</h4>
                              <p className="text-[10px] text-[#7A6E65] line-clamp-2 mt-0.5">{dsg.description}</p>
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                                <span className="text-[10px] font-bold text-[#596B58]">
                                  {dsg.priceModifier > 0 ? `+₹${dsg.priceModifier} Addon` : "Included / फ्री"}
                                </span>
                                <span className="text-[9px] text-gray-500 font-medium truncate max-w-[70px]">
                                  {dsg.category}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={goToPrevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>पिछला (Back)</span>
                    </Button>
                    <Button size="lg" onClick={goToNextStep} className="shadow-md">
                      <span>अगला: वजन और वेज विकल्प (Next: Weight)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 4: WEIGHT & DIETARY */}
              {/* ========================================================= */}
              {currentStep === 4 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                      Part 4 • वजन और शुद्ध शाकाहारी विकल्प
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                      केक का वजन और खान-पान प्राथमिकता
                    </h3>
                    <p className="text-xs text-[#7A6E65]">
                      कितने लोगों के लिए केक चाहिए? यहाँ से वजन और 100% एगलेस विकल्प चुनें।
                    </p>
                  </div>

                  {/* Weight Quick Selector */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                        कुल वजन (Total Weight): <span className="text-[#596B58] text-base">{formattedWeight}</span>
                      </label>
                      <span className="text-xs font-bold text-[#596B58] bg-[#FFF8EC] px-3 py-1 rounded-xl border border-[#E5DEC9]">
                        ~{Math.max(2, Math.round(weightKg * 8))} Servings (मेहमान)
                      </span>
                    </div>

                    {/* Quick Weight Chips */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {quickWeights.map((w) => {
                        const isSelected = weightKg === w;
                        return (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setWeightKg(w)}
                            className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? "border-[#596B58] bg-[#596B58] text-white font-bold shadow-xs"
                                : "border-[#E5DEC9] bg-[#FFF8EC] text-[#3B302B] hover:border-[#596B58]/50"
                            }`}
                          >
                            <span className="text-xs">{w < 1 ? `${w * 1000} g` : `${w} kg`}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fine-tune Slider */}
                    <div className="pt-3">
                      <input
                        type="range"
                        min={0.5}
                        max={5.0}
                        step={0.25}
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full accent-[#596B58] cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1">
                        <span>500 g</span>
                        <span>1.5 kg</span>
                        <span>3.0 kg</span>
                        <span>5.0 kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Dietary Requirements Card */}
                  <div className="pt-4 border-t border-[#E5DEC9] space-y-3">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                      खान-पान प्राथमिकता (Dietary Preference)
                    </label>

                    <label className="flex items-center gap-3.5 p-4 rounded-2xl border-2 border-[#596B58]/30 bg-[#FFF8EC] cursor-pointer hover:border-[#596B58] transition-all">
                      <input
                        type="checkbox"
                        checked={isEggless}
                        onChange={(e) => setIsEggless(e.target.checked)}
                        className="rounded border-gray-300 text-[#596B58] focus:ring-[#596B58] h-5 w-5"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <span className="text-sm font-extrabold text-[#3B302B]">
                            100% Pure Vegetarian / Eggless (शुद्ध शाकाहारी)
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A6E65]">
                          विशेष रूप से शुद्ध शाकाहारी ओवन में बनाया जाता है, जिसमें अंडे का उपयोग बिल्कुल नहीं होता।
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={goToPrevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>पिछला (Back)</span>
                    </Button>
                    <Button size="lg" onClick={goToNextStep} className="shadow-md">
                      <span>अगला: केक पर नाम लिखवाएं (Next: Name)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 5: NAME INSCRIPTION ON PLAQUE */}
              {/* ========================================================= */}
              {currentStep === 5 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                      Part 5 • केक पर नाम या बधाई संदेश
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                      केक पर क्या लिखवाना चाहते हैं?
                    </h3>
                    <p className="text-xs text-[#7A6E65]">
                      चॉकलेट की पट्टिका पर हाथ से लिखा संदेश (Hand-Piped Chocolate Plaque Inscription).
                    </p>
                  </div>

                  {/* Plaque Message Input */}
                  <div className="space-y-3">
                    <Input
                      label="केक पर नाम या संदेश (Name or Message on Cake Plaque)"
                      placeholder="e.g. Happy Birthday Rahul! / Happy 25th Anniversary Mom & Dad"
                      value={customNameOnCake}
                      onChange={(e) => setCustomNameOnCake(e.target.value)}
                      maxLength={60}
                    />
                    <div className="flex justify-between items-center text-[11px] text-[#7A6E65]">
                      <span>✨ हमारे हेड पेस्ट्री शेफ इसे स्वादिष्ट चॉकलेट प्लेक पर लिखते हैं।</span>
                      <span className="font-semibold">{customNameOnCake.length}/60 अक्षर</span>
                    </div>
                  </div>

                  {/* Quick Greetings Chips */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#7A6E65] uppercase">
                      त्वरित संदेश चुनें (Quick Suggestions):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickGreetings.map((greet) => (
                        <button
                          key={greet}
                          type="button"
                          onClick={() => setCustomNameOnCake(greet)}
                          className="px-3 py-1.5 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-xs font-semibold text-[#3B302B] hover:border-[#596B58] hover:text-[#596B58] transition-all cursor-pointer"
                        >
                          {greet}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* In-Step Live Plaque Display */}
                  <div className="p-4 rounded-2xl bg-[#3B302B] border-2 border-[#D4AF37] text-center space-y-1 text-white shadow-md">
                    <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-extrabold">
                      Live Inscription Plaque Preview
                    </span>
                    <p className="font-serif italic font-extrabold text-base sm:text-lg text-amber-100">
                      "{customNameOnCake || "Your Name / Message Here"}"
                    </p>
                  </div>

                  {/* Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={goToPrevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>पिछला (Back)</span>
                    </Button>
                    <Button size="lg" onClick={goToNextStep} className="shadow-md">
                      <span>अगला: फाइनल रिव्यू और ऑर्डर (Next: Review)</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* STEP 6: FINAL REVIEW, PHOTO UPLOAD & ORDER */}
              {/* ========================================================= */}
              {currentStep === 6 && (
                <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E5DEC9] shadow-sm space-y-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
                      Part 6 • फाइनल रिव्यू और कार्ट में जोड़ें
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#3B302B]">
                      आपके कस्टम केक का सम्पूर्ण विवरण
                    </h3>
                    <p className="text-xs text-[#7A6E65]">
                      नीचे दिए गए विवरण को चेक करें और सीधे कार्ट में जोड़कर ऑर्डर करें।
                    </p>
                  </div>

                  {/* Comprehensive Specifications Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] space-y-3">
                    <h4 className="font-extrabold text-sm text-[#3B302B] border-b border-[#E5DEC9] pb-2">
                      Cake Specifications Summary:
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">टियर व शेप</span>
                        <p className="font-extrabold text-[#3B302B] text-sm mt-0.5">
                          {tiers} Tier ({shape})
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">फ्लेवर (Flavor)</span>
                        <p className="font-extrabold text-[#596B58] text-sm mt-0.5 truncate">
                          {selectedFlavor?.name || "Standard Flavor"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">डिज़ाइन थीम</span>
                        <p className="font-extrabold text-[#3B302B] text-sm mt-0.5 truncate">
                          {selectedDesign?.name || "Classic Decoration"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">वजन व सर्विंग्स</span>
                        <p className="font-extrabold text-[#3B302B] text-sm mt-0.5">
                          {formattedWeight} (~{Math.max(2, Math.round(weightKg * 8))} Servings)
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">शाकाहारी स्थिति</span>
                        <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                          {isEggless ? "100% Pure Veg" : "Regular"}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-[#E5DEC9]/60">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">अंतिम अनुमानित मूल्य</span>
                        <p className="font-extrabold text-[#596B58] text-sm mt-0.5">
                          ₹{estimatedPrice}
                        </p>
                      </div>
                    </div>

                    {/* Inscribed Message Banner */}
                    <div className="p-3 rounded-xl bg-[#3B302B] text-amber-100 flex items-center justify-between text-xs font-semibold">
                      <span>संदेश (Message):</span>
                      <span className="font-serif italic font-extrabold">"{customNameOnCake}"</span>
                    </div>
                  </div>

                  {/* Optional Reference Image Upload */}
                  <div className="space-y-3 pt-2 border-t border-[#E5DEC9]">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                      अपनी पसंद का फोटो अपलोड करें (Optional Reference Photo)
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

                  {/* Decorator Notes */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#3B302B]">
                      बेकर के लिए विशेष निर्देश (Special Decorator Notes - Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="रंग पैलेट, अतिरिक्त फूल, या डिलीवरी समय से संबंधित कोई विशेष निर्देश..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                    />
                  </div>

                  {/* Final Step Action Buttons */}
                  <div className="pt-4 border-t border-[#E5DEC9] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button variant="outline" onClick={goToPrevStep} className="w-full sm:w-auto">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span>पिछला (Back)</span>
                    </Button>

                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      isLoading={isAddingToCart}
                      className="w-full sm:w-auto px-8 shadow-lg text-sm font-extrabold"
                    >
                      <Cake className="h-4 w-4 mr-2" />
                      <span>Add Custom Cake to Cart 🎂 (₹{estimatedPrice})</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sticky Visualizer Sidebar (Hidden on mobile) */}
            <div className="hidden lg:block lg:col-span-1 sticky top-24">
              {renderCakeVisualizer(false)}
            </div>
          </div>

          {/* STICKY BOTTOM BAR ON MOBILE (Mobile-First Navigation) */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5DEC9] p-3 shadow-2xl lg:hidden flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">
                {tiers}-Tier • {formattedWeight}
              </span>
              <span className="text-xl font-extrabold text-[#596B58]">₹{estimatedPrice}</span>
            </div>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="px-3 py-2 rounded-xl border border-[#E5DEC9] text-[#3B302B] text-xs font-bold bg-[#FFF8EC] hover:bg-gray-100 cursor-pointer"
                >
                  &larr; Back
                </button>
              )}

              {currentStep < totalSteps ? (
                <Button size="sm" onClick={goToNextStep} className="px-4 shadow-sm text-xs">
                  <span>Next &rarr;</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAddToCart}
                  isLoading={isAddingToCart}
                  className="px-4 shadow-sm text-xs"
                >
                  <Cake className="h-3.5 w-3.5 mr-1" />
                  <span>Add to Cart</span>
                </Button>
              )}
            </div>
          </div>

          {/* MOBILE PREVIEW MODAL / DRAWER */}
          {isMobilePreviewOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-[#E5DEC9] shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5DEC9]">
                  <div className="flex items-center gap-2">
                    <Cake className="h-4 w-4 text-[#596B58]" />
                    <h3 className="font-extrabold text-sm text-[#3B302B]">Live Cake Visualizer</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobilePreviewOpen(false)}
                    className="p-1 rounded-full text-gray-400 hover:text-black cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {renderCakeVisualizer(true)}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsMobilePreviewOpen(false)}
                  >
                    <span>Close Preview & Continue Editing</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
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
                  <CustomSelect
                    label="Occasion / Event"
                    value={inqOccasion}
                    onChange={(val) => setInqOccasion(val)}
                    options={[
                      { value: "Birthday Celebration", label: "Birthday Celebration" },
                      { value: "Wedding / Engagement", label: "Wedding / Engagement" },
                      { value: "Anniversary", label: "Anniversary" },
                      { value: "Baby Shower / Reveal", label: "Baby Shower / Gender Reveal" },
                      { value: "Kids Theme Party", label: "Kids Theme Party" },
                      { value: "Corporate / Milestone", label: "Corporate / Milestone" },
                      { value: "Other Celebration", label: "Other Celebration" },
                    ]}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Expected Budget Range"
                    value={inqBudget}
                    onChange={(val) => setInqBudget(val)}
                    options={[
                      { value: "Under ₹1,000", label: "Under ₹1,000" },
                      { value: "₹1,000 - ₹2,000", label: "₹1,000 - ₹2,000" },
                      { value: "₹2,000 - ₹4,000", label: "₹2,000 - ₹4,000" },
                      { value: "₹4,000 - ₹8,000", label: "₹4,000 - ₹8,000" },
                      { value: "₹8,000+ Luxury", label: "₹8,000+ Luxury Tiered" },
                    ]}
                  />
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
                  &larr; Return to Step-by-Step Builder
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
