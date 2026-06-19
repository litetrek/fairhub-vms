import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client — uses service-role key so it can create auth users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const VALID_ROLES = ["VENDOR", "STAFF", "ADMIN"] as const;
type Role = (typeof VALID_ROLES)[number];

// ─── GET /api/admin/users — list all users ────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user: adminUser } = authResult;

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users, currentUserId: adminUser.id });
}

// ─── POST /api/admin/users — create staff/admin account ───────────────────────

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password, role } = body as {
    email?: string;
    password?: string;
    role?: string;
  };

  // Validate
  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "email, password, and role are required." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (!VALID_ROLES.includes(role as Role)) {
    return NextResponse.json(
      { error: `Role must be one of: ${VALID_ROLES.join(", ")}.` },
      { status: 400 }
    );
  }

  // 1. Create Supabase auth user (email pre-confirmed)
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create auth user." },
      { status: 422 }
    );
  }

  // 2. Create Prisma User row with the same id as Supabase auth user
  const newUser = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      role: role as Role,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json(newUser, { status: 201 });
}
