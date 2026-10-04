-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ratePay" REAL NOT NULL DEFAULT 0.72,
    "ratePay3" REAL NOT NULL DEFAULT 0.65,
    "rateWin" REAL NOT NULL DEFAULT 71,
    "rateWin3" REAL NOT NULL DEFAULT 650,
    "rateWinDaMNMT" REAL NOT NULL DEFAULT 650,
    "rateWinDaMB" REAL NOT NULL DEFAULT 650,
    "role" TEXT NOT NULL DEFAULT 'KHACH',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("createdAt", "id", "isActive", "name", "phone", "ratePay", "ratePay3", "rateWin", "role", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "phone", "ratePay", "ratePay3", "rateWin", "role", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
