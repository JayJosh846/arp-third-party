-- CreateTable
CREATE TABLE "Flight" (
    "id" SERIAL NOT NULL,
    "airlineName" TEXT NOT NULL,
    "flightCode" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "departureInfo" TEXT NOT NULL,
    "arrivalDate" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "arrivalInfo" TEXT NOT NULL,
    "postedById" INTEGER NOT NULL,
    "airfare" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "flightEscrow" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Flight_flightCode_key" ON "Flight"("flightCode");
