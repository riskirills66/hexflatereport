import {
  RouteArgs,
  WebViewRouteArgs,
  ProductRouteArgs,
  InfoBoxConfig,
} from "../types";

/**
 * Centralized route argument management utility
 * Provides consistent handling of route arguments across all frontend components
 */
export class RouteArgsManager {
  private static readonly BANNER_DATA_KEY = "_bannerData";
  private static readonly SCREEN_TITLE_KEY = "screenTitle";
  private static readonly ROUTE_CONFIG_KEY = "routeConfig";
  private static readonly FROM_WEBVIEW_KEY = "__fromWebView";

  /**
   * Creates standardized route arguments for navigation
   */
  static createRouteArgs({
    route,
    customArgs = {},
    sourceData,
    title,
    fromWebView = false,
  }: {
    route?: string;
    customArgs?: Partial<RouteArgs>;
    sourceData?: Record<string, any>;
    title?: string;
    fromWebView?: boolean;
  }): RouteArgs {
    const args: RouteArgs = { ...customArgs };

    // Add source data if provided
    if (sourceData) {
      args[this.BANNER_DATA_KEY] = sourceData;
    }

    // Add screen title if provided
    if (title) {
      args[this.SCREEN_TITLE_KEY] = title;
    }

    // Add WebView flag if applicable
    if (fromWebView) {
      args[this.FROM_WEBVIEW_KEY] = true;
    }

    return args;
  }

  /**
   * Creates WebView-specific arguments
   */
  static createWebViewArgs({
    url,
    title,
    headers,
    includeAuth = false,
    enableJavaScript = true,
    enableScrolling = true,
    sourceData,
    webviewBelowButton,
  }: {
    url: string;
    title?: string;
    headers?: Record<string, string>;
    includeAuth?: boolean;
    enableJavaScript?: boolean;
    enableScrolling?: boolean;
    sourceData?: Record<string, any>;
    webviewBelowButton?: any;
  }): WebViewRouteArgs {
    const args: WebViewRouteArgs = {
      url,
      title: title || "WebView",
      enableJavaScript,
      enableScrolling,
    };

    if (headers) {
      args.headers = headers;
    }

    if (includeAuth) {
      args.includeAuth = true;
    }

    if (sourceData) {
      args[this.BANNER_DATA_KEY] = sourceData;
    }

    if (webviewBelowButton) {
      args.webviewBelowButton = webviewBelowButton;
    }

    // Add route configuration for destination extraction
    args[this.ROUTE_CONFIG_KEY] = { routeArgs: { url } };

    return args;
  }

  /**
   * Creates product-specific arguments
   */
  static createProductArgs({
    operators,
    hintText,
    alphanumeric = false,
    trailingNumbers = false,
    hintLastDestination,
    infoBox,
    sourceData,
  }: {
    operators?: string[];
    hintText?: string;
    alphanumeric?: boolean;
    trailingNumbers?: boolean;
    hintLastDestination?: string;
    infoBox?: InfoBoxConfig;
    sourceData?: Record<string, any>;
  }): ProductRouteArgs {
    const args: ProductRouteArgs = {};

    if (operators && operators.length > 0) {
      args.operators = operators;
    }

    if (hintText) {
      args.hintText = hintText;
    }

    if (alphanumeric) {
      args.alphanumeric = true;
    }

    if (trailingNumbers) {
      args.trailingNumbers = true;
    }

    if (hintLastDestination) {
      args.hintLastDestination = hintLastDestination;
    }

    if (infoBox) {
      args.infoBox = infoBox;
    }

    if (sourceData) {
      args[this.BANNER_DATA_KEY] = sourceData;
    }

    return args;
  }

