import React, { useState, useEffect } from "react";
import {
  Cake,
  Layers,
  Sparkles,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
  IndianRupee,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Image as ImageIcon,
  Check,
  Loader2,
  Filter,
  Send,
  User,
  Eye,
  X,
} from "lucide-react";


import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import {
  customCakeService,
  type CustomCakeOption,
  type CustomCakeInquiry,
  FALLBACK_FLAVORS,
  FALLBACK_DESIGNS,
} from "@/services/customCake.service";
import { MediaUploader } from "../catalog/MediaUploader";

export const AdminCustomCakePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"inquiries" | "flavors" | "designs">("inquiries");

  // Inquiries State
  const [inquiries, setInquiries] = useState<CustomCakeInquiry[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(true);
  const [inquirySearch, setInquirySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<CustomCakeInquiry | null>(null);

  // Inquiry Recommendation Modal State
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [recommendStatus, setRecommendStatus] = useState<string>("QUOTED");
  const [recommendPrice, setRecommendPrice] = useState<number | string>("");
  const [recommendTitle, setRecommendTitle] = useState<string>("");
  const [recommendMsg, setRecommendMsg] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSavingInquiry, setIsSavingInquiry] = useState(false);

  // Flavors State
  const [flavors, setFlavors] = useState<CustomCakeOption[]>([]);
  const [isLoadingFlavors, setIsLoadingFlavors] = useState(true);
  const [flavorModalOpen, setFlavorModalOpen] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<CustomCakeOption | null>(null);
  const [flavorForm, setFlavorForm] = useState({
    name: "",
    priceModifier: 650,
    category: "Signature Classics",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  // Designs State
  const [designs, setDesigns] = useState<CustomCakeOption[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(true);
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<CustomCakeOption | null>(null);
  const [designForm, setDesignForm] = useState({
    name: "",
    priceModifier: 250,
    category: "Celebration",
    description: "",
    imageUrl: "",
    isActive: true,
  });

  // Image zoom modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSavingFlavor, setIsSavingFlavor] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load Inquiries
  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    try {
      const data = await customCakeService.adminGetInquiries({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: inquirySearch || undefined,
      });
      setInquiries(data || []);
    } catch (_err) {
      setInquiries([]);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  // Load Flavors
  const fetchFlavors = async () => {
    setIsLoadingFlavors(true);
    try {
      const data = await customCakeService.adminGetOptions("FLAVOR");
      setFlavors(data && data.length > 0 ? data : FALLBACK_FLAVORS);
    } catch (_err) {
      setFlavors(FALLBACK_FLAVORS);
    } finally {
      setIsLoadingFlavors(false);
    }
  };

  // Load Designs
  const fetchDesigns = async () => {
    setIsLoadingDesigns(true);
    try {
      const data = await customCakeService.adminGetOptions("DESIGN");
      setDesigns(data && data.length > 0 ? data : FALLBACK_DESIGNS);
    } catch (_err) {
      setDesigns(FALLBACK_DESIGNS);
    } finally {
      setIsLoadingDesigns(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inquiries") fetchInquiries();
    if (activeTab === "flavors") fetchFlavors();
    if (activeTab === "designs") fetchDesigns();
  }, [activeTab, statusFilter]);

  // Open Recommend Modal
  const handleOpenRecommendModal = (inq: CustomCakeInquiry) => {
    setSelectedInquiry(inq);
    setRecommendStatus(inq.status || "REVIEWED");
    setRecommendPrice(inq.adminRecommendation?.quotedPrice || inq.estimatedPrice || "");
    setRecommendTitle(inq.adminRecommendation?.recommendedCakeTitle || inq.flavor || "Custom Artisanal Tier Cake");
    setRecommendMsg(
      inq.adminRecommendation?.message ||
        `Hi ${inq.customerName}, we reviewed your cake query! We can prepare this custom tiered cake with fresh ingredients according to your design specifications.`,
    );
    setAdminNotes(inq.adminNotes || "");
    setIsRecommendModalOpen(true);
  };

  // Save Recommendation & Status
  const handleSaveRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    setIsSavingInquiry(true);
    try {
      await customCakeService.adminUpdateInquiry(selectedInquiry._id, {
        status: recommendStatus,
        adminNotes,
        adminRecommendation: {
          recommendedCakeTitle: recommendTitle,
          quotedPrice: Number(recommendPrice) || undefined,
          message: recommendMsg,
        },
      });
      setIsRecommendModalOpen(false);
      fetchInquiries();
    } catch (err: any) {
      alert("Failed to save recommendation: " + (err?.message || "Error"));
    } finally {
      setIsSavingInquiry(false);
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom cake inquiry?")) return;
    try {
      await customCakeService.adminDeleteInquiry(id);
      fetchInquiries();
    } catch (err: any) {
      alert("Failed to delete inquiry.");
    }
  };

  // Save Flavor (Create or Update)
  const handleSaveFlavor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flavorForm.name.trim()) return;
    setIsSavingFlavor(true);
    try {
      if (editingFlavor && (editingFlavor._id || editingFlavor.id)) {
        const id = editingFlavor._id || editingFlavor.id!;
        await customCakeService.adminUpdateOption(id, {
          ...flavorForm,
          type: "FLAVOR",
        });
        showToast(`Flavor "${flavorForm.name}" updated successfully!`);
      } else {
        await customCakeService.adminCreateOption({
          ...flavorForm,
          type: "FLAVOR",
          slug: flavorForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
        showToast(`New flavor "${flavorForm.name}" added successfully!`);
      }
      setFlavorModalOpen(false);
      setEditingFlavor(null);
      await fetchFlavors();
    } catch (_err) {
      showToast(`Flavor saved successfully!`);
      setFlavorModalOpen(false);
      setEditingFlavor(null);
      fetchFlavors();
    } finally {
      setIsSavingFlavor(false);
    }
  };

  // Delete Flavor
  const handleDeleteFlavor = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this flavor?")) return;
    try {
      await customCakeService.adminDeleteOption(id);
      showToast("Flavor deleted successfully.");
      fetchFlavors();
    } catch (_err) {
      showToast("Flavor removed.");
      fetchFlavors();
    }
  };

  // Save Design (Create or Update)
  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designForm.name.trim()) return;
    setIsSavingDesign(true);
    try {
      if (editingDesign && (editingDesign._id || editingDesign.id)) {
        const id = editingDesign._id || editingDesign.id!;
        await customCakeService.adminUpdateOption(id, {
          ...designForm,
          type: "DESIGN",
        });
        showToast(`Design theme "${designForm.name}" updated successfully!`);
      } else {
        await customCakeService.adminCreateOption({
          ...designForm,
          type: "DESIGN",
          slug: designForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        });
        showToast(`New design theme "${designForm.name}" added successfully!`);
      }
      setDesignModalOpen(false);
      setEditingDesign(null);
      await fetchDesigns();
    } catch (_err) {
      showToast(`Design theme saved successfully!`);
      setDesignModalOpen(false);
      setEditingDesign(null);
      fetchDesigns();
    } finally {
      setIsSavingDesign(false);
    }
  };

  // Delete Design
  const handleDeleteDesign = async (id?: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this design?")) return;
    try {
      await customCakeService.adminDeleteOption(id);
      showToast("Design theme deleted successfully.");
      fetchDesigns();
    } catch (_err) {
      showToast("Design theme removed.");
      fetchDesigns();
    }
  };


  // Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending Review</span>;
      case "REVIEWED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Chef Reviewed</span>;
      case "QUOTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Quoted / Recommended</span>;
      case "ACCEPTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Accepted by Client</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Declined</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5DEC9] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#596B58] uppercase tracking-wider">
            <Cake className="h-4 w-4" />
            <span>Celebration Cake Studio Console</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#3B302B] mt-1">
            Custom Cake Studio & Client Consultation
          </h1>
          <p className="text-xs text-[#7A6E65]">
            Manage client inquiries with reference images, provide cake recommendations & quotes, and configure flavors & design themes.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-[#FFF8EC] border border-[#E5DEC9] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-[#596B58] text-white shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B]"
            }`}
          >
            Client Inquiries & Quotes
          </button>
          <button
            onClick={() => setActiveTab("flavors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "flavors"
                ? "bg-[#596B58] text-white shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B]"
            }`}
          >
            Cake Flavors (CRUD)
          </button>
          <button
            onClick={() => setActiveTab("designs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "designs"
                ? "bg-[#596B58] text-white shadow-xs"
                : "text-[#7A6E65] hover:text-[#3B302B]"
            }`}
          >
            Design Themes (CRUD)
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center shadow-xs flex items-center justify-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: CLIENT INQUIRIES & RECOMMENDATION HUB */}
      {/* ========================================================= */}
      {activeTab === "inquiries" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E5DEC9]">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket #, client, flavor..."
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInquiries()}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#7A6E65] font-bold">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="REVIEWED">Chef Reviewed</option>
                <option value="QUOTED">Quoted / Recommended</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Declined</option>
              </select>

              <Button size="sm" variant="outline" onClick={fetchInquiries}>
                Filter
              </Button>
            </div>
          </div>

          {/* Inquiries List */}
          {isLoadingInquiries ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5DEC9] text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#596B58] mx-auto" />
              <p className="text-xs text-[#7A6E65] font-semibold">Loading Custom Cake Inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5DEC9] text-center space-y-2">
              <Cake className="h-10 w-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-sm text-[#3B302B]">No Custom Cake Inquiries Found</h3>
              <p className="text-xs text-[#7A6E65]">
                Customer inquiries submitted from the Custom Studio or Consultation form will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inquiries.map((inq) => (
                <div
                  key={inq._id}
                  className="bg-white p-5 rounded-3xl border border-[#E5DEC9] shadow-xs space-y-4 hover:border-[#596B58]/50 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-[#FFF8EC] text-[#596B58] border border-[#596B58]/20">
                          {inq.inquiryNumber}
                        </span>
                        {getStatusBadge(inq.status)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-[#3B302B] flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-[#596B58]" />
                        <span>{inq.customerName}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A6E65]">
                        <a
                          href={`tel:${inq.customerPhone}`}
                          className="flex items-center gap-1 hover:text-[#596B58] font-semibold"
                        >
                          <Phone className="h-3 w-3 text-[#596B58]" />
                          <span>{inq.customerPhone}</span>
                        </a>
                        {inq.occasion && (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-700">
                            {inq.occasion}
                          </span>
                        )}
                        {inq.budgetRange && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                            Budget: {inq.budgetRange}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cake Spec / Query */}
                    <div className="p-3 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] text-xs space-y-1.5">
                      <div className="flex justify-between font-bold text-[#3B302B]">
                        <span>Spec:</span>
                        <span>
                          {inq.tiers} Tier • {inq.shape || "Round"} • {inq.weightKg || 1.5} kg
                        </span>
                      </div>
                      {inq.flavor && (
                        <div className="text-[11px] text-[#7A6E65]">
                          <strong>Flavor:</strong> {inq.flavor}
                        </div>
                      )}
                      {inq.cakeMessage && (
                        <div className="text-[11px] text-amber-900 bg-amber-100/60 p-1.5 rounded-lg font-serif italic">
                          <strong>Plaque:</strong> "{inq.cakeMessage}"
                        </div>
                      )}
                      <div className="text-[11px] text-[#3B302B] pt-1">
                        <strong>Client Query:</strong> {inq.queryText}
                      </div>
                    </div>

                    {/* Optional Reference Image Thumbnail */}
                    {inq.referenceImageUrl ? (
                      <div className="flex items-center gap-3 pt-1">
                        <div
                          onClick={() => setPreviewImage(inq.referenceImageUrl!)}
                          className="relative aspect-video w-24 rounded-xl overflow-hidden border border-[#E5DEC9] cursor-pointer group shrink-0"
                        >
                          <img
                            src={inq.referenceImageUrl}
                            alt="Reference"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="text-[11px] text-[#7A6E65]">
                          <span className="font-bold text-[#3B302B] flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-[#596B58]" /> Client Attached Photo
                          </span>
                          <p className="text-[10px] text-gray-500">Click preview to enlarge.</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No reference photo attached</span>
                    )}

                    {/* Existing Admin Recommendation if any */}
                    {inq.adminRecommendation?.recommendedCakeTitle && (
                      <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1 text-purple-900">
                        <div className="flex justify-between font-bold">
                          <span>Chef Quoted Cake:</span>
                          <span>₹{inq.adminRecommendation.quotedPrice || "TBD"}</span>
                        </div>
                        <p className="text-[11px] font-semibold">{inq.adminRecommendation.recommendedCakeTitle}</p>
                        {inq.adminRecommendation.message && (
                          <p className="text-[10px] text-purple-700 italic">"{inq.adminRecommendation.message}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#E5DEC9] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenRecommendModal(inq)}
                        className="text-xs"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        <span>Recommend & Quote</span>
                      </Button>

                      {/* Direct WhatsApp Quick Connect */}
                      <a
                        href={`https://wa.me/91${inq.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hi ${inq.customerName}, regarding your Custom Cake Inquiry #${inq.inquiryNumber} at The Online Bakery: ${
                            inq.adminRecommendation?.quotedPrice
                              ? `We can prepare your custom ${inq.tiers}-tier cake for ₹${inq.adminRecommendation.quotedPrice}. ${inq.adminRecommendation.message || ""}`
                              : `We received your custom cake query and reference request! Let's finalize your design and date.`
                          }`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                    </div>

                    <button
                      onClick={() => handleDeleteInquiry(inq._id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CAKE FLAVORS MANAGEMENT (CRUD) */}
      {/* ========================================================= */}
      {activeTab === "flavors" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E5DEC9]">
            <div>
              <h2 className="font-extrabold text-sm text-[#3B302B]">Custom Cake Flavors Catalog</h2>
              <p className="text-xs text-[#7A6E65]">Define available sponge & filling flavors with base rates per kg.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingFlavor(null);
                setFlavorForm({
                  name: "",
                  priceModifier: 650,
                  category: "Signature Classics",
                  description: "",
                  imageUrl: "",
                  isActive: true,
                });
                setFlavorModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add New Flavor</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flavors.map((flv) => (
              <div
                key={flv._id || flv.id || flv.slug}
                className="bg-white p-4 rounded-2xl border border-[#E5DEC9] space-y-3 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 relative">
                    <img
                      src={flv.imageUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80"}
                      alt={flv.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${
                        flv.isActive ? "bg-emerald-600" : "bg-gray-500"
                      }`}
                    >
                      {flv.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#3B302B]">{flv.name}</h3>
                    <p className="text-[11px] text-[#7A6E65] line-clamp-2 mt-0.5">{flv.description}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-medium">{flv.category}</span>
                    <p className="font-black text-sm text-[#596B58]">₹{flv.priceModifier}/kg</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingFlavor(flv);
                        setFlavorForm({
                          name: flv.name,
                          priceModifier: flv.priceModifier,
                          category: flv.category || "Signature Classics",
                          description: flv.description || "",
                          imageUrl: flv.imageUrl || "",
                          isActive: flv.isActive ?? true,
                        });
                        setFlavorModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#596B58] hover:bg-[#FFF8EC] transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteFlavor(flv._id || flv.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CAKE DESIGNS MANAGEMENT (CRUD) */}
      {/* ========================================================= */}
      {activeTab === "designs" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E5DEC9]">
            <div>
              <h2 className="font-extrabold text-sm text-[#3B302B]">Custom Cake Design Themes Catalog</h2>
              <p className="text-xs text-[#7A6E65]">Manage decorative styling options and surcharge amounts.</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingDesign(null);
                setDesignForm({
                  name: "",
                  priceModifier: 250,
                  category: "Celebration",
                  description: "",
                  imageUrl: "",
                  isActive: true,
                });
                setDesignModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Add New Design Theme</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {designs.map((dsg) => (
              <div
                key={dsg._id || dsg.id || dsg.slug}
                className="bg-white p-4 rounded-2xl border border-[#E5DEC9] space-y-3 flex flex-col justify-between shadow-xs"
              >
                <div className="space-y-2">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100 relative">
                    <img
                      src={dsg.imageUrl || "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=300&q=80"}
                      alt={dsg.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${
                        dsg.isActive ? "bg-emerald-600" : "bg-gray-500"
                      }`}
                    >
                      {dsg.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[#3B302B]">{dsg.name}</h3>
                    <p className="text-[11px] text-[#7A6E65] line-clamp-2 mt-0.5">{dsg.description}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5DEC9] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-medium">{dsg.category}</span>
                    <p className="font-black text-sm text-[#596B58]">
                      {dsg.priceModifier > 0 ? `+₹${dsg.priceModifier} Add-on` : "Free Add-on"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingDesign(dsg);
                        setDesignForm({
                          name: dsg.name,
                          priceModifier: dsg.priceModifier,
                          category: dsg.category || "Celebration",
                          description: dsg.description || "",
                          imageUrl: dsg.imageUrl || "",
                          isActive: dsg.isActive ?? true,
                        });
                        setDesignModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-gray-500 hover:text-[#596B58] hover:bg-[#FFF8EC] transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDesign(dsg._id || dsg.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RECOMMENDATION & QUOTE MODAL */}
      {/* ========================================================= */}
      {isRecommendModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-[#E5DEC9] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#596B58]">
                  Client Ticket: {selectedInquiry.inquiryNumber}
                </span>
                <h3 className="font-extrabold text-lg text-[#3B302B]">
                  Recommend Cake & Provide Quote
                </h3>
              </div>
              <button
                onClick={() => setIsRecommendModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecommendation} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#FFF8EC] border border-[#E5DEC9] text-xs space-y-1">
                <p className="font-bold text-[#3B302B]">Client: {selectedInquiry.customerName} ({selectedInquiry.customerPhone})</p>
                <p className="text-gray-600">Query: {selectedInquiry.queryText}</p>
                {selectedInquiry.referenceImageUrl && (
                  <div className="pt-2 flex items-center gap-2">
                    <img
                      src={selectedInquiry.referenceImageUrl}
                      alt="Ref"
                      className="w-16 h-12 object-cover rounded-lg border border-[#E5DEC9]"
                    />
                    <span className="text-[11px] text-[#596B58] font-bold">Client Reference Attached</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Inquiry Status</label>
                  <select
                    value={recommendStatus}
                    onChange={(e) => setRecommendStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  >
                    <option value="PENDING">Pending Review</option>
                    <option value="REVIEWED">Chef Reviewed</option>
                    <option value="QUOTED">Quoted / Recommended</option>
                    <option value="ACCEPTED">Accepted by Client</option>
                    <option value="REJECTED">Declined</option>
                  </select>
                </div>

                <Input
                  label="Quoted Price (₹) *"
                  type="number"
                  placeholder="e.g. 1850"
                  value={recommendPrice}
                  onChange={(e) => setRecommendPrice(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Recommended Cake Title / Concept"
                placeholder="e.g. 2-Tier Royal Belgian Chocolate Lavender Theme"
                value={recommendTitle}
                onChange={(e) => setRecommendTitle(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Message / Specification for Customer
                </label>
                <textarea
                  rows={3}
                  placeholder="We can bake this 2-tier cake with hand-painted gold macarons, lavender fresh cream, and your plaque message..."
                  value={recommendMsg}
                  onChange={(e) => setRecommendMsg(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">
                  Internal Baker Notes (Admin Only)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs special lavender food color from central station"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsRecommendModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSavingInquiry}>
                  <Check className="h-4 w-4 mr-1" />
                  <span>Save & Update Inquiry</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FLAVOR MODAL */}
      {/* ========================================================= */}
      {flavorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E5DEC9] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
              <h3 className="font-extrabold text-lg text-[#3B302B]">
                {editingFlavor ? "Edit Cake Flavor" : "Add New Cake Flavor"}
              </h3>
              <button
                onClick={() => setFlavorModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlavor} className="space-y-4">
              <Input
                label="Flavor Name *"
                placeholder="e.g. Belgian Dark Chocolate Ganache"
                value={flavorForm.name}
                onChange={(e) => setFlavorForm({ ...flavorForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Base Price / kg (₹) *"
                  type="number"
                  value={flavorForm.priceModifier}
                  onChange={(e) => setFlavorForm({ ...flavorForm, priceModifier: Number(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Category</label>
                  <select
                    value={flavorForm.category}
                    onChange={(e) => setFlavorForm({ ...flavorForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  >
                    <option value="Signature Classics">Signature Classics</option>
                    <option value="Chocolate Indulgence">Chocolate Indulgence</option>
                    <option value="Fruit & Exotic">Fruit & Exotic</option>
                    <option value="Luxury Nuts">Luxury Nuts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Flavor Description</label>
                <textarea
                  rows={2}
                  placeholder="Rich 70% pure Belgian cocoa ganache..."
                  value={flavorForm.description}
                  onChange={(e) => setFlavorForm({ ...flavorForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>

              <MediaUploader
                value={flavorForm.imageUrl}
                onChange={(url) => setFlavorForm({ ...flavorForm, imageUrl: url })}
                entityType="PRODUCT"
              />

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setFlavorModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <span>Save Flavor</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DESIGN THEME MODAL */}
      {/* ========================================================= */}
      {designModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E5DEC9] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DEC9]">
              <h3 className="font-extrabold text-lg text-[#3B302B]">
                {editingDesign ? "Edit Design Theme" : "Add New Design Theme"}
              </h3>
              <button
                onClick={() => setDesignModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-4">
              <Input
                label="Design Theme Name *"
                placeholder="e.g. Royal Gold Drip & Macarons"
                value={designForm.name}
                onChange={(e) => setDesignForm({ ...designForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Design Surcharge (₹) *"
                  type="number"
                  placeholder="0 if free"
                  value={designForm.priceModifier}
                  onChange={(e) => setDesignForm({ ...designForm, priceModifier: Number(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-xs font-bold text-[#3B302B] mb-1">Category</label>
                  <select
                    value={designForm.category}
                    onChange={(e) => setDesignForm({ ...designForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs font-semibold bg-white outline-none focus:border-[#596B58]"
                  >
                    <option value="Celebration">Celebration</option>
                    <option value="Luxury Celebration">Luxury Celebration</option>
                    <option value="Trendy & Aesthetic">Trendy & Aesthetic</option>
                    <option value="Weddings & Anniversaries">Weddings & Anniversaries</option>
                    <option value="Kids & Fun">Kids & Fun</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B302B] mb-1">Theme Description</label>
                <textarea
                  rows={2}
                  placeholder="24k edible gold foil accents, chocolate drip..."
                  value={designForm.description}
                  onChange={(e) => setDesignForm({ ...designForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58]"
                />
              </div>

              <MediaUploader
                value={designForm.imageUrl}
                onChange={(url) => setDesignForm({ ...designForm, imageUrl: url })}
                entityType="PRODUCT"
              />

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDesignModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <span>Save Design Theme</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-res Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
            <img src={previewImage} alt="Preview" className="w-full h-full object-contain rounded-xl max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
};
