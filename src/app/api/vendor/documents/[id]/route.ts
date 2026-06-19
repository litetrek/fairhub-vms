import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const BLOCKING_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "CONDITIONALLY_APPROVED", "APPROVED"];

export async function DELETE(
  _req: Request,
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

  const doc = await prisma.document.findFirst({
    where: { id, vendorId: profile.id },
    include: { application: { select: { status: true } } },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.application && BLOCKING_STATUSES.includes(doc.application.status)) {
    return NextResponse.json(
      { error: "Cannot delete a document attached to a live application" },
      { status: 400 }
    );
  }

  const { error: storageError } = await supabase.storage
    .from("vendor-documents")
    .remove([doc.fileUrl]);
  if (storageError) console.error("Storage delete error:", storageError);

  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
