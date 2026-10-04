-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bill_date_createdAt_idx" ON "Bill"("date", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bill_customerId_idx" ON "Bill"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Bill_status_region_date_idx" ON "Bill"("status", "region", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BillDetail_billId_idx" ON "BillDetail"("billId");
