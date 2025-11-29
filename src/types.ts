export interface DynamicScreenConfig {
  globalTheming?: GlobalTheming;
  screens: Record<string, ScreenConfig>;
  navigation?: NavigationConfig;
}

export interface GlobalTheming {
  lightTheme?: ThemeColors;
  darkTheme?: ThemeColors;
  containerBorderRadius?: number;
  welcomePoster?: WelcomePoster;
}

export interface ThemeColors {
  surfaceColor?: string;
  gradiantButtonTailColor?: string;
  gradiantButtonDisabledColor?: string;
  gradiantButtonDisabledTextColor?: string;
  paragraphTextColor?: string;
}

export interface WelcomePoster {
  imageUrl: string;
  title?: string;
  padding?: Padding;
  borderRadius?: number;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
  clonedFromMenuId?: string; // ID of the menu item this welcome poster is cloned from
  autoDismissSeconds?: number;
}

export interface ScreenConfig {
  screen: string;
  balance_card?: boolean;
  balance_card_variant?: number;
  action_buttons?: ActionButton[];
  headerBackgroundUrl?: Record<string, HeaderBackground>;
  headerFade?: boolean;
  carouselHeight?: number;
  screenTitle?: string;
  content: ContentSection[];
}

export interface ActionButton {
  icon: string;
  route: string;
  type?: string;
  tooltip?: string;
  routeArgs?: RouteArgs;
}

export interface HeaderBackground {
  imageUrl: string;
  title?: string;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
}

export interface ContentSection {
  id: string; // Widget type identifier (e.g., "title", "banner_slider", "cards")
  instanceId: string; // Unique instance identifier for selection
  title?: TitleConfig;
  layoutVariant?: "default" | "monocle";
  height?: number;
  width?: number;
  spacing?: number;
  borderRadius?: number;
  backgroundColor?: string;
  autoSlide?: boolean;
  autoSlideInterval?: number;
  showIndicators?: boolean;
  showFade?: boolean;
  banners?: Banner[];
  cards?: Card[];
  items?: MenuItem[];
  url?: string;
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  showRefreshButton?: boolean;
  padding?: Padding;
  margin?: Margin;
  frame?: Frame; // Frame configuration for icon groups
  count?: number; // Number of items to display (for history widgets)
  // Cards specific properties
  layout?: "grid" | "list";
  crossAxisCount?: number;
  aspectRatio?: number;
}

export interface TitleConfig {
  text: string;
  type?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  display?: "left" | "center" | "right" | "justify";
  color?: string;
  darkModeColor?: string;
}

export interface MenuItem {
  id?: string; // Menu instance ID
  menu_id?: string; // Menu-specific identifier (e.g., menu_pulsa_123)
  iconUrl: string;
  title: string;
  route?: string;
  routeArgs?: RouteArgs;
  url?: string;
  textSize?: number;
  textColor?: string;
  submenu?: SubmenuConfig;
  submenuStyle?: "fullScreen" | "bottomSheet";
  submenuLayout?: "grid" | "list";
  submenuTitle?: string;
}

export interface SubmenuConfig {
  id: string;
  submenuTitle: string;
  submenuStyle: "fullScreen" | "bottomSheet";
  submenuLayout: "grid" | "list";
  items: MenuItem[];
}

export interface Card {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  borderRadius?: number;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
  buttons?: CardButton[];
  textElements?: CardTextElement[];
  clonedFromMenuId?: string; // ID of the menu item this card is cloned from
}

export interface CardButton {
  label: string;
  route: string;
  routeArgs?: Record<string, any>;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
}

export interface CardTextElement {
  type: 'profile_name' | 'balance' | 'commission' | 'label';
  text: string;
  textStyle?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
}

export interface Banner {
  imageUrl: string;
  title?: string;
  titleFontSize?: number;
  titlePosition?: TitlePosition;
  titleTextShadow?: boolean;
  titleTextShadowColor?: string;
  titleTextShadowOpacity?: number;
  padding?: Padding;
  borderRadius?: number;
  route?: string;
  routeArgs?: Record<string, any>;
  url?: string;
  clonedFromMenuId?: string; // ID of the menu item this banner is cloned from
}

export interface TitlePosition {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  center?: boolean;
}

export interface Padding {
  all?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface Margin {
  all?: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface BorderConfig {
  color: string;
  width: number;
}

export interface BoxShadowConfig {
  color: string;
  opacity: number;
  blurRadius: number;
  offsetX: number;
  offsetY: number;
}

export interface Frame {
  width?: number;
  height?: number;
  borderRadius?: number;
  borderLine?: boolean;
  shadow?: boolean;
  padding?: Padding;
}

export interface NavigationConfig {
  menuStyle: number;
  mainMenu: NavigationItem[];
  moreMenu: MoreMenu;
}

export interface NavigationItem {
  icon: string;
  label: string;
  dynamic?: string;
  screen?: string;
  route?: string;
  url?: string;
  routeArgs?: RouteArgs;
  active: boolean;
}

export interface MoreMenu {
  icon: string;
  label: string;
  active: boolean;
  items: NavigationItem[];
}

// Centralized Route Arguments Types
export interface RouteArgs {
  // Common properties
  url?: string;
  title?: string;
  headers?: Record<string, string>;
  includeAuth?: boolean;
  
  // WebView specific
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  webviewBelowButton?: WebViewBelowButtonConfig;
  
  // Product specific
  operators?: string[];
  hintText?: string;
  alphanumeric?: boolean;
  trailingNumbers?: boolean;
  hintLastDestination?: string;
  infoBox?: InfoBoxConfig;
  
  // Payment specific
  productKode?: string;
  operator?: string;
  destUrl?: string;
  
  // Source data
  _bannerData?: Record<string, any>;
  screenTitle?: string;
  __fromWebView?: boolean;
}

export interface InfoBoxConfig {
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface WebViewBelowButtonConfig {
  text: string;
  icon?: string;
  style?: 'gradient' | 'outlined';
  route: string;
  routeArgs?: Record<string, any>;
}

export interface WebViewRouteArgs extends RouteArgs {
  url: string;
  title?: string;
  headers?: Record<string, string>;
  includeAuth?: boolean;
  enableJavaScript?: boolean;
  enableScrolling?: boolean;
  webviewBelowButton?: WebViewBelowButtonConfig;
}

export interface ProductRouteArgs extends RouteArgs {
  operators?: string[];
  hintText?: string;
  alphanumeric?: boolean;
  trailingNumbers?: boolean;
  hintLastDestination?: string;
  infoBox?: InfoBoxConfig;
}

export interface WidgetType {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultConfig: Partial<ContentSection>;
}
