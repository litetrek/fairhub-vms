import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({}, { status: 200 });

  const docs = await prisma.document.findMany({
    where: {
      vendorId: profile.id,
      applicationId: { not: null },
    },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      fileUrl: true,
      uploadedAt: true,
      applicationId: true,
      docType: true,
      status: true,
    },
  });

  const grouped: Record<string, typeof docs> = {};
  for (const doc of docs) {
    if (!grouped[doc.docType]) grouped[doc.docType] = [];
    grouped[doc.docType].push(doc);
  }

  return NextResponse.json(grouped);
}
