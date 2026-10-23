"use client";

import { useAppStore } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Paths from "@/constants/paths";
import { Link, useRouter } from "@/i18n/navigation";
import { handleErrorApi } from "@/lib/form";
import { decodeToken } from "@/lib/jwt";
import { useLoginMutation } from "@/queries/useAuth";
import { loginBodySchema } from "@/schemas/auth";
import type { LoginBody } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      fill="currentColor"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      fill="currentColor"
    />
  </svg>
);

const LoginForm = () => {
  // #region State
  const t = useTranslations("Login");
  const tError = useTranslations("ErrorMessage");

  const router = useRouter();
  const searchParams = useSearchParams();
  const setRole = useAppStore((state) => state.setRole);

  const form = useForm<LoginBody>({
    resolver: zodResolver(loginBodySchema),
    defaultValues: { email: "", password: "" },
  });
  // #endregion

  // #region Queries
  const loginMutation = useLoginMutation();
  // #endregion

  // #region Derived
  const clearTokens = searchParams.get("clearTokens");
  const { errors } = form.formState;

  // Zod stores a catalog key; a 422 from the server stores a ready-made
  // sentence. Translate only what the catalog actually knows.
  const translateError = (message?: string) =>
    message && tError.has(message) ? tError(message) : message;
  // #endregion

  // #region Handlers
  const handleLogin = async (values: LoginBody) => {
    if (loginMutation.isPending) return;

    try {
      const result = await loginMutation.mutateAsync(values);

      setRole(decodeToken(result.data.accessToken).role);
      router.push(Paths.index);
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
        fallbackMessage: tError("unknown"),
      });
    }
  };
  // #endregion

  // #region Effects
  useEffect(() => {
    if (clearTokens) {
      setRole();
    }
  }, [clearTokens, setRole]);
  // #endregion

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(handleLogin)} noValidate>
          <FieldGroup>
            {/* TODO: Enable once the backend supports OAuth and the Google env
                vars are uncommented in src/config.ts */}
            <Field>
              <Button variant="outline" type="button" disabled>
                <AppleIcon />
                {t("loginWithApple")}
              </Button>
              <Button variant="outline" type="button" disabled>
                <GoogleIcon />
                {t("loginWithGoogle")}
              </Button>
            </Field>

            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              {t("separator")}
            </FieldSeparator>

            <Field data-invalid={Boolean(errors.email)}>
              <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...form.register("email")}
              />
              <FieldError>{translateError(errors.email?.message)}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.password)}>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <Link
                  href={Paths.auth.forgotPassword.index}
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...form.register("password")}
              />
              <FieldError>
                {translateError(errors.password?.message)}
              </FieldError>
            </Field>

            <Field>
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending && (
                  <LoaderCircle className="animate-spin" />
                )}
                {t("submit")}
              </Button>
              <FieldDescription className="text-center">
                {t("noAccount")}{" "}
                <Link
                  href={Paths.auth.register.index}
                  className="underline underline-offset-4"
                >
                  {t("signUp")}
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
