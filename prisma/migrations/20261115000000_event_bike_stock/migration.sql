-- Phase 5 (COD-123): bikes available to hire per event; null = no limit. Additive.
ALTER TABLE "Event" ADD COLUMN "bikeStock" INTEGER;
