import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logVendorActivity, getIpFromRequest } from "@/lib/vendor-activity";

export async function DELETE(
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
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (app.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT applications can be deleted" },
      { status: 400 }
    );
  }

  await prisma.applicationWeek.deleteMany({ where: { applicationId: id } });
  await prisma.applicationAddOn.deleteMany({ where: { applicationId: id } });
  await prisma.document.deleteMany({ where: { applicationId: id } });
  await prisma.approvalLog.deleteMany({ where: { applicationId: id } });
  // VendorActivityLog rows are preserved: onDelete: SetNull nullifies their applicationId
  await prisma.application.delete({ where: { id } });

  await logVendorActivity({
    vendorId: profile.id,
    action: "APPLICATION_DELETED",
    applicationId: null,
    detail: `Booth type: ${app.boothTypeId ?? "none"}, Status was: DRAFT`,
    ipAddress: getIpFromRequest(request),
  });

  return NextResponse.json({ success: true });
}
