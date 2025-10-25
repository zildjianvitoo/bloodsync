export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmail({ to, subject, body }: EmailPayload) {
  if (!to) {
    throw new Error("Missing email address");
  }
  console.log(`[email] ${subject} -> ${to}\n${body}`);
}
