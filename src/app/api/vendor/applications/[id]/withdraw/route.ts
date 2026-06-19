import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logVendorActivity, getIpFromRequest } from "@/lib/vendor-activity";

const WITHDRAWABLE = ["SUBMITTED", "UNDER_REVIEW", "CONDITIONALLY_APPROVED", "APPROVED"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id }, select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const app = await prisma.application.findFirst({
    where: { id, vendorId: profile.id },
    include: { invoice: { select: { status: true } } },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!WITHDRAWABLE.includes(app.status)) {
    return NextResponse.json(
      { error: "This application cannot be withdrawn" },
      { status: 400 }
    );
  }

  if (app.status === "APPROVED" && app.invoice) {
    const paid = ["PAID", "PARTIALLY_PAID"].includes(app.invoice.status);
    if (paid) {
      return NextResponse.json(
        { error: "Invoice has been paid — please contact the organizer to withdraw" },
        { status: 400 }
      );
    }
  }

  await prisma.application.update({
    where: { id },
    data: { status: "WITHDRAWN" },
  });

  await logVendorActivity({
    vendorId: profile.id,
    action: "APPLICATION_WITHDRAWN",
    applicationId: id,
    detail: `Status was: ${app.status}`,
    ipAddress: getIpFromRequest(request),
  });

  return NextResponse.json({ success: true });
}
