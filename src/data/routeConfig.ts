export interface RouteInfo {
  value: string;
  label: string;
  description: string;
  category: string;
  requiresArgs?: boolean;
  defaultArgs?: Record<string, any>;
}

export const AVAILABLE_ROUTES: RouteInfo[] = [
  // Main Navigation Routes
  {
    value: "/product",
    label: "Produk",
    description: "Produk",
    category: "Navigasi Utama",
  },
  {
    value: "/webview",
    label: "WebView",
    description: "WebView",
    category: "Navigasi Utama",
  },
  {
    value: "/history",
    label: "History",
    description: "Riwayat Transaksi",
    category: "Navigasi Utama",
  },
  {
    value: "/mutasi",
    label: "Mutasi",
    description: "Mutasi/Transaksi Akun",
    category: "Navigasi Utama",
  },
  {
    value: "/profile_screen",
    label: "Profil",
    description: "Profil Pengguna",
    category: "Navigasi Utama",
  },
  {
    value: "/profile",
    label: "Profil",
    description: "Profil Pengguna (Alias)",
    category: "Navigasi Utama",
  },
  {
    value: "/downline_list",
    label: "List Downline",
    description: "Manajemen Downline",
    category: "Navigasi Utama",
  },
  {
    value: "/all_senders_screen",
    label: "Nomor Terdaftar",
    description: "Daftar Semua Pengirim",
    category: "Navigasi Utama",
  },

  // Settings & Configuration Routes
  {
    value: "/settings",
    label: "Pengaturan",
    description: "Pengaturan Aplikasi",
    category: "Pengaturan & Konfigurasi",
  },
  {
    value: "/settings_screen",
    label: "Pengaturan",
    description: "Pengaturan Aplikasi (Alias)",
    category: "Pengaturan & Konfigurasi",
  },
  {
    value: "/change_pin",
    label: "Ubah PIN",
    description: "Ubah PIN",
    category: "Pengaturan & Konfigurasi",
  },
  {
    value: "/deactivate_account",
    label: "Deaktivasi Akun",
    description: "Deaktivasi Akun",
    category: "Pengaturan & Konfigurasi",
  },
  {
    value: "/edit_user_info",
    label: "Edit Informasi Pengguna",
    description: "Edit Informasi Pengguna",
    category: "Pengaturan & Konfigurasi",
  },
  {
    value: "/jaringan",
    label: "Jaringan Downline",
    description: "Jaringan Downline",
    category: "Pengaturan & Konfigurasi",
  },

  // Help & Support Routes
  {
    value: "/kirim_masukkan",
    label: "Kirim Masukan",
    description: "Kirim Masukan",
    category: "Bantuan & Dukungan",
  },
  {
    value: "/pusat_bantuan",
    label: "Pusat Bantuan",
    description: "Pusat Bantuan",
    category: "Bantuan & Dukungan",
  },
  {
    value: "/tentang_aplikasi",
    label: "Tentang Aplikasi",
    description: "Tentang Aplikasi",
    category: "Bantuan & Dukungan",
  },
  {
    value: "/chat",
    label: "Customer Support",
    description: "Chat dengan Customer Support",
    category: "Bantuan & Dukungan",
  },

  // Special Routes
  {
    value: "/inbox_notification",
    label: "Kotak Masuk Notifikasi",
    description: "Kotak Masuk Notifikasi",
    category: "Rute Khusus",
  },
  {
    value: "/menu_deposit",
    label: "Menu Deposit",
    description: "Menu Deposit",
    category: "Rute Khusus",
  },
  {
    value: "/poin_exchange",
    label: "Penukaran Poin",
    description: "Penukaran Poin",
    category: "Rute Khusus",
  },
  {
    value: "/balance_transfer",
    label: "Transfer Saldo Antar Akun",
    description: "Transfer Saldo Antar Akun",
    category: "Rute Khusus",
  },
];

// Helper function to get routes by category
export const getRoutesByCategory = () => {
  const grouped: Record<string, RouteInfo[]> = {};
  AVAILABLE_ROUTES.forEach((route) => {
    if (!grouped[route.category]) {
      grouped[route.category] = [];
    }
    grouped[route.category].push(route);
  });
  return grouped;
};

// Helper function to find route by value
export const findRouteByValue = (value: string): RouteInfo | undefined => {
  return AVAILABLE_ROUTES.find((route) => route.value === value);
};

// Helper function to get default args for a route
export const getDefaultArgsForRoute = (
  routeValue: string,
): Record<string, any> | undefined => {
  const route = findRouteByValue(routeValue);
  return route?.defaultArgs;
};

// Helper function to check if route requires args
export const doesRouteRequireArgs = (routeValue: string): boolean => {
  const route = findRouteByValue(routeValue);
  return route?.requiresArgs || false;
};

// Helper function to get routes suitable for action buttons (excluding product and webview)
export const getActionButtonRoutes = () => {
  return AVAILABLE_ROUTES.filter(
    (route) => route.value !== "/product" && route.value !== "/webview",
  );
};

// Helper function to get action button routes by category
export const getActionButtonRoutesByCategory = () => {
  const grouped: Record<string, RouteInfo[]> = {};
  getActionButtonRoutes().forEach((route) => {
    if (!grouped[route.category]) {
      grouped[route.category] = [];
    }
    grouped[route.category].push(route);
  });
  return grouped;
};
