import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  MessageSquare,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import {
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  AdminTableSkeleton,
  AdminToolbar,
} from "../components/AdminComponents";
import { reviewService } from "@/services/review.service";
import type { MockReview } from "@/data/mockData";

export const AdminReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<MockReview[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await reviewService.getAdminReviews({
        search: searchQuery.trim() || undefined,
        rating: ratingFilter !== "all" ? Number(ratingFilter) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setReviews(res.reviews || []);
      setTotalCount(res.total || 0);
    } catch (_err) {
      setReviews([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleToggleStatus = async (rev: MockReview) => {
    try {
      const updated = await reviewService.toggleReviewStatus(rev.id);
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, isActive: updated.isActive } : r))
      );
      setStatusMsg({
        text: `Review marked as ${updated.isActive ? "Active (Visible)" : "Hidden"}!`,
        type: "success",
      });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (_err) {
      setStatusMsg({ text: "Failed to update review status.", type: "error" });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer review?")) {
      return;
    }

    try {
      await reviewService.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setStatusMsg({ text: "Review deleted successfully.", type: "success" });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (_err) {
      setStatusMsg({ text: "Failed to delete review.", type: "error" });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : "0.0";

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const hiddenCount = reviews.filter((r) => r.isActive === false).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Ratings & Reviews Management"
        description="Inspect all real customer ratings and reviews directly from the database, moderate reviews, and ensure verified feedback quality."
      />

      {statusMsg ? (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <span>{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
          <span>{statusMsg.text}</span>
        </div>
      ) : null}

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Total Real Reviews"
          value={totalCount.toString()}
          change="In Database"
          isPositive={true}
          icon={<MessageSquare className="h-5 w-5 text-[#596B58]" />}
        />
        <AdminStatCard
          title="Average Overall Rating"
          value={averageRating === "0.0" ? "N/A" : `${averageRating} / 5.0`}
          change="Customer Score"
          isPositive={Number(averageRating) >= 4}
          icon={<Star className="h-5 w-5 text-amber-500 fill-amber-500" />}
        />
        <AdminStatCard
          title="5-Star Loved Reviews"
          value={fiveStarCount.toString()}
          change="Exceptional Rating"
          isPositive={true}
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
        />
        <AdminStatCard
          title="Hidden / Moderated"
          value={hiddenCount.toString()}
          change="Inactive"
          isPositive={hiddenCount === 0}
          icon={<AlertCircle className="h-5 w-5 text-red-500" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md flex gap-2">
          <AdminToolbar
            searchPlaceholder="Search reviewer name, email, or product..."
            onSearchChange={setSearchQuery}
          />
          <Button type="submit" className="h-10 text-xs font-bold px-4 shrink-0">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E5DEC9] bg-white text-xs text-[#3B302B] font-semibold outline-none focus:border-[#596B58]"
          >
            <option value="all">All Ratings (1-5★)</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E5DEC9] bg-white text-xs text-[#3B302B] font-semibold outline-none focus:border-[#596B58]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <AdminTable
        headers={[
          "Reviewer Details",
          "Product",
          "Score",
          "Customer Comment & Feedback",
          "Submission Date",
          "Status",
          "Moderation Actions",
        ]}
      >
        {isLoading ? (
          <AdminTableSkeleton columns={7} rows={5} />
        ) : reviews.length > 0 ? (
          reviews.map((rev) => {
            const rawName = rev.customerName || rev.name;
            const displayName =
              rawName && rawName !== "Verified Customer"
                ? rawName
                : rev.userEmail
                  ? rev.userEmail.split("@")[0]
                  : "Customer";

            const isStock =
              rev.avatar &&
              (rev.avatar.includes("unsplash.com/photo-1534528741775-53994a69daeb") ||
                rev.avatar.includes("unsplash.com/photo-1494790108377-be9c29b29330") ||
                rev.avatar.includes("unsplash.com/photo-1507003211169-0a1dd7228f2d"));

            const avatarSrc =
              !rev.avatar || isStock
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=596B58&color=fff&bold=true`
                : rev.avatar;

            const isActive = rev.isActive !== false;

            return (
              <tr key={rev.id} className="hover:bg-[#FFF8EC]/50 transition-colors">
                {/* Reviewer Details */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=596B58&color=fff&bold=true`;
                      }}
                      className="h-9 w-9 rounded-full object-cover border border-[#596B58]/30 shadow-2xs shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#3B302B] text-xs truncate max-w-[130px]">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1 py-0.2 rounded font-bold">
                          ✓
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7A6E65] block truncate max-w-[150px]">
                        {rev.userEmail || (displayName.includes("@") ? displayName : "Logged-in user")}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Product */}
                <td className="px-4 py-3">
                  <span className="font-semibold text-xs text-[#3B302B] block max-w-[160px] truncate" title={rev.productName}>
                    {rev.productName || "Bakery General"}
                  </span>
                  {rev.orderId ? (
                    <span className="text-[10px] font-mono text-[#596B58]">
                      Order #{rev.orderId.slice(-6)}
                    </span>
                  ) : null}
                </td>

                {/* Rating */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-[#3B302B]">{rev.rating}</span>
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  </div>
                  {rev.qualityRating || rev.tasteRating ? (
                    <span className="text-[10px] text-gray-400 block">
                      Taste: {rev.tasteRating || rev.rating}★
                    </span>
                  ) : null}
                </td>

                {/* Comment & Tags */}
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-xs text-[#3B302B] line-clamp-2 leading-relaxed">
                    "{rev.comment}"
                  </p>
                  {rev.tags && rev.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rev.tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] bg-[#FFF8EC] border border-[#E5DEC9] text-[#7A6E65] px-1.5 py-0.2 rounded-md"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent"}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <Badge variant={isActive ? "success" : "neutral"}>
                    {isActive ? "ACTIVE" : "HIDDEN"}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(rev)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                      title={isActive ? "Hide review from customer storefront" : "Make review visible"}
                    >
                      {isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{isActive ? "Hide" : "Show"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Permanently delete review"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={7} className="text-center py-12 text-xs text-[#7A6E65]">
              <div className="space-y-2 max-w-sm mx-auto">
                <p className="font-bold text-sm text-[#3B302B]">It has no reviews in the database</p>
                <p className="text-[11px] text-[#7A6E65]">
                  No customer reviews have been submitted yet. Once customers post reviews, they will appear here.
                </p>
              </div>
            </td>
          </tr>
        )}
      </AdminTable>
    </div>
  );
};
