import { NextRequest, NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";
import { InvoiceStatus } from "@prisma/client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!user.roles.includes(AUTH_ROLES.ADMIN) && !user.roles.includes(AUTH_ROLES.SUPER_ADMIN))
    ) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      include: {
        billingAddress: true,
        customer: true,
        lineItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found", success: false }, { status: 404 });
    }

    return NextResponse.json({ invoice, success: true });
  } catch (error) {
    console.error("[Get Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch invoice";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await getCurrentSessionUser();
    if (
      !user ||
      (!user.roles.includes(AUTH_ROLES.ADMIN) && !user.roles.includes(AUTH_ROLES.SUPER_ADMIN))
    ) {
      return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      billingAddress,
      customerEmail,
      customerName,
      dueDate,
      invoiceNumber,
      lineItems = [],
      notes = "",
      status,
      taxRate = 0,
    } = body;

    const parsedLineItems = (
      lineItems as Array<{ description: string; quantity: number; unitPrice: number }>
    ).map((item) => ({
      description: item.description || "Logistics Service",
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    }));

    const subtotal = parsedLineItems.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0,
    );
    const taxTotal = subtotal * (Math.max(0, Number(taxRate) || 0) / 100);
    const total = subtotal + taxTotal;

    const rawStatus = status ? String(status).toUpperCase() : undefined;
    let targetStatus: InvoiceStatus | undefined = undefined;
    if (rawStatus === "PAID") targetStatus = InvoiceStatus.PAID;
    else if (rawStatus === "SENT" || rawStatus === "ISSUED") targetStatus = InvoiceStatus.ISSUED;
    else if (rawStatus === "DRAFT") targetStatus = InvoiceStatus.DRAFT;
    else if (rawStatus === "OVERDUE") targetStatus = InvoiceStatus.OVERDUE;
    else if (rawStatus === "CANCELLED" || rawStatus === "VOID") targetStatus = InvoiceStatus.VOID;

    // Delete existing line items and recreate with new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: id },
    });

    const updated = await prisma.invoice.update({
      data: {
        ...(invoiceNumber ? { invoiceNumber: invoiceNumber.trim() } : {}),
        ...(dueDate && !isNaN(new Date(dueDate).getTime())
          ? { dueDate: new Date(dueDate) }
          : {}),
        ...(targetStatus ? { status: targetStatus } : {}),
        ...(targetStatus === InvoiceStatus.PAID ? { amountPaid: total, paidAt: new Date() } : {}),
        ...(targetStatus === InvoiceStatus.ISSUED ? { issuedAt: new Date() } : {}),
        lineItems: {
          create: parsedLineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            sortOrder: index,
            total: item.quantity * item.unitPrice,
            unitPrice: item.unitPrice,
          })),
        },
        metadata: {
          billTo: {
            address: billingAddress || null,
            email: customerEmail ? customerEmail.trim().toLowerCase() : undefined,
            name: customerName || "Customer",
          },
        },
        notes: notes || null,
        subtotal,
        taxTotal,
        total,
      },
      include: {
        lineItems: true,
      },
      where: { id },
    });

    return NextResponse.json({ invoice: updated, success: true });
  } catch (error) {
    console.error("[Update Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update invoice";
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
