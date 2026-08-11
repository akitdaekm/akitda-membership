-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "companyType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT,
    "pincode" TEXT,
    "primaryMobile" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "gstFile" TEXT,
    "photoFile" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "membershipId" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "memberId" TEXT NOT NULL,
    CONSTRAINT "Partner_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "paymentDate" DATETIME,
    "receiptUrl" TEXT,
    "memberId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_primaryMobile_key" ON "Member"("primaryMobile");

-- CreateIndex
CREATE UNIQUE INDEX "Member_primaryEmail_key" ON "Member"("primaryEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Member_gstNumber_key" ON "Member"("gstNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_membershipId_key" ON "Member"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
