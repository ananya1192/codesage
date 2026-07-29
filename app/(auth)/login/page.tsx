import LoginUI from "@/module/auth/components/login-ui";
import { requireUnAuth } from "@/module/auth/utils/auth-utils";

const LogInPage = async() => {
  await requireUnAuth()
  return <LoginUI />;
};

export default LogInPage;