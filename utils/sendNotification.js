import admin from "firebase-admin";

/**
 * Safe wrapper to send a push notification if Firebase Admin is initialized.
 */
export async function sendNotification(token, title, body, data = {}) {
  try {
    if (!admin.apps || !admin.apps.length) {
      console.log("ℹ️ Skipping push: Firebase Admin not initialized");
      return;
    }
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
    });
  } catch (e) {
    console.log("⚠️ Push send failed:", e.message);
  }
}
