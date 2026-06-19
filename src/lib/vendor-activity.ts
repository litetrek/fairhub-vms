import { prisma } from "@/lib/prisma";

export type VendorAction =
  | "LOGIN"
  | "LOGOUT"
  | "PROFILE_UPDATED"
  | "APPLICATION_CREATED"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_RESUBMITTED"
  | "APPLICATION_WITHDRAWN"
  | "APPLICATION_DELETED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_REUSED"
  | "DOCUMENT_DELETED"
  | "STANDALONE_DOCUMENT_UPLOADED"
  | "STANDALONE_DOCUMENT_DELETED";

interface LogParams {
  vendorId: string;
  action: VendorAction;
  applicationId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
}

export async function logVendorActivity(params: LogParams) {
  try {
    await prisma.vendorActivityLog.create({
      data: {
        vendorId:      params.vendorId,
        action:        params.action,
        applicationId: params.applicationId ?? null,
        detail:        params.detail ?? null,
        ipAddress:     params.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("[VendorActivityLog] Failed to write log:", err);
  }
}

export function getIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? null;
}
