/**
 * firebase.js
 * إعدادات Firebase Admin SDK للإشعارات
 */

const admin = require('firebase-admin');

/**
 * تهيئة Firebase Admin
 */
const initializeFirebase = () => {
  try {
    // التحقق من عدم التهيئة المسبقة
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });

      console.log('✅ Firebase Admin initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

/**
 * إرسال إشعار إلى جهاز محدد
 * @param {string} fcmToken - رمز جهاز FCM
 * @param {Object} notification - بيانات الإشعار
 * @param {Object} data - بيانات إضافية
 */
const sendPushNotification = async (fcmToken, notification, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl || undefined
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        status: 'done'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'starchat_channel',
          priority: 'high',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
          defaultLightSettings: true
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    throw error;
  }
};

/**
 * إرسال إشعار متعدد الأجهزة
 * @param {Array<string>} tokens - مصفوفة من رموز FCM
 * @param {Object} notification - بيانات الإشعار
 * @param {Object} data - بيانات إضافية
 */
const sendMulticastNotification = async (tokens, notification, data = {}) => {
  try {
    const message = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: data
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Notifications sent: ${response.successCount} successful, ${response.failureCount} failed`);
    return response;
  } catch (error) {
    console.error('❌ Error sending multicast notification:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
  admin
};
