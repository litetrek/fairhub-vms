-- Run this once in Supabase SQL Editor (Database → SQL Editor → New query).
--
-- This app uses Prisma (server-side, postgres role) for ALL database writes.
-- RLS is redundant here — auth/authorization is enforced at the application
-- layer via Supabase Auth + Prisma + the proxy middleware.
-- Leaving RLS enabled with no policies causes every Prisma write to fail with
-- "new row violates row-level security policy".

ALTER TABLE "User"                     DISABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorProfile"            DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Event"                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE "EventWeek"                DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BoothType"                DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BoothTypeDocRequirement"  DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Application"              DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationWeek"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalLog"              DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Booth"                    DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BoothAddOn"               DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationAddOn"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "BoothAssignment"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice"                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE "InvoiceLineItem"          DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Message"                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"             DISABLE ROW LEVEL SECURITY;
