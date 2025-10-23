/**
 * Push notification utilities for DapsiGames PWA
 * Handles requesting permission, subscribing to push notifications, and sending notifications
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  url?: string;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      return existingSubscription;
    }

    // Request permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Subscribe to push notifications
    // Note: In production, you would use your VAPID public key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });

    // Send subscription to backend
    await fetch('/api/push-subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Show a local notification
 */
export async function showNotification(payload: NotificationPayload): Promise<void> {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.png',
      badge: payload.badge || '/favicon.png',
      data: payload.data || {},
      tag: 'dapsigames-notification',
      requireInteraction: false,
    } as NotificationOptions);
  } else {
    // Fallback to regular notification
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/favicon.png',
    });
  }
}

/**
 * Schedule a reminder notification
 */
export function scheduleReminder(message: string, delayMinutes: number): void {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker not supported');
    return;
  }

  const delayMs = delayMinutes * 60 * 1000;
  
  setTimeout(() => {
    showNotification({
      title: 'Study Reminder',
      body: message,
      data: { type: 'reminder' },
    });
  }, delayMs);
}

/**
 * Send study session completion notification
 */
export async function notifySessionComplete(xpEarned: number): Promise<void> {
  await showNotification({
    title: 'Study Session Complete! 🎉',
    body: `Great job! You earned ${xpEarned} XP`,
    data: { type: 'session-complete', xp: xpEarned },
  });
}

/**
 * Send streak achievement notification
 */
export async function notifyStreakAchievement(days: number): Promise<void> {
  await showNotification({
    title: `${days}-Day Streak! 🔥`,
    body: `Amazing! You've maintained a ${days}-day study streak`,
    data: { type: 'streak', days },
  });
}

/**
 * Send level up notification
 */
export async function notifyLevelUp(newLevel: number): Promise<void> {
  await showNotification({
    title: 'Level Up! ⭐',
    body: `Congratulations! You've reached level ${newLevel}`,
    data: { type: 'level-up', level: newLevel },
  });
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
