import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

export async function sendResetMail(to, link) {
    return transporter.sendMail({
        from: `"Smart Edu" <${process.env.MAIL_USER}>`,
        to,
        subject: "Khôi phục mật khẩu",
        html: `
      <h3>Khôi phục mật khẩu</h3>
      <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
      <p>Link này hết hạn sau 15 phút:</p>
      <a href="${link}">${link}</a>
      <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
    `
    });
}
