import { requireAuth } from "@/module/auth/utils/auth-utils";

export default async function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return children;
}