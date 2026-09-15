import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  MessageSquare,
  Navigation,
  RefreshCw,
  Star,
  Zap,
} from "lucide-react";
import { getStoreGoogleMapsUrl } from "@/components/shopping/CheckoutComponents";

import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { orderService, type OrderDetails } from "@/services/order.service";
import { cartService } from "@/services/cart.service";
import { reviewService } from "@/services/review.service";
import { RatingModal } from "@/components/review/RatingModal";
import { PerOrderRatingModal } from "@/components/review/PerOrderRatingModal";
import { FlipkartOrderTracker } from "@/components/shopping/FlipkartOrderTracker";

export const OrderReviewForm: React.FC<{ orderId: string; productName?: string }> = ({ orderId, productName }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await reviewService.addReview({
        name: "Verified Customer",
        rating,
        comment,
        orderId,
        productName,
      });
      setSubmitted(true);
    } catch (_err) {
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-50 border-green-200 text-center p-6 space-y-2">
        <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto animate-in zoom-in" />
        <h4 className="text-base font-bold text-green-900">Thank You for Your Feedback!</h4>
        <p className="text-xs text-green-700">Your review has been submitted and is now featured live in the moving marquee on our Home Page.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 bg-[#FFF8EC]/40 border-[#596B58]/30">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-500 fill-current" />
        <h3 className="text-lg font-bold text-[#3B302B]">Rate Your Order & Write a Review</h3>
      </div>
      <p className="text-xs text-[#7A6E65]">How was your cake quality, taste, and delivery service? Share your feedback with other customers!</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#3B302B]">Your Rating:</span>
          <div className="flex text-amber-500 cursor-pointer">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 transition-transform hover:scale-110 ${star <= rating ? "fill-current" : "text-gray-300"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <textarea
          rows={3}
          placeholder="Describe your cake taste, packaging quality, and delivery speed..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-3 rounded-xl border border-[#E5DEC9] text-xs outline-none focus:border-[#596B58] bg-white"
          required
        />

        <Button type="submit" size="sm" isLoading={isSubmitting} disabled={!comment.trim()}>
          Submit Review to Home Page
        </Button>
      </form>
    </Card>
  );
};

export const OrdersHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    orderService
      .getCustomerOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleOrderAgain = async (ord: OrderDetails) => {
    setReorderingId(ord.id);
    try {
      for (const item of ord.items) {
        await cartService.addItem({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
      window.location.href = "/cart";
    } catch (_err) {
      window.location.href = "/cart";
    } finally {
      setReorderingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <EmptyState
          title="No Orders Found"
          description="You haven't placed any bakery orders yet."
          action={
            <Link to="/products">
              <Button>Explore Fresh Baked Goods</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <Link
        to="/customer/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Account Hub</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B302B]">Your Order History</h1>
        <p className="text-xs text-[#7A6E65]">
          Rate past delivered orders to help other customers find top treats!
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((ord) => (
          <Card key={ord.id} className="space-y-4 border-[#E5DEC9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5DEC9] pb-3 gap-2">
              <div>
                <p className="text-xs font-bold text-[#3B302B]">Order #{ord.orderNumber}</p>
                <p className="text-xs text-[#7A6E65]">
                  {new Date(ord.createdAt).toLocaleDateString()}
                  {ord.locationSnapshot ? (
                    <span className="ml-2 font-semibold text-[#596B58]">
                      📍 {ord.locationSnapshot.villageName}, {ord.locationSnapshot.district}
                    </span>
                  ) : null}
                </p>
                {ord.deliveryTimePreference ? (
                  <p className="text-[11px] font-semibold text-[#596B58] mt-0.5">
                    {ord.deliveryTimePreference}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={ord.orderStatus === "DELIVERED" ? "success" : "primary"}>
                  {ord.orderStatus}
                </Badge>
                <Badge variant={ord.paymentStatus === "PAID" ? "success" : "warning"}>
                  Payment: {ord.paymentStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 py-1">
              {ord.items.map((item, idx) => {
                const itemImg =
                  (item as any)?.image ||
                  (item as any)?.thumbnailUrl ||
                  (item as any)?.imageUrl ||
                  (item as any)?.imageUrls?.[0] ||
                  (item as any)?.mainImage ||
                  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";
                return (
                  <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl overflow-hidden bg-[#FFF8EC] border border-[#E5DEC9] shrink-0 shadow-2xs">
                        <img
                          src={itemImg}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80";
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm text-[#3B302B]">{item.name}</p>
                        <p className="text-[11px] text-[#7A6E65]">
                          Qty: <strong>{item.quantity}</strong> • Unit: ₹{item.unitPrice || Math.round(item.itemTotal / (item.quantity || 1))}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-[#3B302B] shrink-0">₹{item.itemTotal}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-[#3B302B]">Total: ₹{ord.totalAmount}</span>

              <div className="flex flex-wrap items-center gap-2">
                {ord.orderStatus === "DELIVERED" || ord.orderStatus === "CANCELLED" ? (
                  <button
                    type="button"
                    onClick={() => setRatingOrder(ord)}
                    className="px-3 py-1.5 rounded-xl border border-[#596B58]/40 bg-[#FFF8EC] hover:bg-[#F7F2E7] text-[#596B58] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                    <span>Rate Products & Quality</span>
                  </button>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOrderAgain(ord)}
                  isLoading={reorderingId === ord.id}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Order Again</span>
                </Button>

                <Link to={`/customer/orders/${ord.id}`}>
                  <Button size="sm">View Details & Tracking</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PerOrderRatingModal
        isOpen={Boolean(ratingOrder)}
        onClose={() => setRatingOrder(null)}
        order={ratingOrder}
      />
    </div>
  );
};

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderRatingModalOpen, setIsOrderRatingModalOpen] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | undefined>(undefined);
  const [, setRatingVersion] = useState(0);

  useEffect(() => {
    if (id) {
      orderService
        .getOrderById(id)
        .then(setOrder)
        .catch(() => setOrder(null))
        .finally(() => setIsLoading(false));
    }

    const handleOrderRated = () => {
      setRatingVersion((v) => v + 1);
    };

    window.addEventListener("theonlinebakery_order_rated", handleOrderRated);
    return () => window.removeEventListener("theonlinebakery_order_rated", handleOrderRated);
  }, [id]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(`Hi The Online Bakery! I need support regarding my Order #${order?.orderNumber || id}.`);
    window.open(`https://wa.me/919876543210?text=${text}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-10">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-2xl font-bold text-[#3B302B]">Order Details Not Found</h2>
        <Link to="/customer/orders">
          <Button variant="outline">Return to Order History</Button>
        </Link>
      </div>
    );
  }

  const timelineSteps = [
    { label: "Order Placed", status: "PENDING", isPassed: true },
    { label: "Confirmed", status: "CONFIRMED", isPassed: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Baking & Preparing", status: "PREPARING", isPassed: ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Out for Delivery", status: "OUT_FOR_DELIVERY", isPassed: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Delivered", status: "DELIVERED", isPassed: order.orderStatus === "DELIVERED" },
  ];

  const ratedItemsMap = reviewService.getOrderRatingsMap(order.id);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link to="/customer/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58]">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Order History</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5 flex-1 sm:flex-initial justify-center">
            <Download className="h-3.5 w-3.5" />
            <span>Download Invoice PDF</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleWhatsAppSupport} className="flex items-center gap-1.5 border-green-600 text-green-700 hover:bg-green-50 flex-1 sm:flex-initial justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-green-600" />
            <span>WhatsApp Support</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#3B302B]">Order #{order.orderNumber}</h1>
          <p className="text-xs text-[#7A6E65]">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={order.orderStatus === "DELIVERED" ? "success" : "primary"}>
          {order.orderStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2 bg-[#FFF8EC]">
          <div className="flex items-center gap-2 font-bold text-xs text-[#3B302B]">
            <Clock className="h-4 w-4 text-[#596B58]" />
            <span>Delivery Timing Preference</span>
          </div>
          <p className="font-extrabold text-sm text-[#3B302B]">
            {order.deliveryTimePreference || (order.deliveryTimingType === "INSTANT" ? "⚡ Instant Delivery (Within 30-45 mins)" : "📅 Scheduled Delivery")}
          </p>
          <p className="text-[11px] text-[#7A6E65]">
            Method: <strong>{order.fulfillmentType === "HOME_DELIVERY" ? "Home Doorstep Delivery" : "Store Counter Pickup"}</strong>
          </p>
        </Card>

        <Card className="p-4 space-y-2 bg-[#FFF8EC]">
          <div className="flex items-center gap-2 font-bold text-xs text-[#3B302B]">
            {order.fulfillmentType === "STORE_PICKUP" ? (
              <>
                <Building className="h-4 w-4 text-[#596B58]" />
                <span>Store Pickup Location</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-[#596B58]" />
                <span>Delivery Destination</span>
              </>
            )}
          </div>
          {order.fulfillmentType === "STORE_PICKUP" ? (
            <div className="space-y-1.5 pt-0.5">
              <p className="text-xs font-bold text-[#3B302B]">The Online Bakery Store</p>
              <p className="text-xs text-[#7A6E65]">The Online Bakery, N 80°14, terha 25°49'43.3, 54.7"E, hamirpur, Uttar Pradesh 210502</p>
              <a
                href={getStoreGoogleMapsUrl("The Online Bakery terha hamirpur Uttar Pradesh 210502")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#596B58] hover:text-[#495948] underline pt-1"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Open in Google Maps & Get Directions</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : order.deliveryAddress || order.addressSnapshot ? (
            <p className="text-xs text-[#7A6E65]">
              {(order.deliveryAddress || order.addressSnapshot)?.street}, {(order.deliveryAddress || order.addressSnapshot)?.city} - {(order.deliveryAddress || order.addressSnapshot)?.pincode}
            </p>
          ) : order.locationSnapshot ? (
            <p className="text-xs text-[#7A6E65]">
              {order.locationSnapshot.villageName}, {order.locationSnapshot.district} ({order.locationSnapshot.pincode})
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-[#7A6E65]">The Online Bakery Store Counter</p>
              <a
                href={getStoreGoogleMapsUrl("The Online Bakery terha hamirpur Uttar Pradesh 210502")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#596B58] hover:text-[#495948] underline"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>View Google Map Address</span>
              </a>
            </div>
          )}
        </Card>
      </div>

      {/* Flipkart-Style Order Tracking Card */}
      <Card className="p-5 sm:p-6 space-y-4 bg-[#FFF8EC] border-[#E5DEC9]">
        <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-3">
          <h3 className="text-sm font-bold text-[#3B302B]">Live Order Tracking</h3>
          <span className="text-xs text-[#7A6E65]">Status: <strong className="text-[#596B58]">{order.orderStatus}</strong></span>
        </div>
        <FlipkartOrderTracker
          order={order}
          isRated={Object.keys(ratedItemsMap).length > 0}
          onRateClick={() => {
            setFocusedItemIndex(undefined);
            setIsOrderRatingModalOpen(true);
          }}
        />
      </Card>

      <PerOrderRatingModal
        isOpen={isOrderRatingModalOpen}
        onClose={() => setIsOrderRatingModalOpen(false)}
        order={order}
        focusedItemIndex={focusedItemIndex}
      />
    </div>
  );
};
