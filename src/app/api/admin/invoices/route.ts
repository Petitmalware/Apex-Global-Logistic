import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!user.roles.includes(AUTH_ROLES.ADMIN) && !user.roles.includes(AUTH_ROLES.SUPER_ADMIN))
    ) {
      return NextResponse.json(
        { success: false, error: "Session expired or unauthorized. Please re-login." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const {
      invoiceNumber,
      customerName = "Customer",
      customerEmail,
      billingAddress = "",
      dueDate,
      lineItems = [],
      taxRate = 0,
      notes = "",
      status = "DRAFT",
    } = body;

    if (!customerEmail || typeof customerEmail !== "string" || !customerEmail.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer email is required." },
        { status: 400 },
      );
    }

    // Resolve or find organization
    let organizationId = user.organizationId;
    if (!organizationId) {
      const org = await prisma.organization.findFirst({ select: { id: true } });
      organizationId = org?.id ?? null;
    }
    if (!organizationId) {
      const createdOrg = await prisma.organization.create({
        data: {
          name: "Apex Global Logistics",
          slug: `apex-${Date.now()}`,
        },
      });
      organizationId = createdOrg.id;
    }

    // Resolve customer user if exists
    let customerId: string | null = null;
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: customerEmail.trim().toLowerCase() },
        select: { id: true },
      });
      if (existingUser) {
        customerId = existingUser.id;
      }
    } catch {
      // Ignore user lookup error
    }

    // Format line items
    const parsedLineItems = (
      Array.isArray(lineItems) ? lineItems : [{ description: "Logistics Service", quantity: 1, unitPrice: 0 }]
    ).map((item: { description?: string; quantity?: number; unitPrice?: number }) => {
      const qty = Math.max(1, Number(item?.quantity) || 1);
      const price = Math.max(0, Number(item?.unitPrice) || 0);
      return {
        description: item?.description?.trim() || "Logistics Service",
        quantity: qty,
        unitPrice: price,
        total: Math.round(qty * price * 100) / 100,
      };
    });

    const subtotal = parsedLineItems.reduce((acc, item) => acc + item.total, 0);
    const taxTotal = Math.round(subtotal * (Math.max(0, Number(taxRate) || 0) / 100) * 100) / 100;
    const total = Math.round((subtotal + taxTotal) * 100) / 100;

    const safeDueDate =
      dueDate && !isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : null;

    // Ensure invoice number is unique for this organization
    let finalInvoiceNumber = (invoiceNumber || `INV-${Math.floor(Math.random() * 9000) + 1000}`).trim();
    const existingWithNumber = await prisma.invoice.findFirst({
      where: { organizationId, invoiceNumber: finalInvoiceNumber },
      select: { id: true },
    });

    // If an invoice with this number already exists, update it rather than throwing duplicate error
    if (existingWithNumber) {
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: existingWithNumber.id },
      });

      const updated = await prisma.invoice.update({
        where: { id: existingWithNumber.id },
        data: {
          customerId,
          status: status === "ISSUED" ? "ISSUED" : "DRAFT",
          subtotal,
          taxTotal,
          total,
          dueDate: safeDueDate,
          notes: notes || null,
          metadata: {
            billTo: {
              name: customerName || "Customer",
              email: customerEmail.trim().toLowerCase(),
              address: billingAddress || null,
            },
          },
          lineItems: {
            create: parsedLineItems.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
              sortOrder: index,
            })),
          },
        },
        include: { lineItems: true },
      });

      return NextResponse.json({ success: true, invoice: updated });
    }

    // Create fresh invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        organizationId,
        invoiceNumber: finalInvoiceNumber,
        customerId,
        status: status === "ISSUED" ? "ISSUED" : "DRAFT",
        currency: "USD",
        subtotal,
        taxTotal,
        total,
        dueDate: safeDueDate,
        issuedAt: new Date(),
        notes: notes || null,
        metadata: {
          billTo: {
            name: customerName || "Customer",
            email: customerEmail.trim().toLowerCase(),
            address: billingAddress || null,
          },
        },
        lineItems: {
          create: parsedLineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            sortOrder: index,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error("[Create Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
