import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: { sortOrder: "asc" },
        },
        customer: true,
        billingAddress: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("[Get Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
    const { id } = await params;
    const body = await request.json();

    const {
      invoiceNumber,
      customerName,
      customerEmail,
      billingAddress,
      dueDate,
      lineItems = [],
      taxRate = 0,
      notes = "",
      status,
    } = body;

    const parsedLineItems = (lineItems as Array<{ description: string; quantity: number; unitPrice: number }>).map(
      (item) => ({
        description: item.description || "Logistics Service",
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      }),
    );

    const subtotal = parsedLineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const taxTotal = subtotal * (Math.max(0, Number(taxRate) || 0) / 100);
    const total = subtotal + taxTotal;

    // Delete existing line items and recreate with new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: id },
    });

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(invoiceNumber ? { invoiceNumber: invoiceNumber.trim() } : {}),
        subtotal,
        taxTotal,
        total,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        ...(status ? { status } : {}),
        metadata: {
          billTo: {
            name: customerName || "Customer",
            email: customerEmail ? customerEmail.trim().toLowerCase() : undefined,
            address: billingAddress || null,
          },
        },
        lineItems: {
          create: parsedLineItems.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("[Update Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to update invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
