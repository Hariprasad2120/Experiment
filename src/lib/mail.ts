import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@appraisal.com"

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.log(`[Mail skipped] To: ${to} | Subject: ${subject}`)
    return
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error("Mail send error:", err)
  }
}

export async function sendAssignmentNotification(
  evaluatorEmail: string,
  evaluatorName: string,
  employeeName: string,
  role: string
) {
  await send(
    evaluatorEmail,
    `Appraisal Assignment - ${employeeName}`,
    `<p>Dear ${evaluatorName},</p>
     <p>You have been assigned as <strong>${role}</strong> for the appraisal of <strong>${employeeName}</strong>.</p>
     <p>Please log in to the Appraisal Management System to mark your availability.</p>`
  )
}

export async function sendAvailabilityReminder(
  evaluatorEmail: string,
  evaluatorName: string,
  employeeName: string
) {
  await send(
    evaluatorEmail,
    `Reminder: Mark Availability for ${employeeName}'s Appraisal`,
    `<p>Dear ${evaluatorName},</p>
     <p>This is a reminder to mark your availability for <strong>${employeeName}</strong>'s appraisal.</p>
     <p>Please log in and submit your availability as soon as possible.</p>`
  )
}

export async function sendRatingReminder(
  evaluatorEmail: string,
  evaluatorName: string,
  employeeName: string
) {
  await send(
    evaluatorEmail,
    `Reminder: Submit Rating for ${employeeName}`,
    `<p>Dear ${evaluatorName},</p>
     <p>Please submit your rating and feedback for <strong>${employeeName}</strong>'s appraisal.</p>`
  )
}

export async function sendAppraisalScheduled(
  employeeEmail: string,
  employeeName: string,
  appraisalDate: string
) {
  await send(
    employeeEmail,
    "Your Appraisal Has Been Scheduled",
    `<p>Dear ${employeeName},</p>
     <p>Your appraisal has been scheduled for <strong>${appraisalDate}</strong>.</p>
     <p>Please be available on this date for the appraisal meeting.</p>`
  )
}

export async function sendMOMCreated(
  employeeEmail: string,
  employeeName: string
) {
  await send(
    employeeEmail,
    "Appraisal MOM Available",
    `<p>Dear ${employeeName},</p>
     <p>The Minutes of Meeting (MOM) for your appraisal is now available.</p>
     <p>Please log in to view your final rating and increment details.</p>`
  )
}
