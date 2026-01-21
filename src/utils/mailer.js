import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendResetMail(to, link) {
    return resend.emails.send({
        from: process.env.MAIL_FROM,
        to,
        subject: "Khôi phục mật khẩu Smart Edu",
        html: `
      <h3>Khôi phục mật khẩu</h3>
      <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
      <p>Link này hết hạn sau 15 phút:</p>
      <a href="${link}">${link}</a>
      <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
    `
    })
}
