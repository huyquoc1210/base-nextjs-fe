import LoginForm from "@/app/[locale]/(auth)/login/login-form";
import { Suspense } from "react";

const LoginPage = () => (
  <Suspense>
    <LoginForm />
  </Suspense>
);

export default LoginPage;
