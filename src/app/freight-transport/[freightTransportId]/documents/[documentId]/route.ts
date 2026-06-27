import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getLocalStoragePath } from "@/lib/storage/local-storage";

export const runtime = "nodejs";

type FreightDocumentRouteContext = {
  params: Promise<{
    documentId: string;
    freightTransportId: string;
  }>;
};

function canViewFreightTransport({
  createdById,
  customerId,
  organizationId,
  user,
}: {
  createdById: string | null;
  customerId: string | null;
  organizationId: string;
  user: Awaited<ReturnType<typeof requirePermission>>;
}) {
  if (user.roles.includes(AUTH_ROLES.SUPER_ADMIN)) {
    return true;
  }

  if (createdById === user.id || customerId === user.id) {
    return true;
  }

  return (
    user.organizationId === organizationId &&
    (hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_MANAGE) ||
      hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_UPDATE) ||
      hasPermission(user, PERMISSIONS.FREIGHT_TRANSPORT_READ) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE))
  );
}

export async function GET(_request: Request, { params }: FreightDocumentRouteContext) {
  const user = await requirePermission(PERMISSIONS.FREIGHT_TRANSPORT_READ);
  const { documentId, freightTransportId } = await params;
  const document = await prisma.freightDocument.findFirst({
    include: {
      freightTransport: {
        select: {
          shipment: {
            select: {
              createdById: true,
              customerId: true,
              deletedAt: true,
              organizationId: true,
            },
          },
        },
      },
    },
    where: {
      freightTransportId,
      id: documentId,
    },
  });

  if (!document || document.freightTransport.shipment.deletedAt) {
    return NextResponse.json({ message: "Document not found." }, { status: 404 });
  }

  if (!canViewFreightTransport({ ...document.freightTransport.shipment, user })) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const file = await readFile(getLocalStoragePath(document.storageKey));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${document.fileName.replaceAll('"', "")}"`,
        "Content-Type": document.mimeType,
      },
    });
  } catch {
    return NextResponse.json({ message: "Document file not found." }, { status: 404 });
  }
}
