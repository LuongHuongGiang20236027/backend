import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export async function sendResetMail(to, link) {
    const info = await transporter.sendMail({
        from: `"Smart Edu" <${process.env.EMAIL_USER}>`,
        to,
        subject: "Khôi phục mật khẩu Smart Edu",
        html: `
      <h3>Khôi phục mật khẩu</h3>
      <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
      <p>Link này hết hạn sau 15 phút:</p>
      <a href="${link}">${link}</a>
      <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
    `,
    })

    console.log("📧 MAIL SENT:", info.response)
    return info
}
