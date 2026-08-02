import type { OrderDetails } from "./order.service";

export const invoiceService = {
  /**
   * Generates and downloads a branded PDF Invoice for a given order
   */
  downloadOrderInvoice(order: OrderDetails): void {
    const invoiceWindow = window.open("", "_blank");
    if (!invoiceWindow) {
      alert("Please allow popup windows to download your invoice PDF.");
      return;
    }

    const items = order.items || [
      { id: "1", productId: "p1", name: "Belgian Truffle Cake", unitPrice: order.totalAmount, quantity: 1, itemTotal: order.totalAmount }
    ];

    const itemsHtml = items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #E8E2D9;">
          <td style="padding: 10px 12px;">
            <div style="font-weight: 700; color: #2C1E16;">${item.name}</div>
            <span style="font-size: 10px; background-color: #FFF3E6; color: #E67E22; padding: 2px 6px; border-radius: 4px; border: 1px solid #E67E22;">100% Fresh Artisanal</span>
          </td>
          <td style="padding: 10px 12px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 600;">₹${item.unitPrice || 499}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #2C1E16;">₹${item.itemTotal || (item.unitPrice * item.quantity)}</td>
        </tr>
      `
      )
      .join("");

    const deliveryAddr = order.deliveryAddress
      ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}`
      : "Store Pickup";

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber} - OneBite Bakery</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F9F6F0; color: #2C1E16; padding: 30px; margin: 0; }
          .invoice-card { max-width: 750px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(44,30,22,0.08); border: 1px solid #E8E2D9; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FFF3E6; padding-bottom: 20px; margin-bottom: 30px; }
          .brand-title { font-size: 28px; font-weight: 800; color: #E67E22; margin: 0; }
          .tagline { font-size: 11px; font-weight: 700; color: #6E5D4F; margin-top: 4px; }
          .invoice-meta { text-align: right; font-size: 12px; color: #6E5D4F; }
          .inv-badge { display: inline-block; background-color: #E67E22; color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 13px; margin-bottom: 6px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .box { background: #FFFBF5; padding: 16px; border-radius: 12px; border: 1px solid #E8E2D9; font-size: 12px; }
          .box h4 { margin: 0 0 8px 0; color: #E67E22; font-size: 13px; font-weight: 800; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
          th { background-color: #FFF3E6; color: #2C1E16; padding: 10px 12px; text-align: left; font-weight: 800; }
          .totals { font-size: 13px; border-top: 2px solid #E8E2D9; padding-top: 16px; width: 280px; margin-left: auto; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; }
          .grand-total { font-size: 18px; font-weight: 900; color: #E67E22; border-top: 1px solid #E8E2D9; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; font-size: 11px; color: #9C8C7E; border-top: 1px solid #E8E2D9; padding-top: 20px; margin-top: 30px; }
          @media print {
            body { padding: 0; background: #fff; }
            .invoice-card { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div>
              <h1 class="brand-title">OneBite Bakery</h1>
              <div class="tagline">हर जश्न का पहला निवाला। &bull; Pure Joy in Every Single Bite</div>
            </div>
            <div class="invoice-meta">
              <div class="inv-badge">TAX INVOICE</div>
              <div><strong>Invoice #:</strong> INV-${order.orderNumber}</div>
              <div><strong>Date:</strong> ${new Date(order.createdAt || Date.now()).toLocaleDateString()}</div>
              <div><strong>Status:</strong> ${order.paymentStatus || 'PAID'}</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <h4>Billed To (Customer):</h4>
              <div><strong>Customer Phone:</strong> +91 9876543210</div>
              <div><strong>Delivery Address:</strong> ${deliveryAddr}</div>
            </div>
            <div class="box">
              <h4>Bakery Store Info:</h4>
              <div><strong>Store Name:</strong> OneBite Bakery Main Kitchen</div>
              <div><strong>Address:</strong> 123 Artisanal Bakery Lane, Connaught Place, New Delhi 110001</div>
              <div><strong>GSTIN:</strong> 07AAAAA0000A1Z5</div>
              <div><strong>FSSAI Lic No:</strong> 10021011000458</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><span>Subtotal:</span><span>₹${order.subtotal || order.totalAmount}</span></div>
            <div class="row"><span>GST Tax (5%):</span><span>₹${order.taxAmount || Math.round(order.totalAmount * 0.05)}</span></div>
            <div class="row"><span>Delivery Charges:</span><span>${(order.deliveryFee === 0) ? '<strong style="color:#27AE60;">FREE</strong>' : `₹${order.deliveryFee || 50}`}</span></div>
            ${(order.discountAmount && order.discountAmount > 0) ? `<div class="row" style="color: #27AE60;"><span>Discount:</span><span>-₹${order.discountAmount}</span></div>` : ''}
            <div class="row grand-total"><span>Grand Total:</span><span>₹${order.totalAmount}</span></div>
          </div>

          <div class="footer">
            <p><strong>Thank you for celebrating with OneBite Bakery!</strong></p>
            <p>This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
  },
};
