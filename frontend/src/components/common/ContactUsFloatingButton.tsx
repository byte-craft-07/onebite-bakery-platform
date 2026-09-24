import React, { useState } from "react";
import { Headphones, Mail, MessageCircle, Phone, Sparkles, X } from "lucide-react";

export const ContactUsFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      "Hi Onebite Bakery! I have a question or need assistance with my bakery order."
    );
    window.open(`https://wa.me/917897671632?text=${text}`, "_blank");
    setIsOpen(false);
  };

  const handleCall = () => {
    window.location.href = "tel:+917897671632";
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-[4.75rem] lg:bottom-6 right-3 sm:right-6 z-50 flex flex-col items-end">
      {/* Pop-up Box */}
      {isOpen ? (
        <div className="mb-3 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-3xl bg-white/95 backdrop-blur-md border border-[#E5DEC9] p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#FFF8EC] text-[#596B58]">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#3B302B]">Customer Support</h4>
                <p className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span>Online • Quick Response</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-[#3B302B] hover:bg-[#F7F2E7] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-[#7A6E65]">
            Any problem with cakes, flavors, delivery, or custom designs? Connect with our bakery team directly!
          </p>

          {/* Quick Action Options */}
          <div className="space-y-2.5">
            {/* 1. WhatsApp Support */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs">Chat on WhatsApp</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">+91 7897671632</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                Instant
              </span>
            </button>

            {/* 2. Direct Call Support */}
            <button
              type="button"
              onClick={handleCall}
              className="w-full p-3 rounded-2xl bg-[#FFF8EC] hover:bg-[#F7F2E7] border border-[#E5DEC9] text-[#3B302B] flex items-center justify-between transition-all cursor-pointer group active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#596B58] text-[#FFF8EC] shadow-2xs group-hover:scale-110 transition-transform">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-xs">Direct Call Helpline</p>
                  <p className="text-[10px] text-[#596B58] font-semibold">+91 7897671632</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-[#596B58] bg-white px-2 py-0.5 rounded-full shadow-2xs">
                Call Now
              </span>
            </button>

            {/* 3. Email Support */}
            <a
              href="mailto:ajaykterha@gmail.com"
              className="w-full p-2.5 rounded-2xl bg-[#F7F2E7] hover:bg-[#E5DEC9]/50 border border-[#E5DEC9] text-[#3B302B] flex items-center gap-3 text-xs font-semibold transition-all"
            >
              <div className="p-1.5 rounded-lg bg-white text-[#3B302B]">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <span>Email: ajaykterha@gmail.com</span>
            </a>
          </div>

          <div className="text-[10px] text-center text-[#7A6E65] font-medium">
            Available daily: 8:00 AM – 10:30 PM
          </div>
        </div>
      ) : null}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative overflow-hidden flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC] cursor-pointer font-extrabold text-xs sm:text-sm tracking-wide select-none transition-all duration-150 border border-[#596B58] shadow-lg hover:-translate-y-0.5 active:translate-y-0 group"
        title="Contact Us for Help"
      >
        <div className="relative z-10 shrink-0">
          <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
        </div>
        <span className="relative z-10">
          Contact Us
        </span>
      </button>
    </div>
  );
};
