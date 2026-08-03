import { connection } from "next/server";
import LoginUI from "@/module/auth/components/login-ui";
import { requireUnAuth } from "@/module/auth/utils/auth-utils";

const LogInPage = async () => {
  await connection(); // Tell Next.js this route depends on the current request
  await requireUnAuth();

  return <LoginUI />;
};

export default LogInPage;