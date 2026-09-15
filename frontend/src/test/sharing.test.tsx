import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { buildProductShareUrl } from "@/utils/sharing/buildProductShareUrl";
import { buildShareMessage } from "@/utils/sharing/buildShareMessage";
import { copyToClipboard } from "@/utils/sharing/shareProduct";
import { ShareButton } from "@/components/sharing/ShareButton";
import { ShareModal } from "@/components/sharing/ShareModal";

describe("Sharing Utilities", () => {
  describe("buildProductShareUrl", () => {
    it("builds canonical URL from product slug", () => {
      const url = buildProductShareUrl("chocolate-truffle-cake");
      expect(url).toContain("/products/chocolate-truffle-cake");
    });

    it("falls back to product id when slug is missing", () => {
      const url = buildProductShareUrl("prod-999");
      expect(url).toContain("/products/prod-999");
    });

    it("uses custom base URL when provided", () => {
      const url = buildProductShareUrl("red-velvet", "https://theonlinebakery.com");
      expect(url).toBe("https://theonlinebakery.com/products/red-velvet");
    });
  });

  describe("buildShareMessage", () => {
    it("formats cake message with price and url", () => {
      const bundle = buildShareMessage({
        id: "1",
        name: "Red Velvet Cake",
        price: 799,
        productType: "CAKE",
      });
      expect(bundle.fullMessage).toContain("Red Velvet Cake");
      expect(bundle.fullMessage).toContain("₹799");
      expect(bundle.fullMessage).toContain("🍰");
      expect(bundle.fullMessage).toContain("Order fresh online here:");
    });

    it("formats custom cake with custom emoji and text", () => {
      const bundle = buildShareMessage({
        id: "2",
        name: "Barbie Birthday Cake",
        price: 1499,
        productType: "CUSTOM_CAKE",
      });
      expect(bundle.fullMessage).toContain("Barbie Birthday Cake");
      expect(bundle.fullMessage).toContain("🎂");
      expect(bundle.fullMessage).toContain("celebration cake");
    });

    it("formats combo product with party emoji", () => {
      const bundle = buildShareMessage({
        id: "3",
        name: "Party Celebration Pack",
        price: 1999,
        productType: "COMBO",
      });
      expect(bundle.fullMessage).toContain("🎉");
    });
  });

  describe("copyToClipboard", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("uses navigator.clipboard.writeText when available", async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const success = await copyToClipboard("https://theonlinebakery.com/products/cake");
      expect(success).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith("https://theonlinebakery.com/products/cake");
    });
  });
});

describe("Sharing Components", () => {
  const sampleProduct = {
    id: "prod-456",
    name: "Dutch Truffle Delight",
    slug: "dutch-truffle-delight",
    price: 650,
    description: "Rich dark chocolate ganache cake.",
    productType: "CAKE",
    mainImage: "https://example.com/cake.jpg",
  };

  it("renders ShareButton with custom label and variant", () => {
    render(<ShareButton product={sampleProduct} label="Share Cake" variant="pill" />);
    expect(screen.getByText("Share Cake")).toBeInTheDocument();
  });

  it("opens ShareModal when ShareButton is clicked", () => {
    render(<ShareButton product={sampleProduct} label="Share" variant="outline" />);
    const button = screen.getByRole("button", { name: /share/i });
    fireEvent.click(button);

    expect(screen.getByText("Share this Bakery Delight")).toBeInTheDocument();
    expect(screen.getByText("Dutch Truffle Delight")).toBeInTheDocument();
    expect(screen.getByText("Save Photo")).toBeInTheDocument();
  });

  it("renders all share channels inside ShareModal", () => {
    const handleClose = vi.fn();
    render(<ShareModal isOpen={true} onClose={handleClose} product={sampleProduct} />);

    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Insta Story")).toBeInTheDocument();
    expect(screen.getByText("Telegram")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Share on X")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp Status")).toBeInTheDocument();
  });

  it("handles Copy Link button click and displays copied state", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const handleClose = vi.fn();
    render(<ShareModal isOpen={true} onClose={handleClose} product={sampleProduct} />);

    const copyBtn = screen.getByRole("button", { name: /copy link/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("shows Instagram Story guide when Instagram Story button is clicked", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const handleClose = vi.fn();
    render(<ShareModal isOpen={true} onClose={handleClose} product={sampleProduct} />);

    const instaBtn = screen.getByRole("button", { name: /insta story/i });
    fireEvent.click(instaBtn);

    await waitFor(() => {
      expect(screen.getByText("How to Post on Instagram Story:")).toBeInTheDocument();
    });
  });

  it("shows WhatsApp Status guide when WhatsApp Status button is clicked on desktop", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const handleClose = vi.fn();
    render(<ShareModal isOpen={true} onClose={handleClose} product={sampleProduct} />);

    const statusBtn = screen.getByRole("button", { name: /whatsapp status/i });
    fireEvent.click(statusBtn);

    await waitFor(() => {
      expect(screen.getByText("How to Post on WhatsApp Status:")).toBeInTheDocument();
    });
  });
});
