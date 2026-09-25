import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Building,
  Cake,
  ChevronDown,
  Download,
  Gift,
  Heart,
  Home,
  Info,
  LogOut,
  MapPin,
  Menu,
  Package,
  PartyPopper,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  User,
  X,
} from "lucide-react";

import { useAuth } from "@/contexts/auth.context";
import { usePWA } from "@/hooks/usePWA";
import { cartService } from "@/services/cart.service";
import { LocationModal } from "@/components/location/LocationModal";
import { UserAvatar } from "@/components/common/UserAvatar";
import { BakeryLogo } from "@/components/navigation/BakeryLogo";

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState<number>(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, currentLocation, logout } = useAuth();
  const { isStandalone, promptInstall, setShowInstallModal } = usePWA();

  const syncCartCount = async () => {
    try {
      const cart = await cartService.getCart();
      setCartCount(cart.itemCount || 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    syncCartCount();

    const handleCartUpdate = () => {
      syncCartCount();
    };

    const checkShouldOpenLocation = () => {
      const shouldOpen = localStorage.getItem("onebitebakery_open_location_after_login");
      if (shouldOpen === "true") {
        localStorage.removeItem("onebitebakery_open_location_after_login");
        if (!location.pathname.includes("checkout")) {
          setIsLocationModalOpen(true);
        }
      }
    };

    checkShouldOpenLocation();

    const handleOpenLocationModal = () => {
      setIsLocationModalOpen(true);
    };

    window.addEventListener("onebitebakery_cart_updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    window.addEventListener("onebitebakery_open_location_modal", handleOpenLocationModal);

    return () => {
      window.removeEventListener("onebitebakery_cart_updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
      window.removeEventListener("onebitebakery_open_location_modal", handleOpenLocationModal);
    };
  }, [location.pathname, isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E5DEC9] bg-[#FFF8EC] text-[#3B302B] shadow-xs transition-all">
        {/* Main Header Container */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 xl:gap-4 flex-nowrap">
          
          {/* ================= MOBILE VIEW (< lg) ================= */}
          {/* Mobile Left: Hamburger Menu & Search Icon */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/15 active:bg-[#A8B89A]/25 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/15 active:bg-[#A8B89A]/25 transition-colors cursor-pointer"
              aria-label="Search Products"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Center: Bakery Brand Name & Logo */}
          <div className="flex lg:hidden flex-1 justify-center items-center px-1">
            <BakeryLogo size="sm" />
          </div>

          {/* Mobile Right: Shopping Bag Cart & User Profile Icon */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <Link
              to="/cart"
              className="p-1.5 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/15 active:bg-[#A8B89A]/25 transition-colors relative flex items-center justify-center"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5.5 w-5.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full bg-[#596B58] text-[#FFF8EC] flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              to={isAuthenticated ? "/customer/dashboard" : "/auth/login"}
              className="p-1.5 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/15 active:bg-[#A8B89A]/25 transition-colors flex items-center justify-center"
              aria-label="Account"
            >
              {isAuthenticated ? (
                <UserAvatar user={user} size="xs" className="ring-1.5 ring-[#596B58]/60" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
          </div>

          {/* ================= DESKTOP VIEW (>= lg) ================= */}
          {/* Desktop Left: Brand Logo + Location Selector */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4 shrink-0">
            <BakeryLogo size="md" />

            {/* Desktop Location Selector Badge */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F7F2E7] border border-[#E5DEC9] text-xs text-[#3B302B] transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Change Delivery Location"
            >
              <MapPin className="h-3.5 w-3.5 text-[#596B58] shrink-0 group-hover:scale-110 transition-transform" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] text-[#7A6E65] font-semibold leading-none">Deliver to:</span>
                <span className={`font-bold max-w-[90px] xl:max-w-[120px] truncate text-[11px] ${currentLocation?.villageName ? "text-[#3B302B]" : "text-amber-800"}`}>
                  {currentLocation?.villageName || "Select Address"}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-[#7A6E65] ml-0.5 shrink-0" />
            </button>
          </div>

          {/* Desktop Center Links */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 font-semibold text-xs xl:text-sm text-[#3B302B] shrink-0">
            <Link to="/" className="hover:text-[#596B58] transition-colors whitespace-nowrap">Home</Link>
            <Link to="/products" className="hover:text-[#596B58] transition-colors whitespace-nowrap">Products</Link>
            <Link to="/categories" className="hover:text-[#596B58] transition-colors whitespace-nowrap">Categories</Link>
            <Link to="/occasions" className="hover:text-[#596B58] transition-colors whitespace-nowrap">Occasions</Link>
            <Link to="/offers" className="text-[#596B58] font-bold hover:text-[#3B302B] transition-colors flex items-center gap-1 whitespace-nowrap">
              <span>Offers</span>
              <span className="text-[8px] xl:text-[9px] font-extrabold bg-[#D8BE91] text-[#3B302B] px-1.5 py-0.2 rounded-full shadow-2xs">New</span>
            </Link>
            <Link to="/decorations" className="hover:text-[#596B58] transition-colors whitespace-nowrap">Decorations</Link>
            <Link to="/about" className="hover:text-[#596B58] transition-colors whitespace-nowrap">About Us</Link>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 xl:p-2 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/20 transition-colors cursor-pointer"
              aria-label="Open Search"
            >
              <Search className="h-4.5 w-4.5 xl:h-5 xl:w-5" />
            </button>

            <Link
              to={isAuthenticated ? "/customer/favorites" : "/auth/login"}
              className="p-1.5 xl:p-2 rounded-xl text-[#3B302B] hover:bg-[#A8B89A]/20 transition-colors relative"
              aria-label="Favorites"
            >
              <Heart className="h-4.5 w-4.5 xl:h-5 xl:w-5" />
            </Link>

            {!isStandalone && (
              <button
                type="button"
                onClick={promptInstall}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl bg-[#596B58]/10 hover:bg-[#596B58]/20 text-[#596B58] text-xs font-bold transition-all border border-[#596B58]/20 cursor-pointer shadow-2xs whitespace-nowrap"
                title="Install Onebite Bakery App"
              >
                <Download className="h-4 w-4 text-[#596B58]" />
                <span className="hidden xl:inline">Install App</span>
                <span className="xl:hidden">App</span>
              </button>
            )}

            <Link
              to="/cart"
              className="px-2.5 py-1.5 xl:px-3 xl:py-2 rounded-xl bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] transition-all flex items-center gap-1.5 xl:gap-2 shadow-xs"
              aria-label="View Cart"
            >
              <ShoppingBag className="h-4.5 w-4.5 xl:h-5 xl:w-5" />
              <span className="text-xs font-bold px-1.5 xl:px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#596B58] min-w-[18px] text-center">
                {cartCount}
              </span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 xl:gap-2">
                {user?.role === "admin" ? (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    <span className="hidden xl:inline">👑 Admin Panel</span>
                    <span className="xl:hidden">Admin</span>
                  </Link>
                ) : user?.role === "branch_admin" ? (
                  <Link
                    to="/admin/branch/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                  >
                    <Building className="h-3.5 w-3.5 text-[#FFF8EC]" />
                    <span className="hidden xl:inline">Branch Portal</span>
                    <span className="xl:hidden">Branch</span>
                  </Link>
                ) : null}

                <Link
                  to="/customer/dashboard"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F7F2E7] border border-[#E5DEC9] text-xs font-bold text-[#3B302B] transition-all group max-w-[110px] xl:max-w-[140px] shadow-2xs"
                >
                  <UserAvatar user={user} size="xs" className="ring-1 ring-[#596B58]/50 shrink-0" />
                  <span className="truncate">{user?.name?.split(" ")[0] || "Account"}</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 text-[#7A6E65] hover:text-[#3B302B] hover:bg-[#A8B89A]/20 rounded-lg transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="px-3.5 py-1.5 xl:px-4 xl:py-2 rounded-xl bg-[#596B58] text-xs font-bold text-[#FFF8EC] hover:bg-[#495948] transition-all shadow-xs whitespace-nowrap"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen ? (
          <form onSubmit={handleSearchSubmit} className="border-t border-[#E5DEC9] bg-[#FFF8EC] p-3 sm:p-4 animate-in slide-in-from-top-2">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="h-5 w-5 text-[#7A6E65]" />
              <input
                type="text"
                placeholder="Search Belgian Chocolate Cake, Croissants, Eggless tarts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm outline-none bg-white rounded-lg px-3 py-2 text-[#3B302B] placeholder-[#7A6E65] border border-[#E5DEC9] focus:border-[#596B58]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs font-semibold text-[#596B58] hover:text-[#3B302B] px-2 py-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="w-4/5 max-w-xs h-full bg-[#FFF8EC] p-6 space-y-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="p-3 rounded-2xl bg-white border border-[#E5DEC9] text-center shadow-xs">
                <BakeryLogo size="sm" />
                <p className="text-[10px] font-medium text-[#596B58] mt-2">हर जश्न का पहला निवाला &bull; 100% Pure Joy</p>
              </div>

              {/* Mobile Drawer Location Selector */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsLocationModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5DEC9] text-xs text-[#3B302B] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#596B58]" />
                  <div className="text-left">
                    <p className="text-[10px] text-[#7A6E65] font-semibold">Delivery Location:</p>
                    <p className="font-bold text-[#596B58]">{currentLocation?.villageName || "Select Delivery Village"}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#596B58] underline">Change</span>
              </button>

              <nav className="flex flex-col gap-2 font-semibold text-sm text-[#3B302B]">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Home className="h-4 w-4 text-[#596B58]" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Package className="h-4 w-4 text-[#596B58]" />
                  <span>Products</span>
                </Link>
                <Link
                  to="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Box className="h-4 w-4 text-[#596B58]" />
                  <span>Categories</span>
                </Link>
                <Link
                  to="/occasions"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-[#596B58]" />
                  <span>Occasions</span>
                </Link>
                <Link
                  to="/custom-cake"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Cake className="h-4 w-4 text-[#596B58]" />
                  <span>Custom Cake Studio</span>
                </Link>
                <Link
                  to="/combos"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Gift className="h-4 w-4 text-[#596B58]" />
                  <span>Celebration Combos</span>
                </Link>
                <Link
                  to="/decorations"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <PartyPopper className="h-4 w-4 text-[#596B58]" />
                  <span>Party Decoration Shop</span>
                </Link>
                <Link
                  to="/offers"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Ticket className="h-4 w-4 text-[#596B58]" />
                  <span className="flex items-center gap-1.5">
                    <span>Offers & Coupons</span>
                    <span className="text-[9px] font-extrabold bg-[#D8BE91] text-[#3B302B] px-1.5 py-0.2 rounded-full">Deals</span>
                  </span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                >
                  <Info className="h-4 w-4 text-[#596B58]" />
                  <span>About Onebite Bakery</span>
                </Link>

                <div className="pt-2 border-t border-[#E5DEC9] space-y-2">
                  {isAuthenticated && user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-[#596B58] font-bold flex items-center gap-3 p-2 rounded-xl bg-white border border-[#596B58]/30"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>Central Admin Panel</span>
                    </Link>
                  )}
                  {isAuthenticated && user?.role === "branch_admin" && (
                    <Link
                      to="/admin/branch/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-[#596B58] font-bold flex items-center gap-3 p-2 rounded-xl bg-white border border-[#596B58]/30"
                    >
                      <Building className="h-4 w-4" />
                      <span>Branch Admin Portal</span>
                    </Link>
                  )}
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl bg-white text-[#596B58] border border-[#E5DEC9] font-bold transition-colors"
                      >
                        <User className="h-4 w-4 text-[#596B58]" />
                        <span>My Account Hub</span>
                      </Link>
                      <Link
                        to="/customer/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                      >
                        <Package className="h-4 w-4 text-[#596B58]" />
                        <span>My Orders & Tracking</span>
                      </Link>
                      <Link
                        to="/customer/addresses"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#A8B89A]/20 hover:text-[#596B58] transition-colors"
                      >
                        <MapPin className="h-4 w-4 text-[#596B58]" />
                        <span>Saved Delivery Addresses</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-xl bg-[#596B58] text-[#FFF8EC] font-bold"
                    >
                      <User className="h-4 w-4 text-[#FFF8EC]" />
                      <span>Log In</span>
                    </Link>
                  )}

                  {!isStandalone && (
                    <button
                      type="button"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        const installed = await promptInstall();
                        if (!installed) {
                          setShowInstallModal(true);
                        }
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#FFF8EC] border border-[#D8BE91] text-[#596B58] font-bold hover:bg-[#A8B89A]/20 transition-colors text-left text-xs cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-[#596B58] shrink-0" />
                      <div className="flex-1">
                        <div>Install App</div>
                        <div className="text-[10px] text-[#7A6E65] font-normal">Add to Home Screen for fast ordering</div>
                      </div>
                    </button>
                  )}
                </div>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E5DEC9] text-xs text-[#7A6E65]">
              हर जश्न का पहला निवाला। &bull; 100% Quality Guaranteed
            </div>
          </div>
        </div>
      ) : null}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Sticky Mobile Bottom Navigation Bar (< 1024px) */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFF8EC]/95 backdrop-blur-md border-t border-[#E5DEC9] px-1 sm:px-4 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-2px_12px_rgba(59,48,43,0.06)]">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 transition-colors p-1 min-w-[50px] sm:min-w-[56px] rounded-xl ${
            location.pathname === "/" ? "text-[#596B58] font-bold" : "text-[#3B302B] hover:text-[#596B58]"
          }`}
          data-tooltip="Home Page"
        >
          <div className={`p-1 rounded-full transition-transform ${location.pathname === "/" ? "bg-[#A8B89A]/25 scale-110" : ""}`}>
            <Home className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${location.pathname === "/" ? "stroke-[2.5]" : ""}`} />
          </div>
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        {/* 2. Products */}
        <Link
          to="/products"
          className={`flex flex-col items-center gap-0.5 transition-colors p-1 min-w-[50px] sm:min-w-[56px] rounded-xl ${
            location.pathname === "/products" ? "text-[#596B58] font-bold" : "text-[#3B302B] hover:text-[#596B58]"
          }`}
          data-tooltip="All Products"
        >
          <div className={`p-1 rounded-full transition-transform ${location.pathname === "/products" ? "bg-[#A8B89A]/25 scale-110" : ""}`}>
            <Cake className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${location.pathname === "/products" ? "stroke-[2.5]" : ""}`} />
          </div>
          <span className="text-[10px] font-bold">Products</span>
        </Link>

        {/* 3. Occasions */}
        <Link
          to="/occasions"
          className={`flex flex-col items-center gap-0.5 transition-colors p-1 min-w-[50px] sm:min-w-[56px] rounded-xl ${
            location.pathname === "/occasions" ? "text-[#596B58] font-bold" : "text-[#3B302B] hover:text-[#596B58]"
          }`}
          data-tooltip="Celebration Occasions"
        >
          <div className={`p-1 rounded-full transition-transform ${location.pathname === "/occasions" ? "bg-[#A8B89A]/25 scale-110" : ""}`}>
            <Sparkles className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${location.pathname === "/occasions" ? "stroke-[2.5]" : ""}`} />
          </div>
          <span className="text-[10px] font-bold">Occasions</span>
        </Link>

        {/* 4. Offers & Coupons */}
        <Link
          to="/offers"
          className={`flex flex-col items-center gap-0.5 transition-colors p-1 min-w-[50px] sm:min-w-[56px] rounded-xl ${
            location.pathname === "/offers" ? "text-[#596B58] font-bold" : "text-[#3B302B] hover:text-[#596B58]"
          }`}
          data-tooltip="Bakery Offers & Deals"
        >
          <div className={`relative p-1 rounded-full transition-transform ${location.pathname === "/offers" ? "bg-[#A8B89A]/25 scale-110" : ""}`}>
            <Ticket className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${location.pathname === "/offers" ? "stroke-[2.5] rotate-6" : ""}`} />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#596B58] ring-2 ring-white" />
          </div>
          <span className="text-[10px] font-bold">Offers</span>
        </Link>

        {/* 5. Orders & Tracking */}
        <Link
          to={isAuthenticated ? "/customer/orders" : "/auth/login"}
          className={`flex flex-col items-center gap-0.5 transition-colors p-1 min-w-[50px] sm:min-w-[56px] rounded-xl ${
            location.pathname.startsWith("/customer/orders") || location.pathname.startsWith("/orders")
              ? "text-[#596B58] font-bold"
              : "text-[#3B302B] hover:text-[#596B58]"
          }`}
          data-tooltip="My Orders & Live Tracking"
        >
          <div className={`p-1 rounded-full transition-transform ${
            location.pathname.startsWith("/customer/orders") || location.pathname.startsWith("/orders") ? "bg-[#A8B89A]/25 scale-110" : ""
          }`}>
            <Package className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${
              location.pathname.startsWith("/customer/orders") || location.pathname.startsWith("/orders") ? "stroke-[2.5]" : ""
            }`} />
          </div>
          <span className="text-[10px] font-bold">Orders</span>
        </Link>
      </nav>
    </>
  );
};
