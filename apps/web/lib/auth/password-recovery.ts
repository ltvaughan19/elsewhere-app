type AuthError = { message?: string } | null;

export interface PasswordRecoveryAuth {
  resetPasswordForEmail(
    email: string,
    options: { redirectTo: string },
  ): Promise<{ error: AuthError }>;
  updateUser(attributes: { password: string }): Promise<{ error: AuthError }>;
}

export async function requestPasswordRecovery(
  auth: PasswordRecoveryAuth,
  email: string,
  origin: string,
): Promise<boolean> {
  const { error } = await auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  return !error;
}

export async function updateRecoveredPassword(
  auth: PasswordRecoveryAuth,
  password: string,
): Promise<boolean> {
  const { error } = await auth.updateUser({ password });
  return !error;
}

export function shouldRedirectInvalidRecovery(
  pathname: string,
  authenticatedSubject: string | null | undefined,
): boolean {
  return pathname === "/reset-password" && !authenticatedSubject;
}
