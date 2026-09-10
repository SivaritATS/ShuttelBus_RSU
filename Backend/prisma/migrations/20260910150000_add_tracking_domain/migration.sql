CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "routeId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gps_tracks" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "tripId" INTEGER,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "speed" DECIMAL(8,2),
    "heading" DECIMAL(6,2),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gps_tracks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tracking_sources" (
    "id" SERIAL NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tracking_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedbacks" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "vehicleId" INTEGER,
    "message" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    "assignedToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_audit_events" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "actorId" INTEGER,
    "eventType" VARCHAR(100) NOT NULL,
    "oldStatus" VARCHAR(50),
    "newStatus" VARCHAR(50),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tracking_sources_identifier_key" ON "tracking_sources"("identifier");
CREATE INDEX "trips_vehicleId_idx" ON "trips"("vehicleId");
CREATE INDEX "trips_routeId_idx" ON "trips"("routeId");
CREATE INDEX "gps_tracks_vehicleId_idx" ON "gps_tracks"("vehicleId");
CREATE INDEX "gps_tracks_tripId_idx" ON "gps_tracks"("tripId");
CREATE INDEX "gps_tracks_recordedAt_idx" ON "gps_tracks"("recordedAt");
CREATE INDEX "tracking_sources_vehicleId_idx" ON "tracking_sources"("vehicleId");
CREATE INDEX "feedbacks_vehicleId_idx" ON "feedbacks"("vehicleId");
CREATE INDEX "feedbacks_assignedToId_idx" ON "feedbacks"("assignedToId");
CREATE INDEX "feedback_audit_events_feedbackId_idx" ON "feedback_audit_events"("feedbackId");
CREATE INDEX "feedback_audit_events_actorId_idx" ON "feedback_audit_events"("actorId");

ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON UPDATE CASCADE;
ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON UPDATE CASCADE;
ALTER TABLE "gps_tracks" ADD CONSTRAINT "gps_tracks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gps_tracks" ADD CONSTRAINT "gps_tracks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tracking_sources" ADD CONSTRAINT "tracking_sources_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedback_audit_events" ADD CONSTRAINT "feedback_audit_events_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feedback_audit_events" ADD CONSTRAINT "feedback_audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
