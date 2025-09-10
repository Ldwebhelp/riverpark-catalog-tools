'use client';

import { useState, useEffect } from 'react';
import { notificationsSystem, type Notification } from '@/lib/notifications-system';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

  useEffect(() => {
    const unsubscribe = notificationsSystem.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Load initial notifications
    setNotifications(notificationsSystem.getNotifications());

    return unsubscribe;
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'critical':
        return notification.priority === 'critical' || notification.priority === 'high';
      default:
        return true;
    }
  });

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      'product-updated': '📦',
      'species-generated': '🤖',
      'species-outdated': '⚠️',
      'sync-completed': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    const colors = {
      'low': 'border-l-blue-400 bg-blue-50',
      'medium': 'border-l-yellow-400 bg-yellow-50',
      'high': 'border-l-orange-400 bg-orange-50',
      'critical': 'border-l-red-400 bg-red-50'
    };
    return colors[priority];
  };

  const getSourceBadge = (source: Notification['source']) => {
    const badges = {
      'bigcommerce': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'BigCommerce' },
      'catalog-tools': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Catalog Tools' },
      'riverpark-fresh': { bg: 'bg-green-100', text: 'text-green-800', label: 'Riverpark Fresh' }
    };
    
    const badge = badges[source];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleNotificationAction = (notification: Notification, actionName: string, actionData?: any) => {
    switch (actionName) {
      case 'regenerate-species':
        // Trigger species regeneration
        console.log('Regenerating species for product:', actionData?.productId);
        break;
      case 'view-changes':
        // Show product changes
        console.log('Viewing changes for product:', actionData?.productId);
        break;
      case 'retry-generation':
        // Retry failed generation
        console.log('Retrying generation for product:', actionData?.productId);
        break;
      case 'retry-sync':
        // Retry BigCommerce sync
        notificationsSystem.syncWithBigCommerce();
        break;
      default:
        console.log('Unknown action:', actionName);
    }
    
    // Mark notification as read when action is taken
    notificationsSystem.markAsRead(notification.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'unread' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({notifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              filter === 'critical' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical ({notifications.filter(n => n.priority === 'critical' || n.priority === 'high').length})
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => notificationsSystem.markAllAsRead()}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No notifications</p>
            <p className="text-sm mt-1">
              {filter === 'all' ? 'All caught up!' : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'bg-opacity-50' : 'bg-opacity-25'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        {getSourceBadge(notification.source)}
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <button
                        onClick={() => notificationsSystem.markAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {notification.read ? 'Read' : 'Mark read'}
                      </button>
                    </div>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => handleNotificationAction(notification, action.action, action.data)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with system status */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>System Status</span>
            <button
              onClick={() => {
                notificationsSystem.syncWithBigCommerce();
                notificationsSystem.checkRiverparkFreshStatus();
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span>BigCommerce:</span>
              <span className="text-green-600">●</span>
            </div>
            <div className="flex justify-between">
              <span>Catalog Tools:</span>
              <span className="text-green-600">●</span>
            </div>
            <div className="flex justify-between">
              <span>Riverpark Fresh:</span>
              <span className="text-green-600">●</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}