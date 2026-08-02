import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Download, MessageSquare, PackageCheck, RefreshCw, ShoppingBag, Truck } from "lucide-react";

import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { Button } from "@/components/ui/Button";
import { orderService, type OrderDetails } from "@/services/order.service";
import { cartService } from "@/services/cart.service";

export const OrdersHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

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
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-[#2C1E16]">Your Order History</h1>

      <div className="space-y-4">
        {orders.map((ord) => (
          <Card key={ord.id} className="space-y-4 border-[#E8E2D9]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8E2D9] pb-3 gap-2">
              <div>
                <p className="text-xs font-bold text-[#2C1E16]">Order #{ord.orderNumber}</p>
                <p className="text-xs text-[#6E5D4F]">{new Date(ord.createdAt).toLocaleDateString()}</p>
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

            <div className="space-y-2">
              {ord.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-[#6E5D4F]">
                  <span>{item.name} x {item.quantity}</span>
                  <span className="font-bold text-[#2C1E16]">₹{item.itemTotal}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-extrabold text-[#2C1E16]">Total: ₹{ord.totalAmount}</span>

              <div className="flex items-center gap-2">
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
    </div>
  );
};

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      orderService
        .getOrderById(id)
        .then(setOrder)
        .catch(() => setOrder(null))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleWhatsAppSupport = () => {
    const text = encodeURIComponent(`Hi OneBite Bakery! I need support regarding my Order #${order?.orderNumber || id}.`);
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
        <h2 className="text-2xl font-bold text-[#2C1E16]">Order Details Not Found</h2>
        <Link to="/customer/orders">
          <Button variant="outline">Return to Order History</Button>
        </Link>
      </div>
    );
  }

  // Order Timeline Steps
  const timelineSteps = [
    { label: "Order Placed", status: "PENDING", isPassed: true },
    { label: "Confirmed", status: "CONFIRMED", isPassed: ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Baking & Preparing", status: "PREPARING", isPassed: ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Out for Delivery", status: "OUT_FOR_DELIVERY", isPassed: ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.orderStatus) },
    { label: "Delivered", status: "DELIVERED", isPassed: order.orderStatus === "DELIVERED" },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to="/customer/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6E5D4F] hover:text-[#E67E22]">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Order History</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" />
            <span>Download Invoice PDF</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handleWhatsAppSupport} className="flex items-center gap-1.5 border-green-600 text-green-700 hover:bg-green-50">
            <MessageSquare className="h-3.5 w-3.5 text-green-600" />
            <span>WhatsApp Support</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C1E16]">Order #{order.orderNumber}</h1>
          <p className="text-xs text-[#6E5D4F]">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={order.orderStatus === "DELIVERED" ? "success" : "primary"}>
          {order.orderStatus}
        </Badge>
      </div>

      {/* Order Status Timeline */}
      <Card className="space-y-4 bg-[#FFFBF5]">
        <h3 className="text-sm font-bold text-[#2C1E16]">Live Order Tracking Timeline</h3>
        <div className="flex items-center justify-between relative pt-2">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 z-10">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step.isPassed ? "bg-[#E67E22] text-white" : "bg-gray-200 text-gray-400"
                }`}
              >
                {idx + 1}
              </div>
              <span className={`text-[11px] text-center font-medium ${step.isPassed ? "text-[#2C1E16]" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Order Items Breakdown */}
      <Card className="space-y-4">
        <h3 className="text-lg font-bold text-[#2C1E16] border-b border-[#E8E2D9] pb-2">Order Items & Invoice Summary</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b border-[#E8E2D9] pb-2">
              <div>
                <p className="font-bold text-[#2C1E16]">{item.name}</p>
                <p className="text-xs text-[#6E5D4F]">Quantity: {item.quantity}</p>
              </div>
              <span className="font-extrabold text-[#2C1E16]">₹{item.itemTotal}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 text-xs space-y-1.5 text-[#6E5D4F]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charge</span>
            <span>₹{order.deliveryFee}</span>
          </div>
          <div className="flex justify-between font-bold text-[#2C1E16] text-sm pt-2 border-t">
            <span>Total Amount Paid</span>
            <span className="text-[#E67E22]">₹{order.totalAmount}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
