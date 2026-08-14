importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Fetch configuration dynamically from the backend so we don't hardcode API keys
fetch('/api/firebase-config')
  .then(response => response.json())
  .then(firebaseConfig => {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.ico'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  })
  .catch(err => console.error("Failed to fetch Firebase config in service worker", err));


