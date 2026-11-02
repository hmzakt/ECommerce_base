-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPMENT_CREATED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RTO_INITIATED', 'RTO_DELIVERED', 'CANCELLED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "breadth" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "height" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "length" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "weight" DECIMAL(10,3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipping_provider" TEXT NOT NULL DEFAULT 'SHIPROCKET',
    "courier_name" TEXT,
    "courier_company_id" INTEGER,
    "external_shipment_id" TEXT,
    "external_order_id" TEXT,
    "awb_code" TEXT,
    "tracking_url" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "weight" DECIMAL(10,3) NOT NULL DEFAULT 0.500,
    "length" DECIMAL(10,2),
    "breadth" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "pickup_location" TEXT,
    "destination_snapshot" JSONB,
    "estimated_delivery" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "label_url" TEXT,
    "manifest_url" TEXT,
    "invoice_url" TEXT,
    "pickup_request_id" TEXT,
    "pickup_scheduled_date" TIMESTAMP(3),
    "selection_strategy" TEXT,
    "selection_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipment_events" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "event_code" TEXT,
    "event_status" TEXT NOT NULL,
    "event_description" TEXT NOT NULL,
    "event_location" TEXT,
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "event_source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "external_event_id" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_providers" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL DEFAULT 'AGGREGATOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "environment" TEXT NOT NULL DEFAULT 'SANDBOX',
    "credentials_cipher" TEXT,
    "config" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_settings" (
    "id" UUID NOT NULL,
    "auto_create_shipment" BOOLEAN NOT NULL DEFAULT true,
    "default_provider_code" TEXT NOT NULL DEFAULT 'SHIPROCKET',
    "allowed_couriers" JSONB,
    "courier_selection_strategy" TEXT NOT NULL DEFAULT 'BALANCED',
    "strategy_weights" JSONB,
    "preferred_courier_id" TEXT,
    "free_shipping_threshold" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "warehouse_address" JSONB NOT NULL,
    "default_package_weight" DECIMAL(10,3) NOT NULL DEFAULT 0.500,
    "default_package_dimensions" JSONB NOT NULL,
    "retry_policy" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shipping_attempts" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "shipment_id" UUID,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "correlation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_code" TEXT,
    "error_message" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "outbox_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL DEFAULT 'ORDER',
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "next_retry_at" TIMESTAMP(3),
    "last_error" TEXT,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_order_id_idx" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_awb_code_idx" ON "shipments"("awb_code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_external_shipment_id_idx" ON "shipments"("external_shipment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_is_active_idx" ON "shipments"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipments_created_at_idx" ON "shipments"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipment_events_shipment_id_idx" ON "shipment_events"("shipment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipment_events_event_timestamp_idx" ON "shipment_events"("event_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "shipment_events_shipment_id_external_event_id_key" ON "shipment_events"("shipment_id", "external_event_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_providers_code_key" ON "shipping_providers"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_providers_code_idx" ON "shipping_providers"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_providers_is_active_idx" ON "shipping_providers"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_attempts_order_id_idx" ON "shipping_attempts"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_attempts_shipment_id_idx" ON "shipping_attempts"("shipment_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_attempts_correlation_id_idx" ON "shipping_attempts"("correlation_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "shipping_attempts_status_idx" ON "shipping_attempts"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "outbox_events_status_next_retry_at_idx" ON "outbox_events"("status", "next_retry_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "outbox_events_aggregate_id_idx" ON "outbox_events"("aggregate_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "outbox_events_created_at_idx" ON "outbox_events"("created_at");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_order_id_fkey') THEN
    ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_events_shipment_id_fkey') THEN
    ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_attempts_order_id_fkey') THEN
    ALTER TABLE "shipping_attempts" ADD CONSTRAINT "shipping_attempts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipping_attempts_shipment_id_fkey') THEN
    ALTER TABLE "shipping_attempts" ADD CONSTRAINT "shipping_attempts_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
