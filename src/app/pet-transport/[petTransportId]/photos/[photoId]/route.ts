import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { AUTH_ROLES } from "@/lib/auth/constants";
import { PERMISSIONS, hasPermission } from "@/lib/auth/rbac";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getLocalStoragePath } from "@/lib/storage/local-storage";

export const runtime = "nodejs";

type PetPhotoRouteContext = {
  params: Promise<{
    petTransportId: string;
    photoId: string;
  }>;
};

function canViewPetTransport({
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
    (hasPermission(user, PERMISSIONS.PET_TRANSPORT_MANAGE) ||
      hasPermission(user, PERMISSIONS.PET_TRANSPORT_UPDATE) ||
      hasPermission(user, PERMISSIONS.PET_TRANSPORT_READ) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_MANAGE) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_ASSIGN) ||
      hasPermission(user, PERMISSIONS.SHIPMENTS_UPDATE))
  );
}

export async function GET(_request: Request, { params }: PetPhotoRouteContext) {
  const user = await requirePermission(PERMISSIONS.PET_TRANSPORT_READ);
  const { petTransportId, photoId } = await params;
  const photo = await prisma.petTransportPhoto.findFirst({
    include: {
      petTransport: {
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
      id: photoId,
      petTransportId,
    },
  });

  if (!photo || photo.petTransport.shipment.deletedAt) {
    return NextResponse.json({ message: "Photo not found." }, { status: 404 });
  }

  if (!canViewPetTransport({ ...photo.petTransport.shipment, user })) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const file = await readFile(getLocalStoragePath(photo.storageKey));

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${photo.fileName.replaceAll('"', "")}"`,
        "Content-Type": photo.mimeType,
      },
    });
  } catch {
    return NextResponse.json({ message: "Photo file not found." }, { status: 404 });
  }
}
