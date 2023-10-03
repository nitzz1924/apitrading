const serviceAccount = require(`./serviceAccountKey.json`);
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moverstrip-1a7fb.firebaseio.com"
});

// Create a list containing up to 500 registration tokens.
// These registration tokens come from the client FCM SDKs.
const registrationTokens = ['dmk1kcL1Q5yLVLevPrcI7l:APA91bFWfPOTji9DduvRnr6gcO0jfUKxOjSvoqX0Fluv2aklmuou6Nt5vExuwFj7xrpVMb6QQzQ5923FY4cTWkh3PJCKCLMZcy8BZbJAs8p_rVDlkJEKjlthzO3XBhkYTNXwFa6-_43i'];

const message = {
  tokens: registrationTokens,
  notification: {
    body: 'This is an FCM notification that displays an image!',
    title: 'FCM Notification',
  },
  apns: {
    payload: {
      aps: {
        'mutable-content': 1,
      },
    },
    fcm_options: {
      image: 'https://www.gstatic.com/devrel-devsite/prod/v2325d8c952b9b608081f2b039989eacb0148117feedf74c3efc58771dfb973db/firebase/images/lockup.svg',
    },
  },
  android: {
    notification: {
      image: 'https://www.gstatic.com/devrel-devsite/prod/v2325d8c952b9b608081f2b039989eacb0148117feedf74c3efc58771dfb973db/firebase/images/lockup.svg',
    },
  },
};

var payload = {
  notification: {
    title: "Account Deposit",
    body: "A deposit to your savings account has just cleared."
  }
};

var options = {
  priority: "normal",
  timeToLive: 60 * 60
};

admin.messaging().sendToDevice(registrationTokens[0], payload, options)
  .then(function(response) {
    console.log("Successfully sent message:", response);
  })
  .catch(function(error) {
    console.log("Error sending message:", error);
  });

return

admin
  .messaging()
  .send(message)
  .then(response => {
    console.log('Successfully sent message:', response);
  })
  .catch(error => {
    console.log('Error sending message:', error);
  });

  /*

  // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlFWM1mAZnY-I0h_TTnaqcPMGyu8-XFUg",
  authDomain: "moverstrip-1a7fb.firebaseapp.com",
  databaseURL: "https://moverstrip-1a7fb.firebaseio.com",
  projectId: "moverstrip-1a7fb",
  storageBucket: "moverstrip-1a7fb.appspot.com",
  messagingSenderId: "15314105265",
  appId: "1:15314105265:web:e17360925ca733a858c390",
  measurementId: "G-J5EQN62SV1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);*/