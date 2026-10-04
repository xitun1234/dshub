-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ratePay" REAL NOT NULL DEFAULT 0.72,
    "rateWin" REAL NOT NULL DEFAULT 71,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "totalInvestment" REAL NOT NULL,
    "totalPrize" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "betNumber" TEXT NOT NULL,
    "betType" TEXT NOT NULL,
    "stationCount" INTEGER NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 18,
    "pricePerUnit" REAL NOT NULL,
    "isWin" BOOLEAN NOT NULL DEFAULT false,
    "winQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillDetail_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LotteryResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drawDate" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "stationCode" TEXT NOT NULL,
    "winningNumbers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "LotteryResult_drawDate_stationCode_key" ON "LotteryResult"("drawDate", "stationCode");
