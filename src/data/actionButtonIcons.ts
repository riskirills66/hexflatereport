export interface ActionButtonIcon {
  name: string;
  displayName: string;
  category: string;
}

export const ACTION_BUTTON_ICONS: ActionButtonIcon[] = [
  // Navigation & Core Icons
  { name: 'home_outlined', displayName: 'Home (Outline)', category: 'Navigation' },
  { name: 'home', displayName: 'Home (Filled)', category: 'Navigation' },
  { name: 'dashboard_outlined', displayName: 'Dashboard (Outline)', category: 'Navigation' },
  { name: 'dashboard', displayName: 'Dashboard (Filled)', category: 'Navigation' },
  { name: 'person_outline', displayName: 'Profile (Outline)', category: 'Navigation' },
  { name: 'person', displayName: 'Profile (Filled)', category: 'Navigation' },
  { name: 'account_circle_outlined', displayName: 'User Account (Outline)', category: 'Navigation' },
  { name: 'account_circle', displayName: 'User Account (Filled)', category: 'Navigation' },
  { name: 'notifications_outlined', displayName: 'Notifications (Outline)', category: 'Navigation' },
  { name: 'notifications', displayName: 'Notifications (Filled)', category: 'Navigation' },
  { name: 'mail_outlined', displayName: 'Messages (Outline)', category: 'Navigation' },
  { name: 'mail', displayName: 'Messages (Filled)', category: 'Navigation' },
  { name: 'settings_outlined', displayName: 'Settings (Outline)', category: 'Navigation' },
  { name: 'settings', displayName: 'Settings (Filled)', category: 'Navigation' },
  { name: 'apps_rounded', displayName: 'More Menu', category: 'Navigation' },
  { name: 'menu', displayName: 'Hamburger Menu', category: 'Navigation' },
  { name: 'arrow_back', displayName: 'Back Button', category: 'Navigation' },
  { name: 'close', displayName: 'Close/X', category: 'Navigation' },
  { name: 'check', displayName: 'Checkmark', category: 'Navigation' },
  { name: 'info_outline', displayName: 'Information (Outline)', category: 'Navigation' },
  { name: 'info', displayName: 'Information (Filled)', category: 'Navigation' },
  { name: 'help_outline', displayName: 'Help (Outline)', category: 'Navigation' },
  { name: 'help', displayName: 'Help (Filled)', category: 'Navigation' },

  // Financial & Payment Icons
  { name: 'account_balance_wallet_outlined', displayName: 'Wallet (Outline)', category: 'Financial' },
  { name: 'account_balance_wallet', displayName: 'Wallet (Filled)', category: 'Financial' },
  { name: 'payment', displayName: 'Payment', category: 'Financial' },
  { name: 'credit_card_outlined', displayName: 'Credit Card (Outline)', category: 'Financial' },
  { name: 'credit_card', displayName: 'Credit Card (Filled)', category: 'Financial' },
  { name: 'account_balance', displayName: 'Bank Account', category: 'Financial' },
  { name: 'receipt_long', displayName: 'Receipt', category: 'Financial' },
  { name: 'receipt', displayName: 'Transaction', category: 'Financial' },
  { name: 'attach_money', displayName: 'Money', category: 'Financial' },
  { name: 'monetization_on', displayName: 'Currency', category: 'Financial' },
  { name: 'account_balance_outlined', displayName: 'Banking (Outline)', category: 'Financial' },
  { name: 'savings', displayName: 'Savings', category: 'Financial' },

  // Communication Icons
  { name: 'phone_outlined', displayName: 'Phone (Outline)', category: 'Communication' },
  { name: 'phone', displayName: 'Phone (Filled)', category: 'Communication' },
  { name: 'phone_android_outlined', displayName: 'Mobile (Outline)', category: 'Communication' },
  { name: 'phone_android', displayName: 'Mobile (Filled)', category: 'Communication' },
  { name: 'message_outlined', displayName: 'Message (Outline)', category: 'Communication' },
  { name: 'message', displayName: 'Message (Filled)', category: 'Communication' },
  { name: 'chat_outlined', displayName: 'Chat (Outline)', category: 'Communication' },
  { name: 'chat', displayName: 'Chat (Filled)', category: 'Communication' },
  { name: 'support_agent', displayName: 'Customer Service', category: 'Communication' },
  { name: 'headset_mic_outlined', displayName: 'Support (Outline)', category: 'Communication' },
  { name: 'headset_mic', displayName: 'Support (Filled)', category: 'Communication' },
  { name: 'email_outlined', displayName: 'Email (Outline)', category: 'Communication' },
  { name: 'email', displayName: 'Email (Filled)', category: 'Communication' },
  { name: 'sms_outlined', displayName: 'SMS (Outline)', category: 'Communication' },
  { name: 'sms', displayName: 'SMS (Filled)', category: 'Communication' },

  // Shopping & Commerce Icons
  { name: 'store', displayName: 'Store', category: 'Shopping' },
  { name: 'shopping_cart', displayName: 'Shopping Cart', category: 'Shopping' },
  { name: 'shopping_bag_outlined', displayName: 'Shopping Bag (Outline)', category: 'Shopping' },
  { name: 'shopping_bag', displayName: 'Shopping Bag (Filled)', category: 'Shopping' },
  { name: 'local_offer_outlined', displayName: 'Offers (Outline)', category: 'Shopping' },
  { name: 'local_offer', displayName: 'Offers (Filled)', category: 'Shopping' },
  { name: 'card_giftcard', displayName: 'Gift Card', category: 'Shopping' },
  { name: 'local_shipping_outlined', displayName: 'Shipping (Outline)', category: 'Shopping' },
  { name: 'local_shipping', displayName: 'Shipping (Filled)', category: 'Shopping' },
  { name: 'inventory', displayName: 'Inventory', category: 'Shopping' },
  { name: 'storefront', displayName: 'Shop Front', category: 'Shopping' },
  { name: 'point_of_sale', displayName: 'POS', category: 'Shopping' },
  { name: 'qr_code_2', displayName: 'QR Code', category: 'Shopping' },
  { name: 'qr_code_scanner', displayName: 'QR Scanner', category: 'Shopping' },

  // Travel & Transportation Icons
  { name: 'flight', displayName: 'Air Travel', category: 'Travel' },
  { name: 'directions_car_outlined', displayName: 'Car (Outline)', category: 'Travel' },
  { name: 'directions_car', displayName: 'Car (Filled)', category: 'Travel' },
  { name: 'train', displayName: 'Train', category: 'Travel' },
  { name: 'directions_bus_outlined', displayName: 'Bus (Outline)', category: 'Travel' },
  { name: 'directions_bus', displayName: 'Bus (Filled)', category: 'Travel' },
  { name: 'hotel', displayName: 'Hotel', category: 'Travel' },
  { name: 'restaurant', displayName: 'Restaurant', category: 'Travel' },
  { name: 'local_taxi', displayName: 'Taxi', category: 'Travel' },
  { name: 'bike_scooter', displayName: 'Scooter', category: 'Travel' },

  // Entertainment & Media Icons
  { name: 'movie', displayName: 'Movies', category: 'Entertainment' },
  { name: 'music_note', displayName: 'Music', category: 'Entertainment' },
  { name: 'games', displayName: 'Games', category: 'Entertainment' },
  { name: 'sports_esports', displayName: 'Gaming', category: 'Entertainment' },
  { name: 'live_tv', displayName: 'TV', category: 'Entertainment' },
  { name: 'radio', displayName: 'Radio', category: 'Entertainment' },
  { name: 'theaters', displayName: 'Cinema', category: 'Entertainment' },
  { name: 'event', displayName: 'Events', category: 'Entertainment' },

  // History & Time Icons
  { name: 'history', displayName: 'History', category: 'History' },
  { name: 'schedule', displayName: 'Schedule/Time', category: 'History' },
  { name: 'access_time', displayName: 'Clock/Time', category: 'History' },
  { name: 'restore', displayName: 'Restore/Undo', category: 'History' },
  { name: 'timeline', displayName: 'Timeline', category: 'History' },
  { name: 'update', displayName: 'Update/Refresh', category: 'History' },
  { name: 'schedule_send', displayName: 'Scheduled Send', category: 'History' },
  { name: 'pending_actions', displayName: 'Pending Actions', category: 'History' },
  { name: 'event_note', displayName: 'Event Notes', category: 'History' },
  { name: 'calendar_today', displayName: 'Calendar', category: 'History' },
  { name: 'date_range', displayName: 'Date Range', category: 'History' },
  { name: 'today', displayName: 'Today', category: 'History' },
  { name: 'yesterday', displayName: 'Yesterday', category: 'History' },
  { name: 'this_week', displayName: 'This Week', category: 'History' },

  // Trending & Analytics Icons
  { name: 'trending_up_outlined', displayName: 'Trending Up (Outline)', category: 'Analytics' },
  { name: 'trending_up', displayName: 'Trending Up (Filled)', category: 'Analytics' },
  { name: 'trending_down_outlined', displayName: 'Trending Down (Outline)', category: 'Analytics' },
  { name: 'trending_down', displayName: 'Trending Down (Filled)', category: 'Analytics' },
  { name: 'trending_flat_outlined', displayName: 'Trending Flat (Outline)', category: 'Analytics' },
  { name: 'trending_flat', displayName: 'Trending Flat (Filled)', category: 'Analytics' },
  { name: 'analytics_outlined', displayName: 'Analytics (Outline)', category: 'Analytics' },
  { name: 'analytics', displayName: 'Analytics (Filled)', category: 'Analytics' },
  { name: 'insights_outlined', displayName: 'Insights (Outline)', category: 'Analytics' },
  { name: 'insights', displayName: 'Insights (Filled)', category: 'Analytics' },
  { name: 'bar_chart', displayName: 'Bar Chart', category: 'Analytics' },
  { name: 'show_chart', displayName: 'Line Chart', category: 'Analytics' },
  { name: 'pie_chart', displayName: 'Pie Chart', category: 'Analytics' },
  { name: 'leaderboard', displayName: 'Leaderboard', category: 'Analytics' },
  { name: 'assessment', displayName: 'Assessment', category: 'Analytics' },

  // Action & Utility Icons
  { name: 'add', displayName: 'Add/Plus', category: 'Actions' },
  { name: 'edit', displayName: 'Edit', category: 'Actions' },
  { name: 'delete_outline', displayName: 'Delete (Outline)', category: 'Actions' },
  { name: 'delete', displayName: 'Delete (Filled)', category: 'Actions' },
  { name: 'search', displayName: 'Search', category: 'Actions' },
  { name: 'filter_list', displayName: 'Filter', category: 'Actions' },
  { name: 'sort', displayName: 'Sort', category: 'Actions' },
  { name: 'refresh', displayName: 'Refresh', category: 'Actions' },
  { name: 'download', displayName: 'Download', category: 'Actions' },
  { name: 'upload', displayName: 'Upload', category: 'Actions' },
  { name: 'share', displayName: 'Share', category: 'Actions' },
  { name: 'favorite_outline', displayName: 'Like/Favorite (Outline)', category: 'Actions' },
  { name: 'favorite', displayName: 'Like/Favorite (Filled)', category: 'Actions' },
  { name: 'bookmark_outline', displayName: 'Bookmark (Outline)', category: 'Actions' },
  { name: 'bookmark', displayName: 'Bookmark (Filled)', category: 'Actions' },
  { name: 'print', displayName: 'Print', category: 'Actions' },
  { name: 'save', displayName: 'Save', category: 'Actions' },
  { name: 'visibility_outlined', displayName: 'View (Outline)', category: 'Actions' },
  { name: 'visibility', displayName: 'View (Filled)', category: 'Actions' },
  { name: 'visibility_off_outlined', displayName: 'Hide (Outline)', category: 'Actions' },
  { name: 'visibility_off', displayName: 'Hide (Filled)', category: 'Actions' },
  { name: 'lock_outline', displayName: 'Lock (Outline)', category: 'Actions' },
  { name: 'lock', displayName: 'Lock (Filled)', category: 'Actions' },
  { name: 'security', displayName: 'Security', category: 'Actions' },

  // Status & Feedback Icons
  { name: 'check_circle_outline', displayName: 'Success (Outline)', category: 'Status' },
  { name: 'check_circle', displayName: 'Success (Filled)', category: 'Status' },
  { name: 'error_outline', displayName: 'Error (Outline)', category: 'Status' },
  { name: 'error', displayName: 'Error (Filled)', category: 'Status' },
  { name: 'warning_outlined', displayName: 'Warning (Outline)', category: 'Status' },
  { name: 'warning', displayName: 'Warning (Filled)', category: 'Status' },
  { name: 'done', displayName: 'Completed', category: 'Status' },
  { name: 'pending', displayName: 'Pending', category: 'Status' },
  { name: 'location_on_outlined', displayName: 'Location (Outline)', category: 'Status' },
  { name: 'location_on', displayName: 'Location (Filled)', category: 'Status' },
  { name: 'gps_fixed', displayName: 'GPS', category: 'Status' },
];

export const getIconsByCategory = () => {
  const categories: { [key: string]: ActionButtonIcon[] } = {};
  ACTION_BUTTON_ICONS.forEach(icon => {
    if (!categories[icon.category]) {
      categories[icon.category] = [];
    }
    categories[icon.category].push(icon);
  });
  return categories;
};

export const findIconByName = (name: string): ActionButtonIcon | undefined => {
  return ACTION_BUTTON_ICONS.find(icon => icon.name === name);
};
