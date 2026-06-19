import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId, sourceDocumentId } = await request.json();

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const targetApp = await prisma.application.findFirst({
    where: { id: applicationId, vendorId: profile.id },
  });
  if (!targetApp) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const sourceDoc = await prisma.document.findFirst({
    where: { id: sourceDocumentId, vendorId: profile.id },
  });
  if (!sourceDoc) {
    return NextResponse.json({ error: "Source document not found" }, { status: 404 });
  }

  const existing = await prisma.document.findFirst({
    where: { applicationId, docType: sourceDoc.docType },
  });
  if (existing) {
    await prisma.document.delete({ where: { id: existing.id } });
  }

  const newDoc = await prisma.document.create({
    data: {
      vendorId: profile.id,
      applicationId,
      docType: sourceDoc.docType,
      fileName: sourceDoc.fileName,
      fileUrl: sourceDoc.fileUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json(newDoc);
}
