
const { sendMail } = require("../config/mailer");


const STATUS_META = {
  pending: {
    color: "#F59E0B",
    icon: "🕐",
    title: "Order Placed Successfully!",
    message: "We've received your order and it's being prepared.",
    showETA: false,
  },
  dispatched: {
    color: "#3B82F6",
    icon: "📦",
    title: "Your Order Has Been Dispatched!",
    message: "Your package is on its way to the delivery hub.",
    showETA: true,
  },
  out_for_delivery: {
    color: "#8B5CF6",
    icon: "🚚",
    title: "Out for Delivery!",
    message: "Your order is out for delivery and will arrive today.",
    showETA: true,
  },
  delivered: {
    color: "#10B981",
    icon: "✅",
    title: "Order Delivered!",
    message: "Your order has been delivered successfully. Enjoy!",
    showETA: false,
  },
  cancelled: {
    color: "#EF4444",
    icon: "❌",
    title: "Order Cancelled",
    message:
      "Your order has been cancelled. If you didn't request this, please contact support.",
    showETA: false,
  },
};


function getETA(status) {
  const now = new Date();
  if (status === "dispatched") {
    now.setDate(now.getDate() + 3);
    return now.toDateString();
  }
  if (status === "out_for_delivery") {
    return "Today by 9:00 PM";
  }
  return null;
}


function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}


function buildItemRows(items = []) {
  if (!items.length) return "<tr><td colspan='3'>No items</td></tr>";
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;">
          ${item.name || item.product?.name || "Product"}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">
          x${item.quantity}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">
          ${formatCurrency((item.price || 0) * (item.quantity || 1))}
        </td>
      </tr>`
    )
    .join("");
}


function buildEmailHTML(order, status) {
  const meta = STATUS_META[status] || STATUS_META["pending"];
  const eta = meta.showETA ? getETA(status) : null;
  const itemRows = buildItemRows(order.items || order.orderItems);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${meta.title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:${meta.color};padding:40px 32px;text-align:center;">
              <div style="font-size:48px;margin-bottom:12px;">${meta.icon}</div>
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;
                         letter-spacing:-0.5px;">${meta.title}</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">
                ${meta.message}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <!-- Greeting -->
              <p style="color:#374151;font-size:16px;margin:0 0 24px;">
                Hi <strong>${order.user?.name || order.shippingAddress?.name || "Valued Customer"}</strong>,
              </p>

              <!-- Order Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border-radius:12px;padding:20px;
                       border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6B7280;font-size:13px;padding-bottom:8px;">ORDER ID</td>
                        <td style="color:#111827;font-size:13px;font-weight:600;
                                   text-align:right;padding-bottom:8px;">
                          #${order._id?.toString().slice(-8).toUpperCase() || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#6B7280;font-size:13px;padding-bottom:8px;">STATUS</td>
                        <td style="text-align:right;padding-bottom:8px;">
                          <span style="background:${meta.color}20;color:${meta.color};
                                       padding:3px 10px;border-radius:20px;
                                       font-size:12px;font-weight:600;text-transform:uppercase;">
                            ${status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                      ${
                        eta
                          ? `<tr>
                        <td style="color:#6B7280;font-size:13px;padding-bottom:8px;">
                          ESTIMATED DELIVERY
                        </td>
                        <td style="color:#111827;font-size:13px;font-weight:600;
                                   text-align:right;padding-bottom:8px;">${eta}</td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="color:#6B7280;font-size:13px;">ORDER DATE</td>
                        <td style="color:#111827;font-size:13px;font-weight:600;text-align:right;">
                          ${new Date(order.createdAt || Date.now()).toDateString()}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Items Table -->
              <h3 style="color:#111827;font-size:15px;font-weight:600;margin:0 0 12px;">
                Order Items
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:12px;
                       overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#f3f4f6;">
                    <th style="padding:10px 8px;text-align:left;color:#6B7280;
                               font-size:12px;font-weight:600;text-transform:uppercase;">
                      Item
                    </th>
                    <th style="padding:10px 8px;text-align:center;color:#6B7280;
                               font-size:12px;font-weight:600;text-transform:uppercase;">
                      Qty
                    </th>
                    <th style="padding:10px 8px;text-align:right;color:#6B7280;
                               font-size:12px;font-weight:600;text-transform:uppercase;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr style="background:#f9fafb;">
                    <td colspan="2"
                      style="padding:12px 8px;font-weight:700;color:#111827;font-size:15px;">
                      Total
                    </td>
                    <td style="padding:12px 8px;font-weight:700;color:${meta.color};
                               font-size:15px;text-align:right;">
                      ${formatCurrency(order.totalPrice || order.total || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <!-- Shipping Address -->
              ${
                order.shippingAddress
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border-radius:12px;padding:16px;
                       border:1px solid #e5e7eb;margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;color:#6B7280;font-size:12px;
                               font-weight:600;text-transform:uppercase;">
                      Shipping To
                    </p>
                    <p style="margin:0;color:#111827;font-size:14px;line-height:1.6;">
                      ${order.shippingAddress.name || ""}<br/>
                      ${order.shippingAddress.address || ""}<br/>
                      ${order.shippingAddress.city || ""},
                      ${order.shippingAddress.state || ""}
                      ${order.shippingAddress.postalCode || ""}<br/>
                      ${order.shippingAddress.country || ""}
                    </p>
                  </td>
                </tr>
              </table>`
                  : ""
              }

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${process.env.FRONTEND_URL || "#"}/orders"
                      style="background:${meta.color};color:#ffffff;
                             padding:14px 32px;border-radius:8px;
                             text-decoration:none;font-weight:600;font-size:15px;
                             display:inline-block;">
                      View Your Order
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer Note -->
              <p style="color:#9CA3AF;font-size:13px;text-align:center;margin:0;
                        border-top:1px solid #f0f0f0;padding-top:20px;">
                If you have questions, reply to this email or contact
                <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.SMTP_USER}"
                  style="color:${meta.color};">
                  ${process.env.SUPPORT_EMAIL || process.env.GMAIL_USER}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;
                       border-top:1px solid #f0f0f0;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                © ${new Date().getFullYear()} Nazara Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


function buildSubject(order, status) {
  const orderId = `#${order._id?.toString().slice(-8).toUpperCase() || "ORDER"}`;
  const subjects = {
    pending: `Order Confirmed ${orderId} 🎉`,
    dispatched: `Your Order ${orderId} Has Been Dispatched 📦`,
    out_for_delivery: `Your Order ${orderId} Is Out for Delivery 🚚`,
    delivered: `Order ${orderId} Delivered Successfully ✅`,
    cancelled: `Order ${orderId} Has Been Cancelled`,
  };
  return subjects[status] || `Order Update: ${orderId}`;
}


/**
 * Send order status email.
 * @param {object} order  
 * @param {string} status  
 */
async function sendOrderStatusEmail(order, status) {
  const email =
    order.user?.email ||
    order.userEmail ||
    order.shippingAddress?.email;

  if (!email) {
    console.warn(
      `[OrderEmail] No email address found for order ${order._id}. Skipping.`
    );
    return;
  }

  if (!STATUS_META[status]) {
    console.warn(`[OrderEmail] Unknown status "${status}". Skipping email.`);
    return;
  }

  const mailOptions = {
    to: email,
    subject: buildSubject(order, status),
    html: buildEmailHTML(order, status),
  };

  const result = await sendMail(mailOptions);
  if (!result) {
    console.error(
      `[OrderEmail] Failed to send "${status}" email for order ${order._id}`
    );
  }
  return result;
}

module.exports = { sendOrderStatusEmail };