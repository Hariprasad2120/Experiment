import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "no-reply@example.com";
const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendArgs) {
  if (!resend) {
    console.log("[email:stub]", { to, subject });
    console.log(html);
    return { stubbed: true };
  }
  return resend.emails.send({ from, to, subject, html });
}

export function assignmentEmail(params: {
  reviewerName: string;
  employeeName: string;
  role: string;
  loginUrl: string;
}) {
  const { reviewerName, employeeName, role, loginUrl } = params;
  return {
    subject: `You have been assigned as ${role} reviewer for ${employeeName}`,
    html: `
      <p>Hi ${reviewerName},</p>
      <p>You have been assigned as the <b>${role}</b> reviewer for the appraisal of <b>${employeeName}</b>.</p>
      <p>Login to the appraisal portal to proceed:</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
      <p>— Appraisal Management System</p>
    `,
  };
}

export function cycleStartedEmail(params: {
  employeeName: string;
  loginUrl: string;
}) {
  const { employeeName, loginUrl } = params;
  return {
    subject: "Your appraisal cycle has started — best wishes!",
    html: `
      <p>Hi ${employeeName},</p>
      <p>Best wishes! Your appraisal cycle has begun. Please login and complete your self-assessment.</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
    `,
  };
}

export function rateCompletedEmail(params: {
  otherReviewerName: string;
  employeeName: string;
  ratedByRole: string;
}) {
  const { otherReviewerName, employeeName, ratedByRole } = params;
  return {
    subject: `${ratedByRole} has rated ${employeeName}`,
    html: `<p>Hi ${otherReviewerName},</p><p>The <b>${ratedByRole}</b> reviewer has submitted their rating for <b>${employeeName}</b>.</p>`,
  };
}
