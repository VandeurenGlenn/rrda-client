const notifyUpdate = async () => {
  await import('./custom-notification-37b1889c.js');
  const notification = document.createElement('custom-notification');
  document.querySelector('body').appendChild(notification);

  notification.text = 'Update detected, click ok to refresh!';
  notification.action = () => window.location.reload();
  notification.show();
};

(async () => {
  try {
    window.registration = await navigator.serviceWorker.register('/service-worker.js');
    registration.onupdatefound = () => {
      notifyUpdate();
    };
    console.log('Registration successful, scope is:', registration.scope);
  } catch (error) {
    console.log('Service worker registration failed, error:', error);
  }
})();
