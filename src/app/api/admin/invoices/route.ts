import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { AUTH_ROLES } from "@/lib/auth/constants";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([AUTH_ROLES.ADMIN, AUTH_ROLES.SUPER_ADMIN]);
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
      status = "DRAFT",
    } = body;

    if (!invoiceNumber || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Invoice number and customer email are required" },
        { status: 400 },
      );
    }

    // Resolve organization
    let organizationId = user.organizationId;
    if (!organizationId) {
      const org = await prisma.organization.findFirst({ select: { id: true } });
      if (org) {
        organizationId = org.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: "Apex Global Logistics",
            slug: "apex-global-logistics",
          },
        });
        organizationId = newOrg.id;
      }
    }

    // Check if customer exists in DB
    let customerId: string | null = null;
    const existingUser = await prisma.user.findUnique({
      where: { email: customerEmail.trim().toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      customerId = existingUser.id;
    }

    // Calculate totals
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

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        invoiceNumber: invoiceNumber.trim(),
        customerId,
        status: status === "ISSUED" ? "ISSUED" : "DRAFT",
        currency: "USD",
        subtotal,
        taxTotal,
        total,
        dueDate: dueDate ? new Date(dueDate) : null,
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
            total: item.quantity * item.unitPrice,
            sortOrder: index,
          })),
        },
      },
      include: {
        lineItems: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("[Create Invoice API] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create invoice";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
