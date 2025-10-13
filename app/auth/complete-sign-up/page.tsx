import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

const DEFAULT_REDIRECT = "/dashboard";

type SupportedRole = "candidate" | "voter";

const supportedRoles = new Set<SupportedRole>(["candidate", "voter"]);

const isSupportedRole = (value: string | undefined): value is SupportedRole =>
  Boolean(value && supportedRoles.has(value as SupportedRole));

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sanitizeRedirect = (value: string | undefined): string => {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_REDIRECT;
  }
  return value;
};

export default async function CompleteSignUpPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const desiredRoleRaw = resolvedParams.role;
  const desiredRole = Array.isArray(desiredRoleRaw)
    ? desiredRoleRaw[0]
    : desiredRoleRaw;
  const redirectRaw = resolvedParams.redirect;
  const redirectTarget = sanitizeRedirect(
    Array.isArray(redirectRaw) ? redirectRaw[0] : redirectRaw
  );

  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(redirectTarget)}`);
  }

  if (isSupportedRole(desiredRole)) {
    try {
      const clerk = await clerkClient();
      const user = await clerk.users.getUser(userId!);
      const existingMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
      const updates: Record<string, unknown> = { ...existingMetadata };

      if (desiredRole === "candidate") {
        updates.isCandidate = true;
      } else if (desiredRole === "voter") {
        updates.isVoter = true;
      }

      await clerk.users.updateUser(userId!, {
        publicMetadata: updates,
      });
    } catch (error) {
      console.error("Failed to finalize sign-up role metadata", error);
    }
  }

  redirect(redirectTarget);
}
