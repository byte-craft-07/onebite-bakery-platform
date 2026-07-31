import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E8E2D9] bg-[#FFFBF5]/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-[#E67E22] tracking-tight">OneBite</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFF3E6] text-[#E67E22] border border-[#E67E22]/30">
              Bakery
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8 font-medium text-sm text-[#2C1E16]">
            <Link to="/" className="hover:text-[#E67E22] transition-colors">Home</Link>
            <Link to="/products" className="hover:text-[#E67E22] transition-colors">Products</Link>
            <Link to="/categories" className="hover:text-[#E67E22] transition-colors">Categories</Link>
            <Link to="/occasions" className="hover:text-[#E67E22] transition-colors">Occasions</Link>
            <Link to="/about" className="hover:text-[#E67E22] transition-colors">About Us</Link>
            <Link to="/contact" className="hover:text-[#E67E22] transition-colors">Contact</Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full text-[#2C1E16] hover:bg-[#F9F6F0] transition-colors"
              aria-label="Open Search"
            >
              <Search className="h-5 w-5" />
            </button>

            <button
              className="p-2 rounded-full text-[#2C1E16] hover:bg-[#F9F6F0] transition-colors relative"
              aria-label="Favorites"
            >
              <Heart className="h-5 w-5" />
            </button>

            <button
              className="p-2.5 rounded-xl bg-[#E67E22] text-white hover:bg-[#D35400] transition-colors flex items-center gap-2 shadow-sm"
              aria-label="View Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-white text-[#E67E22]">3</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#2C1E16]"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen ? (
          <div className="border-t border-[#E8E2D9] bg-white p-4 animate-in slide-in-from-top-2">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search Belgian Chocolate Cake, Croissants, Eggless tarts..."
                className="w-full text-sm outline-none bg-transparent"
                autoFocus
              />
              <button onClick={() => setIsSearchOpen(false)} className="text-xs font-semibold text-gray-500">
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div
            className="w-4/5 max-w-xs h-full bg-[#FFFBF5] p-6 space-y-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="text-xl font-extrabold text-[#E67E22]">OneBite Bakery</div>
              <nav className="flex flex-col gap-4 font-medium text-base text-[#2C1E16]">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                <Link to="/products" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
                <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)}>Categories</Link>
                <Link to="/occasions" onClick={() => setIsMobileMenuOpen(false)}>Occasions</Link>
                <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E8E2D9] text-xs text-[#6E5D4F]">
              Freshly baked with love &bull; 100% Quality Guaranteed
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
