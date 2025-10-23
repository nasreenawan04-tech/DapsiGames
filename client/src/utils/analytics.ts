/**
 * Analytics utilities for tracking user behavior and events
 * Integrates with Google Analytics and custom tracking
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Initialize Google Analytics
 */
export function initializeAnalytics(measurementId: string): void {
  if (!measurementId) {
    console.warn('Google Analytics measurement ID not provided');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send page views manually
  });
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });

  // Also track in custom analytics
  trackCustomEvent('page_view', {
    path,
    title: title || document.title,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  if (!window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });

  trackCustomEvent(action, {
    category,
    label,
    value,
  });
}

/**
 * Track study session completion
 */
export function trackStudySession(duration: number, xpEarned: number): void {
  trackEvent('Study', 'session_complete', `${duration}min`, xpEarned);
}

/**
 * Track task completion
 */
export function trackTaskCompletion(taskCategory: string, xpEarned: number): void {
  trackEvent('Tasks', 'task_complete', taskCategory, xpEarned);
}

/**
 * Track game completion
 */
export function trackGameCompletion(gameId: string, score: number): void {
  trackEvent('Games', 'game_complete', gameId, score);
}

/**
 * Track achievement unlock
 */
export function trackAchievementUnlock(achievementName: string): void {
  trackEvent('Achievements', 'unlock', achievementName);
}

/**
 * Track level up
 */
export function trackLevelUp(newLevel: number): void {
  trackEvent('Progression', 'level_up', `Level ${newLevel}`, newLevel);
}

/**
 * Track subscription conversion
 */
export function trackSubscription(plan: string, price: number): void {
  if (!window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: `sub_${Date.now()}`,
    value: price,
    currency: 'USD',
    items: [{
      item_id: plan,
      item_name: `DapsiGames ${plan} Subscription`,
      price: price,
    }],
  });

  trackEvent('Subscription', 'subscribe', plan, price);
}

/**
 * Track subscription cancellation
 */
export function trackSubscriptionCancel(): void {
  trackEvent('Subscription', 'cancel');
}

/**
 * Track user registration
 */
export function trackRegistration(method: 'email' | 'google' | 'github'): void {
  trackEvent('Auth', 'register', method);
}

/**
 * Track user login
 */
export function trackLogin(method: 'email' | 'google' | 'github'): void {
  trackEvent('Auth', 'login', method);
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string): void {
  trackEvent('Features', 'use', featureName);
}

/**
 * Track error occurrence
 */
export function trackError(errorType: string, errorMessage: string): void {
  if (!window.gtag) return;

  window.gtag('event', 'exception', {
    description: `${errorType}: ${errorMessage}`,
    fatal: false,
  });

  trackCustomEvent('error', {
    type: errorType,
    message: errorMessage,
  });
}

/**
 * Set user properties
 */
export function setUserProperties(userId: string, properties: Record<string, any>): void {
  if (!window.gtag) return;

  window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID, {
    user_id: userId,
    user_properties: properties,
  });
}

/**
 * Track custom events to backend for detailed analytics
 */
async function trackCustomEvent(eventName: string, data: Record<string, any>): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventName,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        path: window.location.pathname,
      }),
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug('Analytics tracking failed:', error);
  }
}

/**
 * Track time spent on page
 */
export class TimeTracker {
  private startTime: number;
  private pagePath: string;

  constructor(pagePath: string) {
    this.pagePath = pagePath;
    this.startTime = Date.now();
  }

  end(): void {
    const duration = Date.now() - this.startTime;
    const seconds = Math.round(duration / 1000);
    
    trackEvent('Engagement', 'time_on_page', this.pagePath, seconds);
  }
}

/**
 * Track scroll depth
 */
export function initScrollTracking(): void {
  let maxScroll = 0;
  const checkpoints = [25, 50, 75, 100];
  const tracked = new Set<number>();

  const trackScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / scrollHeight) * 100;
    
    if (scrolled > maxScroll) {
      maxScroll = scrolled;
    }

    checkpoints.forEach(checkpoint => {
      if (maxScroll >= checkpoint && !tracked.has(checkpoint)) {
        trackEvent('Engagement', 'scroll_depth', `${checkpoint}%`, checkpoint);
        tracked.add(checkpoint);
      }
    });
  };

  window.addEventListener('scroll', trackScroll, { passive: true });
}

/**
 * Initialize analytics with environment configuration
 */
export function setupAnalytics(): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (measurementId) {
    initializeAnalytics(measurementId);
  }

  // Initialize scroll tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollTracking);
  } else {
    initScrollTracking();
  }
}