  /**
   * Normalizes route arguments from any source
   */
  static normalizeRouteArgs(
    rawArgs: Record<string, any> | undefined,
  ): RouteArgs {
    if (!rawArgs) return {};

    const normalized: RouteArgs = {};

    // Copy all valid arguments
    for (const [key, value] of Object.entries(rawArgs)) {
      // Skip null values
      if (value == null) continue;

      // Handle special cases
      switch (key) {
        case "url":
          if (typeof value === "string" && value.length > 0) {
            normalized.url = value;
          }
          break;
        case "title":
          if (typeof value === "string" && value.length > 0) {
            normalized.title = value;
          }
          break;
        case "headers":
          if (typeof value === "object" && value !== null) {
            normalized.headers = value as Record<string, string>;
          }
          break;
        case "includeAuth":
          if (typeof value === "boolean") {
            normalized.includeAuth = value;
          }
          break;
        case "operators":
          if (Array.isArray(value)) {
            normalized.operators = value as string[];
          }
          break;
        case "hintText":
          if (typeof value === "string" && value.length > 0) {
            normalized.hintText = value;
          }
          break;
        case "alphanumeric":
          if (typeof value === "boolean") {
            normalized.alphanumeric = value;
          }
          break;
        case "trailingNumbers":
          if (typeof value === "boolean") {
            normalized.trailingNumbers = value;
          }
          break;
        case "hintLastDestination":
          if (typeof value === "string" && value.length > 0) {
            normalized.hintLastDestination = value;
          }
          break;
        case "infoBox":
          if (typeof value === "object" && value !== null) {
            normalized.infoBox = value as InfoBoxConfig;
          }
          break;
        case "productKode":
          if (typeof value === "string" && value.length > 0) {
            normalized.productKode = value;
          }
          break;
        case "operator":
          if (typeof value === "string" && value.length > 0) {
            normalized.operator = value;
          }
          break;
        case "destUrl":
          if (typeof value === "string" && value.length > 0) {
            normalized.destUrl = value;
          }
          break;
        case "webviewBelowButton":
          if (typeof value === "object" && value !== null) {
            normalized.webviewBelowButton = value as any;
          }
          break;
        default:
          // Preserve other arguments as-is
          (normalized as any)[key] = value;
      }
    }

    return normalized;
  }

  /**
   * Validates route arguments for a specific route
   */
  static validateRouteArgs(
    route: string,
    args: RouteArgs | undefined,
  ): boolean {
    if (!args) return true;

    switch (route) {
      case "/webview":
        return this.validateWebViewArgs(args);
      case "/product":
        return this.validateProductArgs(args);
      default:
        return true; // Other routes don't have specific validation
    }
  }

  /**
   * Validates WebView arguments
   */
  private static validateWebViewArgs(args: RouteArgs): boolean {
    return typeof args.url === "string" && args.url.length > 0;
  }

  /**
   * Validates product arguments
   */
  private static validateProductArgs(args: RouteArgs): boolean {
    // Product route doesn't require specific validation
    return true;
  }

  /**
   * Extracts source data from route arguments
   */
  static getSourceData(
    args: RouteArgs | undefined,
  ): Record<string, any> | undefined {
    return args?.[this.BANNER_DATA_KEY] as Record<string, any> | undefined;
  }

  /**
   * Extracts screen title from route arguments
   */
  static getScreenTitle(args: RouteArgs | undefined): string | undefined {
    return args?.[this.SCREEN_TITLE_KEY] as string | undefined;
  }

  /**
   * Checks if navigation originated from WebView
   */
  static isFromWebView(args: RouteArgs | undefined): boolean {
    return args?.[this.FROM_WEBVIEW_KEY] === true;
  }

  /**
   * Creates enhanced arguments for navigation
   */
  static createEnhancedArgs({
    baseArgs,
    sourceData,
    title,
    fromWebView = false,
  }: {
    baseArgs: RouteArgs;
    sourceData?: Record<string, any>;
    title?: string;
    fromWebView?: boolean;
  }): RouteArgs {
    const enhanced: RouteArgs = { ...baseArgs };

    if (sourceData) {
      enhanced[this.BANNER_DATA_KEY] = sourceData;
    }

    if (title) {
      enhanced[this.SCREEN_TITLE_KEY] = title;
    }

    if (fromWebView) {
      enhanced[this.FROM_WEBVIEW_KEY] = true;
    }

    return enhanced;
  }

