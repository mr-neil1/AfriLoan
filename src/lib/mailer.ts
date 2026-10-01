import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes("example.com")) {
    console.log(`[SIMULATED EMAIL] AfriLoan OTP for ${email}: ${otp}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "AfriLoan <contact@afriloan.com>",
      to: email,
      subject: "AfriLoan - Votre code de sécurité et vérification",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #1F2937; max-width: 500px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px;">
          <h2 style="color: #064E29; margin-bottom: 8px;">AfriLoan</h2>
          <p style="color: #6B7280; font-size: 14px; margin-top: 0;">Vos projets, notre priorité</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p>Voici votre code de sécurité à 6 chiffres pour accéder à votre espace :</p>
          <div style="font-size: 32px; font-weight: bold; color: #064E29; letter-spacing: 6px; margin: 20px 0; background: #F0FDF4; padding: 12px; border-radius: 8px; border: 1px dashed #10B981;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #6B7280;">Ce code expire dans 15 minutes. Ne le partagez avec personne.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

export const sendLoanNotification = async (
  email: string,
  title: string,
  message: string,
  amount?: number
) => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER.includes("example.com")) {
    console.log(`[SIMULATED EMAIL] AfriLoan Notice for ${email}: ${title} - ${message}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "AfriLoan <contact@afriloan.com>",
      to: email,
      subject: `AfriLoan - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1F2937; max-width: 500px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px;">
          <h2 style="color: #064E29;">${title}</h2>
          <p>${message}</p>
          ${amount ? `<div style="font-size: 24px; font-weight: bold; color: #F59E0B; margin: 16px 0;">${amount.toLocaleString("fr-FR")} FCFA</div>` : ""}
          <p style="font-size: 12px; color: #6B7280; margin-top: 24px;">AfriLoan - Plateforme africaine de prêt en ligne. Vos projets, notre priorité.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Error sending loan email:", error);
    return false;
  }
};
