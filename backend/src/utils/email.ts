const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

export type PasswordResetEmailParams = {
  toName: string;
  toEmail: string;
  resetLink: string;
};

/** Captured in tests when real EmailJS is skipped. */
export const lastPasswordResetEmail: { params: PasswordResetEmailParams | null } = {
  params: null,
};

function isTestEnv() {
  return process.env.NODE_ENV === "test" || process.env.VITEST === "true";
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  lastPasswordResetEmail.params = params;

  if (isTestEnv()) return;

  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId =
    process.env.EMAILJS_TEMPLATE_ID_RESET || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    throw new Error("EmailJS is not configured");
  }

  const res = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_name: params.toName,
        to_email: params.toEmail,
        reset_link: params.resetLink,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS send failed (${res.status}): ${body}`);
  }
}
