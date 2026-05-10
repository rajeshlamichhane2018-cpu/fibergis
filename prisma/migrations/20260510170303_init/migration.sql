-- CreateTable
CREATE TABLE "FiberRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "geojson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiberRoute_pkey" PRIMARY KEY ("id")
);
