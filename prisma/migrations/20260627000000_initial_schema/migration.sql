-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('MANAGE', 'CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN', 'APPROVE', 'EXPORT');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'WAREHOUSE', 'PICKUP', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'BOOKED', 'PENDING_PICKUP', 'IN_TRANSIT', 'HELD', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ShipmentPriority" AS ENUM ('STANDARD', 'EXPEDITED', 'URGENT');

-- CreateEnum
CREATE TYPE "ShipmentMode" AS ENUM ('ROAD', 'AIR', 'SEA', 'RAIL', 'MULTIMODAL');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('CREATED', 'PICKED_UP', 'CHECKED_IN', 'IN_TRANSIT', 'CUSTOMS_HOLD', 'DELAYED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('BOX', 'PALLET', 'CRATE', 'ENVELOPE', 'CONTAINER', 'OTHER');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('PENDING', 'LOADED', 'IN_TRANSIT', 'DELIVERED', 'DAMAGED', 'LOST', 'RETURNED');

-- CreateEnum
CREATE TYPE "PetSpecies" AS ENUM ('DOG', 'CAT', 'BIRD', 'REPTILE', 'OTHER');

-- CreateEnum
CREATE TYPE "PetTransportStatus" AS ENUM ('REQUESTED', 'DOCUMENTATION_PENDING', 'CLEARED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PetVetCheckStatus" AS ENUM ('SCHEDULED', 'CLEARED', 'MONITORING', 'NOT_CLEARED');

-- CreateEnum
CREATE TYPE "PetCrateStatus" AS ENUM ('ASSIGNED', 'INSPECTED', 'LOADED', 'RELEASED');

-- CreateEnum
CREATE TYPE "PetTravelEventType" AS ENUM ('PROFILE_CREATED', 'DOCUMENT_UPLOADED', 'VACCINATION_RECORDED', 'MEDICAL_CERTIFICATE_RECORDED', 'VET_CHECK_COMPLETED', 'FEEDING_SCHEDULED', 'TEMPERATURE_LOGGED', 'CRATE_ASSIGNED', 'PICKUP', 'IN_TRANSIT', 'ARRIVAL', 'DELIVERED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "FreightType" AS ENUM ('LTL', 'FTL', 'CONTAINER', 'OVERSIZED', 'HAZMAT', 'REFRIGERATED', 'FLATBED', 'OTHER');

-- CreateEnum
CREATE TYPE "FreightTransportStatus" AS ENUM ('REQUESTED', 'PLANNED', 'ASSIGNED', 'LOADING', 'IN_TRANSIT', 'ON_HOLD', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FreightCargoStatus" AS ENUM ('PLANNED', 'LOADED', 'IN_TRANSIT', 'DELIVERED', 'DAMAGED', 'HELD');

-- CreateEnum
CREATE TYPE "FreightContainerStatus" AS ENUM ('ASSIGNED', 'SEALED', 'LOADED', 'IN_TRANSIT', 'DELIVERED', 'RELEASED');

-- CreateEnum
CREATE TYPE "FreightRouteStopType" AS ENUM ('PICKUP', 'WAREHOUSE', 'PORT', 'BORDER', 'CUSTOMS', 'FUEL', 'REST', 'CUSTOMER', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "FreightDocumentType" AS ENUM ('BILL_OF_LADING', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'CUSTOMS_FORM', 'INSURANCE_CERTIFICATE', 'PERMIT', 'PROOF_OF_DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "FreightTrackingEventType" AS ENUM ('BOOKING_CREATED', 'ROUTE_PLANNED', 'CARGO_LOADED', 'DRIVER_ASSIGNED', 'DEPARTED', 'CHECKPOINT_ARRIVED', 'CHECKPOINT_DEPARTED', 'ETA_UPDATED', 'DELAYED', 'DELIVERED', 'EXCEPTION', 'DOCUMENT_UPLOADED');

-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'OFF_DUTY', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'TRUCK', 'TRAILER', 'REFRIGERATED_TRUCK', 'CARGO_BIKE', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'RETIRED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "InvoiceLineType" AS ENUM ('SERVICE', 'SURCHARGE', 'TAX', 'DISCOUNT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'CASH', 'WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailTemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('ADMIN', 'AUTH', 'BILLING', 'FREIGHT', 'INVOICE', 'MANUAL', 'PACKAGE', 'PAYMENT', 'PET', 'SHIPMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('DRAFT', 'QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailProvider" AS ENUM ('BREVO', 'CONSOLE', 'RESEND', 'SMTP');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'PENDING_CUSTOMER', 'PENDING_INTERNAL', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketMessageAuthorType" AS ENUM ('USER', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AiConversationStatus" AS ENUM ('OPEN', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('GLOBAL', 'ORGANIZATION', 'WAREHOUSE', 'USER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'ASSIGN', 'APPROVE', 'REJECT', 'SYSTEM');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "legalName" VARCHAR(200),
    "taxIdentifier" VARCHAR(80),
    "email" VARCHAR(255),
    "phone" VARCHAR(40),
    "website" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "type" "AddressType" NOT NULL DEFAULT 'OTHER',
    "name" VARCHAR(120),
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120),
    "postalCode" VARCHAR(32),
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(40),
    "hashedPassword" VARCHAR(255),
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "emailVerifiedAt" TIMESTAMPTZ(6),
    "passwordChangedAt" TIMESTAMPTZ(6),
    "lastLoginAt" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "familyId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "replacedByTokenId" UUID,
    "createdByIp" VARCHAR(45),
    "revokedByIp" VARCHAR(45),
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdByIp" VARCHAR(45),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdByIp" VARCHAR(45),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "name" VARCHAR(120) NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "scope" "RoleScope" NOT NULL DEFAULT 'ORGANIZATION',
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" VARCHAR(160) NOT NULL,
    "resource" VARCHAR(120) NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "organizationId" UUID,
    "warehouseId" UUID,
    "assignedById" UUID,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "addressId" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'UTC',
    "phone" VARCHAR(40),
    "email" VARCHAR(255),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID,
    "homeWarehouseId" UUID,
    "employeeNumber" VARCHAR(80) NOT NULL,
    "licenseNumber" VARCHAR(120) NOT NULL,
    "licenseExpiresAt" DATE,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "currentWarehouseId" UUID,
    "registrationNumber" VARCHAR(80) NOT NULL,
    "vin" VARCHAR(80),
    "type" "VehicleType" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "capacityKg" DECIMAL(12,3),
    "capacityVolumeCbm" DECIMAL(12,3),
    "mileageKm" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverVehicleAssignment" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "assignedById" UUID,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "DriverVehicleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "shipmentNumber" VARCHAR(80) NOT NULL,
    "customerId" UUID,
    "createdById" UUID,
    "assignedDriverId" UUID,
    "vehicleId" UUID,
    "originAddressId" UUID NOT NULL,
    "destinationAddressId" UUID NOT NULL,
    "originWarehouseId" UUID,
    "destinationWarehouseId" UUID,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "ShipmentPriority" NOT NULL DEFAULT 'STANDARD',
    "mode" "ShipmentMode" NOT NULL DEFAULT 'ROAD',
    "serviceLevel" VARCHAR(80),
    "referenceNumber" VARCHAR(120),
    "pickupWindowStart" TIMESTAMPTZ(6),
    "pickupWindowEnd" TIMESTAMPTZ(6),
    "deliveryWindowStart" TIMESTAMPTZ(6),
    "deliveryWindowEnd" TIMESTAMPTZ(6),
    "bookedAt" TIMESTAMPTZ(6),
    "dispatchedAt" TIMESTAMPTZ(6),
    "deliveredAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentPackage" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "packageNumber" VARCHAR(80) NOT NULL,
    "type" "PackageType" NOT NULL DEFAULT 'BOX',
    "status" "PackageStatus" NOT NULL DEFAULT 'PENDING',
    "barcode" VARCHAR(120),
    "weightKg" DECIMAL(12,3),
    "lengthCm" DECIMAL(12,3),
    "widthCm" DECIMAL(12,3),
    "heightCm" DECIMAL(12,3),
    "declaredValue" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "fragile" BOOLEAN NOT NULL DEFAULT false,
    "hazardous" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShipmentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentDocument" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "uploadedById" UUID,
    "documentType" VARCHAR(80) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(128),
    "notes" TEXT,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShipmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentPackagePhoto" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "uploadedById" UUID,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(128),
    "caption" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentPackagePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingEvent" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "packageId" UUID,
    "warehouseId" UUID,
    "driverId" UUID,
    "vehicleId" UUID,
    "locationAddressId" UUID,
    "recordedById" UUID,
    "eventType" "TrackingEventType" NOT NULL,
    "shipmentStatus" "ShipmentStatus",
    "message" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetTransport" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "species" "PetSpecies" NOT NULL,
    "breed" VARCHAR(120),
    "petName" VARCHAR(120),
    "dateOfBirth" DATE,
    "ageMonths" INTEGER,
    "weightKg" DECIMAL(10,3),
    "sex" VARCHAR(40),
    "color" VARCHAR(80),
    "ownerName" VARCHAR(160),
    "ownerEmail" VARCHAR(255),
    "ownerPhone" VARCHAR(40),
    "crateRequired" BOOLEAN NOT NULL DEFAULT true,
    "crateLengthCm" DECIMAL(10,3),
    "crateWidthCm" DECIMAL(10,3),
    "crateHeightCm" DECIMAL(10,3),
    "healthCertificateNumber" VARCHAR(120),
    "vaccinationVerified" BOOLEAN NOT NULL DEFAULT false,
    "microchipNumber" VARCHAR(120),
    "knownAllergies" TEXT,
    "medicationInstructions" TEXT,
    "feedingInstructions" TEXT,
    "handlerInstructions" TEXT,
    "status" "PetTransportStatus" NOT NULL DEFAULT 'REQUESTED',
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetVaccinationRecord" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "uploadedById" UUID,
    "vaccineName" VARCHAR(160) NOT NULL,
    "manufacturer" VARCHAR(160),
    "administeredAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "veterinarianName" VARCHAR(160),
    "clinicName" VARCHAR(160),
    "certificateNumber" VARCHAR(120),
    "fileName" VARCHAR(255),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" INTEGER,
    "storageKey" VARCHAR(500),
    "checksum" VARCHAR(128),
    "verifiedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetVaccinationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetMedicalCertificate" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "uploadedById" UUID,
    "certificateNumber" VARCHAR(120) NOT NULL,
    "issuedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "veterinarianName" VARCHAR(160),
    "clinicName" VARCHAR(160),
    "fitToTravel" BOOLEAN NOT NULL DEFAULT false,
    "fileName" VARCHAR(255),
    "mimeType" VARCHAR(120),
    "fileSizeBytes" INTEGER,
    "storageKey" VARCHAR(500),
    "checksum" VARCHAR(128),
    "verifiedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetMedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetVeterinarianCheck" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "recordedById" UUID,
    "status" "PetVetCheckStatus" NOT NULL DEFAULT 'SCHEDULED',
    "checkedAt" TIMESTAMPTZ(6) NOT NULL,
    "veterinarianName" VARCHAR(160) NOT NULL,
    "clinicName" VARCHAR(160),
    "temperatureC" DECIMAL(6,2),
    "heartRateBpm" INTEGER,
    "respirationBpm" INTEGER,
    "nextCheckAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetVeterinarianCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetFeedingSchedule" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "createdById" UUID,
    "foodType" VARCHAR(160) NOT NULL,
    "portion" VARCHAR(120) NOT NULL,
    "frequencyHours" INTEGER NOT NULL,
    "nextFeedingAt" TIMESTAMPTZ(6),
    "lastFedAt" TIMESTAMPTZ(6),
    "waterNotes" TEXT,
    "instructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetFeedingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetTemperatureLog" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "recordedById" UUID,
    "recordedAt" TIMESTAMPTZ(6) NOT NULL,
    "temperatureC" DECIMAL(6,2) NOT NULL,
    "humidityPercent" DECIMAL(6,2),
    "crateSensorId" VARCHAR(120),
    "location" VARCHAR(160),
    "alertTriggered" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetTemperatureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetCrateAssignment" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "assignedById" UUID,
    "crateCode" VARCHAR(120) NOT NULL,
    "crateType" VARCHAR(120),
    "status" "PetCrateStatus" NOT NULL DEFAULT 'ASSIGNED',
    "lengthCm" DECIMAL(10,3),
    "widthCm" DECIMAL(10,3),
    "heightCm" DECIMAL(10,3),
    "maxPetWeightKg" DECIMAL(10,3),
    "sealNumber" VARCHAR(120),
    "ventilationChecked" BOOLEAN NOT NULL DEFAULT false,
    "waterBowlAttached" BOOLEAN NOT NULL DEFAULT false,
    "absorbentLining" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL,
    "inspectedAt" TIMESTAMPTZ(6),
    "loadedAt" TIMESTAMPTZ(6),
    "releasedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PetCrateAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetTransportPhoto" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "uploadedById" UUID,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(128),
    "caption" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetTransportPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetTravelHistory" (
    "id" UUID NOT NULL,
    "petTransportId" UUID NOT NULL,
    "recordedById" UUID,
    "trackingEventId" UUID,
    "eventType" "PetTravelEventType" NOT NULL,
    "message" TEXT,
    "location" VARCHAR(160),
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetTravelHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightTransport" (
    "id" UUID NOT NULL,
    "shipmentId" UUID NOT NULL,
    "freightType" "FreightType" NOT NULL,
    "status" "FreightTransportStatus" NOT NULL DEFAULT 'REQUESTED',
    "commodityCode" VARCHAR(80),
    "commodityDescription" TEXT,
    "containerNumber" VARCHAR(80),
    "sealNumber" VARCHAR(80),
    "incoterm" VARCHAR(16),
    "palletCount" INTEGER,
    "grossWeightKg" DECIMAL(14,3),
    "volumeCbm" DECIMAL(14,3),
    "refrigeratedRequired" BOOLEAN NOT NULL DEFAULT false,
    "temperatureMinC" DECIMAL(6,2),
    "temperatureMaxC" DECIMAL(6,2),
    "hazmatClass" VARCHAR(40),
    "unNumber" VARCHAR(40),
    "routeName" VARCHAR(160),
    "routeCode" VARCHAR(80),
    "originTerminal" VARCHAR(160),
    "destinationTerminal" VARCHAR(160),
    "plannedDepartureAt" TIMESTAMPTZ(6),
    "plannedArrivalAt" TIMESTAMPTZ(6),
    "etaAt" TIMESTAMPTZ(6),
    "actualDepartureAt" TIMESTAMPTZ(6),
    "actualArrivalAt" TIMESTAMPTZ(6),
    "distanceKm" DECIMAL(12,3),
    "estimatedDurationHours" INTEGER,
    "averageSpeedKph" DECIMAL(8,2),
    "specialInstructions" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightCargoItem" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "containerId" UUID,
    "description" VARCHAR(255) NOT NULL,
    "cargoType" VARCHAR(120),
    "commodityCode" VARCHAR(80),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" VARCHAR(40) NOT NULL DEFAULT 'pieces',
    "weightKg" DECIMAL(14,3),
    "volumeCbm" DECIMAL(14,3),
    "lengthCm" DECIMAL(12,3),
    "widthCm" DECIMAL(12,3),
    "heightCm" DECIMAL(12,3),
    "declaredValue" DECIMAL(14,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "hazardous" BOOLEAN NOT NULL DEFAULT false,
    "stackable" BOOLEAN NOT NULL DEFAULT true,
    "temperatureControlled" BOOLEAN NOT NULL DEFAULT false,
    "temperatureMinC" DECIMAL(6,2),
    "temperatureMaxC" DECIMAL(6,2),
    "status" "FreightCargoStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightCargoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightContainer" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "containerNumber" VARCHAR(80) NOT NULL,
    "containerType" VARCHAR(80),
    "sealNumber" VARCHAR(80),
    "status" "FreightContainerStatus" NOT NULL DEFAULT 'ASSIGNED',
    "tareWeightKg" DECIMAL(12,3),
    "maxGrossWeightKg" DECIMAL(12,3),
    "currentWeightKg" DECIMAL(12,3),
    "volumeCbm" DECIMAL(12,3),
    "temperatureSetC" DECIMAL(6,2),
    "loadedAt" TIMESTAMPTZ(6),
    "releasedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightMachineryItem" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "category" VARCHAR(120),
    "manufacturer" VARCHAR(120),
    "model" VARCHAR(120),
    "serialNumber" VARCHAR(120),
    "operatingWeightKg" DECIMAL(14,3),
    "lengthCm" DECIMAL(12,3),
    "widthCm" DECIMAL(12,3),
    "heightCm" DECIMAL(12,3),
    "condition" VARCHAR(120),
    "oversizePermitRequired" BOOLEAN NOT NULL DEFAULT false,
    "loadingInstructions" TEXT,
    "status" "FreightCargoStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightMachineryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightVehicleItem" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "vin" VARCHAR(80),
    "make" VARCHAR(120) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "year" INTEGER,
    "color" VARCHAR(80),
    "plateNumber" VARCHAR(80),
    "condition" VARCHAR(120),
    "odometerKm" INTEGER,
    "operable" BOOLEAN NOT NULL DEFAULT true,
    "keysAvailable" BOOLEAN NOT NULL DEFAULT true,
    "status" "FreightCargoStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightVehicleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightRouteStop" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "stopType" "FreightRouteStopType" NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "addressLine1" VARCHAR(255),
    "city" VARCHAR(120),
    "countryCode" CHAR(2),
    "plannedArrivalAt" TIMESTAMPTZ(6),
    "plannedDepartureAt" TIMESTAMPTZ(6),
    "actualArrivalAt" TIMESTAMPTZ(6),
    "actualDepartureAt" TIMESTAMPTZ(6),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "contactName" VARCHAR(160),
    "contactPhone" VARCHAR(40),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightRouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightDocument" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "uploadedById" UUID,
    "documentType" "FreightDocumentType" NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "checksum" VARCHAR(128),
    "expiresAt" TIMESTAMPTZ(6),
    "verifiedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FreightDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreightTrackingEvent" (
    "id" UUID NOT NULL,
    "freightTransportId" UUID NOT NULL,
    "recordedById" UUID,
    "trackingEventId" UUID,
    "eventType" "FreightTrackingEventType" NOT NULL,
    "status" "FreightTransportStatus",
    "message" TEXT,
    "location" VARCHAR(160),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "etaAt" TIMESTAMPTZ(6),
    "occurredAt" TIMESTAMPTZ(6) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreightTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "invoiceNumber" VARCHAR(80) NOT NULL,
    "shipmentId" UUID,
    "customerId" UUID,
    "billingAddressId" UUID,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "amountPaid" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "dueDate" DATE,
    "issuedAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "voidedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "lineType" "InvoiceLineType" NOT NULL DEFAULT 'SERVICE',
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "taxRate" DECIMAL(6,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "reference" VARCHAR(160),
    "paidAt" TIMESTAMPTZ(6),
    "failedAt" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" UUID,
    "shipmentId" UUID,
    "invoiceId" UUID,
    "emailTemplateId" UUID,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT,
    "actionUrl" VARCHAR(500),
    "providerMessageId" VARCHAR(180),
    "scheduledAt" TIMESTAMPTZ(6),
    "sentAt" TIMESTAMPTZ(6),
    "readAt" TIMESTAMPTZ(6),
    "failedAt" TIMESTAMPTZ(6),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "key" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140),
    "name" VARCHAR(160) NOT NULL,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'SYSTEM',
    "subject" VARCHAR(255) NOT NULL,
    "preheader" VARCHAR(255),
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "locale" VARCHAR(16) NOT NULL DEFAULT 'en',
    "version" INTEGER NOT NULL DEFAULT 1,
    "variables" JSONB,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "templateId" UUID,
    "sentById" UUID,
    "relatedUserId" UUID,
    "shipmentId" UUID,
    "recipientEmail" VARCHAR(255) NOT NULL,
    "recipientName" VARCHAR(160),
    "subject" VARCHAR(255) NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'MANUAL',
    "status" "EmailLogStatus" NOT NULL DEFAULT 'DRAFT',
    "provider" "EmailProvider" NOT NULL DEFAULT 'CONSOLE',
    "providerMessageId" VARCHAR(180),
    "providerResponse" JSONB,
    "trackingNumber" VARCHAR(120),
    "queuedAt" TIMESTAMPTZ(6),
    "sentAt" TIMESTAMPTZ(6),
    "failedAt" TIMESTAMPTZ(6),
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "actorId" UUID,
    "action" "ActivityAction" NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(120),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "ticketNumber" VARCHAR(80) NOT NULL,
    "requesterId" UUID,
    "assignedToId" UUID,
    "shipmentId" UUID,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(6),
    "closedAt" TIMESTAMPTZ(6),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorId" UUID,
    "authorType" "TicketMessageAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConversation" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "userId" UUID,
    "shipmentId" UUID,
    "title" VARCHAR(200),
    "status" "AiConversationStatus" NOT NULL DEFAULT 'OPEN',
    "modelName" VARCHAR(120),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "AiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "toolName" VARCHAR(120),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "warehouseId" UUID,
    "userId" UUID,
    "updatedById" UUID,
    "scope" "SettingScope" NOT NULL,
    "key" VARCHAR(160) NOT NULL,
    "value" JSONB NOT NULL,
    "valueType" VARCHAR(40) NOT NULL DEFAULT 'json',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "actorId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(120),
    "before" JSONB,
    "after" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "correlationId" VARCHAR(120),
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "idx_organizations_status_created_at" ON "Organization"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_organizations_deleted_at" ON "Organization"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_addresses_organization_type" ON "Address"("organizationId", "type");

-- CreateIndex
CREATE INDEX "idx_addresses_country_city" ON "Address"("countryCode", "city");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_users_organization_status" ON "User"("organizationId", "status");

-- CreateIndex
CREATE INDEX "idx_users_email_verified_at" ON "User"("emailVerifiedAt");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user_expires_at" ON "RefreshToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_family_revoked_at" ON "RefreshToken"("familyId", "revokedAt");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_revoked_expires_at" ON "RefreshToken"("revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_expires_at" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_used_expires_at" ON "PasswordResetToken"("usedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_user_expires_at" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_email_verification_tokens_used_expires_at" ON "EmailVerificationToken"("usedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_roles_scope" ON "Role"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "uq_roles_organization_key" ON "Role"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "idx_permissions_resource_action" ON "Permission"("resource", "action");

-- CreateIndex
CREATE INDEX "idx_role_permissions_permission_id" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "idx_user_roles_role_id" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "idx_user_roles_scope_lookup" ON "UserRole"("organizationId", "warehouseId");

-- CreateIndex
CREATE INDEX "idx_user_roles_expires_at" ON "UserRole"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_roles_scope" ON "UserRole"("userId", "roleId", "organizationId", "warehouseId");

-- CreateIndex
CREATE INDEX "idx_warehouses_organization_status" ON "Warehouse"("organizationId", "status");

-- CreateIndex
CREATE INDEX "idx_warehouses_deleted_at" ON "Warehouse"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_warehouses_organization_code" ON "Warehouse"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_licenseNumber_key" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "idx_drivers_organization_status" ON "Driver"("organizationId", "status");

-- CreateIndex
CREATE INDEX "idx_drivers_home_warehouse_status" ON "Driver"("homeWarehouseId", "status");

-- CreateIndex
CREATE INDEX "idx_drivers_deleted_at" ON "Driver"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_drivers_organization_employee_number" ON "Driver"("organizationId", "employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "idx_vehicles_organization_status" ON "Vehicle"("organizationId", "status");

-- CreateIndex
CREATE INDEX "idx_vehicles_current_warehouse_status" ON "Vehicle"("currentWarehouseId", "status");

-- CreateIndex
CREATE INDEX "idx_vehicles_deleted_at" ON "Vehicle"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_driver_vehicle_assignments_driver_active" ON "DriverVehicleAssignment"("driverId", "releasedAt");

-- CreateIndex
CREATE INDEX "idx_driver_vehicle_assignments_vehicle_active" ON "DriverVehicleAssignment"("vehicleId", "releasedAt");

-- CreateIndex
CREATE INDEX "idx_shipments_organization_status_created_at" ON "Shipment"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_shipments_assigned_driver_status" ON "Shipment"("assignedDriverId", "status");

-- CreateIndex
CREATE INDEX "idx_shipments_vehicle_status" ON "Shipment"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "idx_shipments_origin_warehouse_status" ON "Shipment"("originWarehouseId", "status");

-- CreateIndex
CREATE INDEX "idx_shipments_destination_warehouse_status" ON "Shipment"("destinationWarehouseId", "status");

-- CreateIndex
CREATE INDEX "idx_shipments_delivery_window_start" ON "Shipment"("deliveryWindowStart");

-- CreateIndex
CREATE INDEX "idx_shipments_deleted_at" ON "Shipment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shipments_organization_number" ON "Shipment"("organizationId", "shipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentPackage_barcode_key" ON "ShipmentPackage"("barcode");

-- CreateIndex
CREATE INDEX "idx_shipment_packages_shipment_status" ON "ShipmentPackage"("shipmentId", "status");

-- CreateIndex
CREATE INDEX "idx_shipment_packages_status" ON "ShipmentPackage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_shipment_packages_shipment_package_number" ON "ShipmentPackage"("shipmentId", "packageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentDocument_storageKey_key" ON "ShipmentDocument"("storageKey");

-- CreateIndex
CREATE INDEX "idx_shipment_documents_shipment_created_at" ON "ShipmentDocument"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_shipment_documents_uploader_created_at" ON "ShipmentDocument"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_shipment_documents_type" ON "ShipmentDocument"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentPackagePhoto_storageKey_key" ON "ShipmentPackagePhoto"("storageKey");

-- CreateIndex
CREATE INDEX "idx_shipment_package_photos_package_created_at" ON "ShipmentPackagePhoto"("packageId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_shipment_package_photos_uploader_created_at" ON "ShipmentPackagePhoto"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_tracking_events_shipment_occurred_at" ON "TrackingEvent"("shipmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_tracking_events_package_occurred_at" ON "TrackingEvent"("packageId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_tracking_events_type_occurred_at" ON "TrackingEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_tracking_events_warehouse_occurred_at" ON "TrackingEvent"("warehouseId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_tracking_events_driver_occurred_at" ON "TrackingEvent"("driverId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetTransport_shipmentId_key" ON "PetTransport"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_pet_transports_status" ON "PetTransport"("status");

-- CreateIndex
CREATE INDEX "idx_pet_transports_species" ON "PetTransport"("species");

-- CreateIndex
CREATE INDEX "idx_pet_transports_microchip_number" ON "PetTransport"("microchipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PetVaccinationRecord_storageKey_key" ON "PetVaccinationRecord"("storageKey");

-- CreateIndex
CREATE INDEX "idx_pet_vaccination_records_transport_expires_at" ON "PetVaccinationRecord"("petTransportId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_pet_vaccination_records_uploader_created_at" ON "PetVaccinationRecord"("uploadedById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetMedicalCertificate_storageKey_key" ON "PetMedicalCertificate"("storageKey");

-- CreateIndex
CREATE INDEX "idx_pet_medical_certificates_transport_expires_at" ON "PetMedicalCertificate"("petTransportId", "expiresAt");

-- CreateIndex
CREATE INDEX "idx_pet_medical_certificates_uploader_created_at" ON "PetMedicalCertificate"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_pet_veterinarian_checks_transport_checked_at" ON "PetVeterinarianCheck"("petTransportId", "checkedAt");

-- CreateIndex
CREATE INDEX "idx_pet_veterinarian_checks_recorder_checked_at" ON "PetVeterinarianCheck"("recordedById", "checkedAt");

-- CreateIndex
CREATE INDEX "idx_pet_feeding_schedules_transport_active" ON "PetFeedingSchedule"("petTransportId", "active");

-- CreateIndex
CREATE INDEX "idx_pet_feeding_schedules_creator_created_at" ON "PetFeedingSchedule"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_pet_temperature_logs_transport_recorded_at" ON "PetTemperatureLog"("petTransportId", "recordedAt");

-- CreateIndex
CREATE INDEX "idx_pet_temperature_logs_alert_recorded_at" ON "PetTemperatureLog"("alertTriggered", "recordedAt");

-- CreateIndex
CREATE INDEX "idx_pet_crate_assignments_transport_assigned_at" ON "PetCrateAssignment"("petTransportId", "assignedAt");

-- CreateIndex
CREATE INDEX "idx_pet_crate_assignments_crate_code" ON "PetCrateAssignment"("crateCode");

-- CreateIndex
CREATE INDEX "idx_pet_crate_assignments_status_assigned_at" ON "PetCrateAssignment"("status", "assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetTransportPhoto_storageKey_key" ON "PetTransportPhoto"("storageKey");

-- CreateIndex
CREATE INDEX "idx_pet_transport_photos_transport_created_at" ON "PetTransportPhoto"("petTransportId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_pet_transport_photos_uploader_created_at" ON "PetTransportPhoto"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_pet_travel_history_transport_occurred_at" ON "PetTravelHistory"("petTransportId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_pet_travel_history_event_occurred_at" ON "PetTravelHistory"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_pet_travel_history_tracking_event" ON "PetTravelHistory"("trackingEventId");

-- CreateIndex
CREATE UNIQUE INDEX "FreightTransport_shipmentId_key" ON "FreightTransport"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_freight_transports_type_status" ON "FreightTransport"("freightType", "status");

-- CreateIndex
CREATE INDEX "idx_freight_transports_status_eta_at" ON "FreightTransport"("status", "etaAt");

-- CreateIndex
CREATE INDEX "idx_freight_transports_container_number" ON "FreightTransport"("containerNumber");

-- CreateIndex
CREATE INDEX "idx_freight_transports_route_code" ON "FreightTransport"("routeCode");

-- CreateIndex
CREATE INDEX "idx_freight_cargo_items_transport_status" ON "FreightCargoItem"("freightTransportId", "status");

-- CreateIndex
CREATE INDEX "idx_freight_cargo_items_container_id" ON "FreightCargoItem"("containerId");

-- CreateIndex
CREATE INDEX "idx_freight_cargo_items_hazardous_status" ON "FreightCargoItem"("hazardous", "status");

-- CreateIndex
CREATE INDEX "idx_freight_containers_transport_status" ON "FreightContainer"("freightTransportId", "status");

-- CreateIndex
CREATE INDEX "idx_freight_containers_seal_number" ON "FreightContainer"("sealNumber");

-- CreateIndex
CREATE UNIQUE INDEX "uq_freight_containers_transport_number" ON "FreightContainer"("freightTransportId", "containerNumber");

-- CreateIndex
CREATE INDEX "idx_freight_machinery_transport_status" ON "FreightMachineryItem"("freightTransportId", "status");

-- CreateIndex
CREATE INDEX "idx_freight_machinery_serial_number" ON "FreightMachineryItem"("serialNumber");

-- CreateIndex
CREATE INDEX "idx_freight_machinery_oversize_status" ON "FreightMachineryItem"("oversizePermitRequired", "status");

-- CreateIndex
CREATE INDEX "idx_freight_vehicle_items_transport_status" ON "FreightVehicleItem"("freightTransportId", "status");

-- CreateIndex
CREATE INDEX "idx_freight_vehicle_items_plate_number" ON "FreightVehicleItem"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "uq_freight_vehicle_items_transport_vin" ON "FreightVehicleItem"("freightTransportId", "vin");

-- CreateIndex
CREATE INDEX "idx_freight_route_stops_transport_type_sequence" ON "FreightRouteStop"("freightTransportId", "stopType", "sequence");

-- CreateIndex
CREATE INDEX "idx_freight_route_stops_planned_arrival" ON "FreightRouteStop"("plannedArrivalAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_freight_route_stops_transport_sequence" ON "FreightRouteStop"("freightTransportId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "FreightDocument_storageKey_key" ON "FreightDocument"("storageKey");

-- CreateIndex
CREATE INDEX "idx_freight_documents_transport_created_at" ON "FreightDocument"("freightTransportId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_freight_documents_type" ON "FreightDocument"("documentType");

-- CreateIndex
CREATE INDEX "idx_freight_documents_uploader_created_at" ON "FreightDocument"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_freight_tracking_events_transport_occurred_at" ON "FreightTrackingEvent"("freightTransportId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_freight_tracking_events_type_occurred_at" ON "FreightTrackingEvent"("eventType", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_freight_tracking_events_tracking_event" ON "FreightTrackingEvent"("trackingEventId");

-- CreateIndex
CREATE INDEX "idx_invoices_organization_status_due_date" ON "Invoice"("organizationId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "idx_invoices_customer_status" ON "Invoice"("customerId", "status");

-- CreateIndex
CREATE INDEX "idx_invoices_shipment_id" ON "Invoice"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_invoices_deleted_at" ON "Invoice"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_invoices_organization_number" ON "Invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "idx_invoice_line_items_invoice_sort_order" ON "InvoiceLineItem"("invoiceId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "idx_payments_invoice_status" ON "Payment"("invoiceId", "status");

-- CreateIndex
CREATE INDEX "idx_payments_status_created_at" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_status_created_at" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read_created_at" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_user_channel_created_at" ON "Notification"("userId", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_organization_status_created_at" ON "Notification"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_notifications_channel_status_scheduled_at" ON "Notification"("channel", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "idx_notifications_shipment_id" ON "Notification"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_notifications_invoice_id" ON "Notification"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_email_templates_category_active" ON "EmailTemplate"("category", "isActive");

-- CreateIndex
CREATE INDEX "idx_email_templates_organization_status" ON "EmailTemplate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "idx_email_templates_deleted_at" ON "EmailTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_email_templates_organization_key_locale_version" ON "EmailTemplate"("organizationId", "key", "locale", "version");

-- CreateIndex
CREATE UNIQUE INDEX "uq_email_templates_organization_slug_locale_version" ON "EmailTemplate"("organizationId", "slug", "locale", "version");

-- CreateIndex
CREATE INDEX "idx_email_logs_organization_status_created_at" ON "EmailLog"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "idx_email_logs_recipient_created_at" ON "EmailLog"("recipientEmail", "createdAt");

-- CreateIndex
CREATE INDEX "idx_email_logs_sender_created_at" ON "EmailLog"("sentById", "createdAt");

-- CreateIndex
CREATE INDEX "idx_email_logs_related_user_created_at" ON "EmailLog"("relatedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_email_logs_shipment_created_at" ON "EmailLog"("shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_email_logs_template_id" ON "EmailLog"("templateId");

-- CreateIndex
CREATE INDEX "idx_activity_logs_organization_occurred_at" ON "ActivityLog"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_activity_logs_actor_occurred_at" ON "ActivityLog"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_activity_logs_entity" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_support_tickets_organization_status_priority" ON "SupportTicket"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "idx_support_tickets_assignee_status" ON "SupportTicket"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "idx_support_tickets_shipment_id" ON "SupportTicket"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_support_tickets_organization_number" ON "SupportTicket"("organizationId", "ticketNumber");

-- CreateIndex
CREATE INDEX "idx_support_ticket_messages_ticket_created_at" ON "SupportTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_ai_conversations_organization_status_updated_at" ON "AiConversation"("organizationId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "idx_ai_conversations_user_updated_at" ON "AiConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "idx_ai_conversations_shipment_id" ON "AiConversation"("shipmentId");

-- CreateIndex
CREATE INDEX "idx_ai_conversations_deleted_at" ON "AiConversation"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_ai_messages_conversation_created_at" ON "AiMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_ai_messages_role" ON "AiMessage"("role");

-- CreateIndex
CREATE INDEX "idx_settings_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "idx_settings_organization_scope" ON "Setting"("organizationId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "uq_settings_scope_owner_key" ON "Setting"("scope", "organizationId", "warehouseId", "userId", "key");

-- CreateIndex
CREATE INDEX "idx_audit_logs_organization_occurred_at" ON "AuditLog"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_audit_logs_actor_occurred_at" ON "AuditLog"("actorId", "occurredAt");

-- CreateIndex
CREATE INDEX "idx_audit_logs_entity" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_audit_logs_correlation_id" ON "AuditLog"("correlationId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "RefreshToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_homeWarehouseId_fkey" FOREIGN KEY ("homeWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_currentWarehouseId_fkey" FOREIGN KEY ("currentWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVehicleAssignment" ADD CONSTRAINT "DriverVehicleAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationAddressId_fkey" FOREIGN KEY ("destinationAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationWarehouseId_fkey" FOREIGN KEY ("destinationWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_originAddressId_fkey" FOREIGN KEY ("originAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_originWarehouseId_fkey" FOREIGN KEY ("originWarehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPackage" ADD CONSTRAINT "ShipmentPackage_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentDocument" ADD CONSTRAINT "ShipmentDocument_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentDocument" ADD CONSTRAINT "ShipmentDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPackagePhoto" ADD CONSTRAINT "ShipmentPackagePhoto_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ShipmentPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPackagePhoto" ADD CONSTRAINT "ShipmentPackagePhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_locationAddressId_fkey" FOREIGN KEY ("locationAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ShipmentPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingEvent" ADD CONSTRAINT "TrackingEvent_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTransport" ADD CONSTRAINT "PetTransport_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetVaccinationRecord" ADD CONSTRAINT "PetVaccinationRecord_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetVaccinationRecord" ADD CONSTRAINT "PetVaccinationRecord_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetMedicalCertificate" ADD CONSTRAINT "PetMedicalCertificate_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetMedicalCertificate" ADD CONSTRAINT "PetMedicalCertificate_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetVeterinarianCheck" ADD CONSTRAINT "PetVeterinarianCheck_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetVeterinarianCheck" ADD CONSTRAINT "PetVeterinarianCheck_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetFeedingSchedule" ADD CONSTRAINT "PetFeedingSchedule_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetFeedingSchedule" ADD CONSTRAINT "PetFeedingSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTemperatureLog" ADD CONSTRAINT "PetTemperatureLog_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTemperatureLog" ADD CONSTRAINT "PetTemperatureLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetCrateAssignment" ADD CONSTRAINT "PetCrateAssignment_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetCrateAssignment" ADD CONSTRAINT "PetCrateAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTransportPhoto" ADD CONSTRAINT "PetTransportPhoto_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTransportPhoto" ADD CONSTRAINT "PetTransportPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTravelHistory" ADD CONSTRAINT "PetTravelHistory_petTransportId_fkey" FOREIGN KEY ("petTransportId") REFERENCES "PetTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTravelHistory" ADD CONSTRAINT "PetTravelHistory_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetTravelHistory" ADD CONSTRAINT "PetTravelHistory_trackingEventId_fkey" FOREIGN KEY ("trackingEventId") REFERENCES "TrackingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightTransport" ADD CONSTRAINT "FreightTransport_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightCargoItem" ADD CONSTRAINT "FreightCargoItem_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "FreightContainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightCargoItem" ADD CONSTRAINT "FreightCargoItem_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightContainer" ADD CONSTRAINT "FreightContainer_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightMachineryItem" ADD CONSTRAINT "FreightMachineryItem_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightVehicleItem" ADD CONSTRAINT "FreightVehicleItem_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightRouteStop" ADD CONSTRAINT "FreightRouteStop_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightDocument" ADD CONSTRAINT "FreightDocument_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightDocument" ADD CONSTRAINT "FreightDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightTrackingEvent" ADD CONSTRAINT "FreightTrackingEvent_freightTransportId_fkey" FOREIGN KEY ("freightTransportId") REFERENCES "FreightTransport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightTrackingEvent" ADD CONSTRAINT "FreightTrackingEvent_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreightTrackingEvent" ADD CONSTRAINT "FreightTrackingEvent_trackingEventId_fkey" FOREIGN KEY ("trackingEventId") REFERENCES "TrackingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
