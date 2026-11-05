import "dotenv/config";
import { sendEmail } from "./src/utils/email.js";

const test = async () => {
  try {
    await sendEmail({
      to: "madhavareddy231205@gmail.com",
      subject: "SoulScriptly Email Test",
      html: "<h2>Gmail SMTP is working!</h2><p>Your email setup is successful.</p>",
    });

    console.log("Test email sent successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
};

test();