  /**
   * Gets default arguments for a specific route
   */
  static getDefaultArgsForRoute(route: string): Partial<RouteArgs> {
    switch (route) {
      case "/webview":
        return {
          enableJavaScript: true,
          enableScrolling: true,
          includeAuth: false,
        };
      case "/product":
        return {
          operators: ["TSELREG"],
          hintText: "Nomor HP Pelanggan",
          alphanumeric: false,
          trailingNumbers: false,
        };
      case "/history":
        return {
          screenTitle: "Riwayat Transaksi",
        };
      case "/mutasi":
        return {
          screenTitle: "Mutasi Akun",
        };
      case "/profile_screen":
      case "/profile":
        return {
          screenTitle: "Profil Pengguna",
        };
      case "/settings":
      case "/settings_screen":
        return {
          screenTitle: "Pengaturan",
        };
      case "/pusat_bantuan":
        return {
          screenTitle: "Pusat Bantuan",
        };
      case "/tentang_aplikasi":
        return {
          screenTitle: "Tentang Aplikasi",
        };
      case "/poin_exchange":
        return {
          screenTitle: "Penukaran Poin",
        };
      case "/balance_transfer":
        return {
          screenTitle: "Transfer Saldo",
        };
      case "/downline_list":
        return {
          screenTitle: "Daftar Downline",
        };
      case "/all_senders_screen":
        return {
          screenTitle: "Nomor Terdaftar",
        };
      case "/inbox_notification":
        return {
          screenTitle: "Notifikasi",
        };
      case "/menu_deposit":
        return {
          screenTitle: "Menu Deposit",
        };
      case "/change_pin":
        return {
          screenTitle: "Ubah PIN",
        };
      case "/deactivate_account":
        return {
          screenTitle: "Deaktivasi Akun",
        };
      case "/edit_user_info":
        return {
          screenTitle: "Edit Profil",
        };
      case "/jaringan":
        return {
          screenTitle: "Jaringan Downline",
        };
      case "/kirim_masukkan":
        return {
          screenTitle: "Kirim Masukan",
        };
      default:
        return {};
    }
  }

  /**
   * Creates navigation configuration for different UI elements
   */
  static createNavigationConfig({
    route,
    url,
    title,
    sourceData,
    fromWebView = false,
    customArgs = {},
  }: {
    route?: string;
    url?: string;
    title?: string;
    sourceData?: Record<string, any>;
    fromWebView?: boolean;
    customArgs?: Partial<RouteArgs>;
  }): { route?: string; url?: string; routeArgs?: RouteArgs } {
    if (url) {
      // External URL navigation
      const webViewArgs = this.createWebViewArgs({
        url,
        title: title || "WebView",
        sourceData,
      });
      return {
        url,
        routeArgs: webViewArgs,
      };
    } else if (route) {
      // Internal route navigation
      const defaultArgs = this.getDefaultArgsForRoute(route);
      const routeArgs = this.createRouteArgs({
        route,
        customArgs: { ...defaultArgs, ...customArgs },
        sourceData,
        title: title || defaultArgs.screenTitle,
        fromWebView,
      });
      return {
        route,
        routeArgs,
      };
    }

    return {};
  }

  /**
   * Validates navigation configuration
   */
  static validateNavigationConfig(config: {
    route?: string;
    url?: string;
    routeArgs?: RouteArgs;
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.route && !config.url) {
      errors.push("Either route or url must be specified");
    }

    if (config.route && config.url) {
      errors.push("Cannot specify both route and url");
    }

    // Validate internal routes
    if (config.route && config.routeArgs) {
      const isValid = this.validateRouteArgs(config.route, config.routeArgs);
      if (!isValid) {
        errors.push(`Invalid route arguments for route: ${config.route}`);
      }
    }

    // External URLs should not have route arguments
    if (config.url && config.routeArgs) {
      errors.push("External URLs should not have route arguments");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Route argument constants
 */
export const RouteArgsConstants = {
  BANNER_DATA_KEY: "_bannerData",
  SCREEN_TITLE_KEY: "screenTitle",
  ROUTE_CONFIG_KEY: "routeConfig",
  FROM_WEBVIEW_KEY: "__fromWebView",

  // WebView specific keys
  WEBVIEW_URL_KEY: "url",
  WEBVIEW_TITLE_KEY: "title",
  WEBVIEW_HEADERS_KEY: "headers",
  WEBVIEW_INCLUDE_AUTH_KEY: "includeAuth",
  WEBVIEW_ENABLE_JAVASCRIPT_KEY: "enableJavaScript",
  WEBVIEW_ENABLE_SCROLLING_KEY: "enableScrolling",

  // Product specific keys
  PRODUCT_OPERATORS_KEY: "operators",
  PRODUCT_HINT_TEXT_KEY: "hintText",
  PRODUCT_ALPHANUMERIC_KEY: "alphanumeric",
  PRODUCT_TRAILING_NUMBERS_KEY: "trailingNumbers",
  PRODUCT_HINT_LAST_DESTINATION_KEY: "hintLastDestination",
  PRODUCT_INFO_BOX_KEY: "infoBox",

  // Payment specific keys
  PAYMENT_PRODUCT_KODE_KEY: "productKode",
  PAYMENT_OPERATOR_KEY: "operator",
  PAYMENT_DEST_URL_KEY: "destUrl",
} as const;
