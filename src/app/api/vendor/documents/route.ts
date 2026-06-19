import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.vendorProfile.findUnique({
    where: { userId: user.id }, select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { docType, fileName, fileUrl } = await request.json();
  if (!docType || !fileName || !fileUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      vendorId: profile.id,
      applicationId: null,
      docType,
      fileName,
      fileUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json(doc);
}
