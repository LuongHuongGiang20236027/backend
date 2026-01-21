import Mailjet from "node-mailjet"

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_PUBLIC,
    process.env.MAILJET_PRIVATE
)

export async function sendResetMail(to, link) {
    const request = await mailjet
        .post("send", { version: "v3.1" })
        .request({
            Messages: [
                {
                    From: {
                        Email: "yengiang2402@gmail.com",
                        Name: "Smart Edu"
                    },
                    To: [
                        {
                            Email: to
                        }
                    ],
                    Subject: "Khôi phục mật khẩu Smart Edu",
                    HTMLPart: `
            <h3>Khôi phục mật khẩu</h3>
            <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
            <p>Link này hết hạn sau 15 phút:</p>
            <a href="${link}">${link}</a>
            <p>Nếu không phải bạn, hãy bỏ qua email này.</p>
          `
                }
            ]
        })

    console.log("📧 MAILJET STATUS:", request.body.Messages[0].Status)
    return request.body
}
