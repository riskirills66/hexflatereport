import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Settings,
  User,
  BarChart3,
  Shield,
  Activity,
  LogOut,
  Menu,
  X,
  Home,
  Palette,
  Megaphone,
  Upload,
  Download,
  Store,
  MessageSquare,
  Tag,
  CreditCard,
  FileCheck,
  FileText,
  Terminal,
  RocketIcon,
  ChevronDown,
  RefreshCw,
  XCircle,
  Eye,
  EyeOff,
  Filter,
  Save,
  ArrowLeft,
  FilePlus,
} from "lucide-react";
import { DynamicScreenConfig } from "../types";
import { SAMPLE_CONFIG } from "../data/sampleConfig";
import EditorLayout from "./EditorLayout";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";
import MemberManagement, { MemberManagementRef } from "./MemberManagement";
import TransactionManagement, { TransactionManagementRef } from "./TransactionManagement";
import AnalyticsDashboard, { AnalyticsDashboardRef } from "./AnalyticsDashboard";
import SystemLogs, { SystemLogsRef } from "./SystemLogs";
import SystemSettings, { SystemSettingsRef } from "./SystemSettings";
import PrivacyPolicyEditor from "./PrivacyPolicyEditor";
import FeedbackViewer, { FeedbackViewerRef } from "./FeedbackViewer";
import SecurityManagement from "./SecurityManagement";
import HadiahManagement, { HadiahManagementRef } from "./HadiahManagement";
import PromoManagement, { PromoManagementRef } from "./PromoManagement";
import BroadcastCenter, { BroadcastCenterRef } from "./BroadcastCenter";
import AssetsManager from "./AssetsManager";
import MarkdownEditor, { MarkdownEditorRef } from "./MarkdownEditor";
import ReleasePrep from "./ReleasePrep";
import ChatManagement, { ChatManagementRef } from "./ChatManagement";
import SessionManager, { SessionManagerRef } from "./SessionManager";
import { formatJSONForExport, formatJSONForAPI } from "../utils/jsonFormatter";
import { preloadMembers } from "../utils/memberCache";

interface AdminDashboardProps {
  authSeed: string;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  component?: React.ReactNode;
}

//

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
}

interface MenuDistro {
  filename: string;
  name: string;
  path: string;
}

interface DistrosResponse {
  distros: MenuDistro[];
  success: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authSeed,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [gridCols, setGridCols] = useState(
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  );
  const statsGridRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<DynamicScreenConfig>(SAMPLE_CONFIG);
  const [selectedScreen, setSelectedScreen] = useState<string>("home");
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentAdminInfo, setCurrentAdminInfo] =
    useState<CurrentAdminInfo | null>(null);

  // Menu selection state
  const [availableMenus, setAvailableMenus] = useState<MenuDistro[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>("home_screen");
  const [isLoadingMenus, setIsLoadingMenus] = useState(false);

  // Upload functionality
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assets refresh trigger
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);

  // Unified save state for security management
  const [isSavingAll, setIsSavingAll] = useState(false);
  const securityManagementRef = useRef<any>(null);

  // Unified save state for system settings
  const [isSavingSystemSettings, setIsSavingSystemSettings] = useState(false);
  const systemSettingsRef = useRef<SystemSettingsRef>(null);

  // Unified save state for hadiah management
  const [isSavingHadiah, setIsSavingHadiah] = useState(false);
  const hadiahManagementRef = useRef<HadiahManagementRef>(null);

  // Unified save state for promo management
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const promoManagementRef = useRef<PromoManagementRef>(null);

  // Broadcast center ref
  const broadcastCenterRef = useRef<BroadcastCenterRef>(null);
  const [canSendBroadcast, setCanSendBroadcast] = useState(false);
  const [isBroadcastSending, setIsBroadcastSending] = useState(false);

  // Member management ref
  const memberManagementRef = useRef<MemberManagementRef>(null);
  const [memberStats, setMemberStats] = useState<{ total: number; loaded: number } | null>(null);

  // Transaction management ref
  const transactionManagementRef = useRef<TransactionManagementRef>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<{
    total_today: number;
    success_count: number;
    process_count: number;
    failed_count: number;
  } | null>(null);

  // Chat management ref
  const chatManagementRef = useRef<ChatManagementRef>(null);
  const [chatConversation, setChatConversation] = useState<{
    user_name: string;
    user_id: string;
    status: string;
    resolved: number;
  } | null>(null);
  const [chatConnectionStatus, setChatConnectionStatus] = useState<string>("disconnected");

  // Analytics dashboard ref
  const analyticsDashboardRef = useRef<AnalyticsDashboardRef>(null);

  // Dashboard overview ref
  const dashboardOverviewRef = useRef<{ refresh: () => void } | null>(null);

  // Session manager ref
  const sessionManagerRef = useRef<SessionManagerRef>(null);
  const [sessionStats, setSessionStats] = useState<{ total: number; displayed: number } | null>(null);

  // Hadiah management stats
  const [hadiahStats, setHadiahStats] = useState<{ total: number } | null>(null);

  // Promo management stats
  const [promoStats, setPromoStats] = useState<{ total: number } | null>(null);

  // Feedback viewer ref
  const feedbackViewerRef = useRef<FeedbackViewerRef>(null);
  const [feedbackStats, setFeedbackStats] = useState<{ total: number } | null>(null);

  // System logs ref
  const systemLogsRef = useRef<SystemLogsRef>(null);
  const [systemLogsStats, setSystemLogsStats] = useState<{ total: number } | null>(null);

  // Markdown editor ref
  const markdownEditorRef = useRef<MarkdownEditorRef>(null);
  const [markdownCurrentFile, setMarkdownCurrentFile] = useState<{ filename: string } | null>(null);

  // Chat license status
  const [chatLicenseStatus, setChatLicenseStatus] = useState<{
    is_licensed: boolean;
    server_name: string;
  } | null>(null);
  const [chatLicenseLoading, setChatLicenseLoading] = useState(true);

  // Handle broadcast state changes
  const handleBroadcastStateChange = (canSend: boolean, isSending: boolean) => {
    setCanSendBroadcast(canSend);
    setIsBroadcastSending(isSending);
  };

  // Load chat license status from existing license status API
  const loadChatLicenseStatus = async () => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        setChatLicenseLoading(false);
        return;
      }

      const apiUrl = await getApiUrl("/admin/license-status");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();
      if (data.success && data.license_status) {
        setChatLicenseStatus({
          is_licensed: data.license_status.chat_management_licensed || false,
          server_name: "server"
        });
      }
    } catch (error) {
      console.error("Failed to load chat license status:", error);
    } finally {
      setChatLicenseLoading(false);
    }
  };

  useEffect(() => {
    loadConfigFromBackend();
    fetchCurrentAdminInfo();
    loadAvailableMenus();
    loadChatLicenseStatus();
    // Preload member data for cache-first pattern
    preloadMembers(authSeed, {
      searchTerm: '',
      statusFilter: 'all',
      levelFilter: '',
      verificationFilter: 'all',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically refresh license status to check for real-time changes
  useEffect(() => {
    const interval = setInterval(() => {
      loadChatLicenseStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Re-render when license status changes
  useEffect(() => {
    // This will trigger a re-render when chatLicenseStatus changes
  }, [chatLicenseStatus]);

  // Reset member stats when switching away from users section
  useEffect(() => {
    if (activeSection !== "users") {
      setMemberStats(null);
    }
  }, [activeSection]);

  // Reset transaction analytics when switching away from transactions section
  useEffect(() => {
    if (activeSection !== "transactions") {
      setTransactionAnalytics(null);
    }
  }, [activeSection]);

  // Reset chat conversation when switching away from chat section
  useEffect(() => {
    if (activeSection !== "chat") {
      setChatConversation(null);
      setChatConnectionStatus("disconnected");
    }
  }, [activeSection]);

  // Reset session stats when switching away from session-manager section
  useEffect(() => {
    if (activeSection !== "session-manager") {
      setSessionStats(null);
    }
  }, [activeSection]);

  // Reset hadiah stats when switching away from hadiah section
  useEffect(() => {
    if (activeSection !== "hadiah") {
      setHadiahStats(null);
    }
  }, [activeSection]);

  // Reset promo stats when switching away from promo section
  useEffect(() => {
    if (activeSection !== "promo") {
      setPromoStats(null);
    }
  }, [activeSection]);

  // Reset feedback stats when switching away from feedback-viewer section
  useEffect(() => {
    if (activeSection !== "feedback-viewer") {
      setFeedbackStats(null);
    }
  }, [activeSection]);

  // Reset system logs stats when switching away from logs section
  useEffect(() => {
    if (activeSection !== "logs") {
      setSystemLogsStats(null);
    }
  }, [activeSection]);

  // Track markdown editor current file
  useEffect(() => {
    if (activeSection === "markdown-editor" && markdownEditorRef.current) {
      const interval = setInterval(() => {
        const currentFile = markdownEditorRef.current?.currentFile;
        setMarkdownCurrentFile(currentFile ? { filename: currentFile.filename } : null);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMarkdownCurrentFile(null);
    }
  }, [activeSection]);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Auto-hide sidebar on mobile
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Dynamic grid detection based on available space
  useEffect(() => {
    const updateGridCols = () => {
      const width = window.innerWidth;
      const sidebarWidth = sidebarOpen ? 256 : 64; // w-64 or w-16
      const availableWidth = width - sidebarWidth - 64; // Account for padding
      const cardMinWidth = 320; // Minimum width for a card to display properly without overflow

      if (width < 640) {
        setGridCols("grid-cols-1");
      } else if (width < 1024) {
        setGridCols("grid-cols-1 sm:grid-cols-2");
      } else if (availableWidth < cardMinWidth * 4 + 96) {
        // 4 cards + gaps (24px * 4)
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      } else if (availableWidth < cardMinWidth * 3 + 72) {
        // 3 cards + gaps
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      } else {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-4");
      }
    };

    // Add a small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateGridCols, 100);
    window.addEventListener("resize", updateGridCols);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateGridCols);
    };
  }, [sidebarOpen]);

  // Additional overflow detection after grid is rendered
  useEffect(() => {
    const checkForOverflow = () => {
      if (!statsGridRef.current) return;

      const cards = statsGridRef.current.querySelectorAll("[data-card]");
      let hasOverflow = false;

      cards.forEach((card) => {
        const textElements = card.querySelectorAll("p");
        textElements.forEach((textEl) => {
          if (textEl.scrollWidth > textEl.clientWidth) {
            hasOverflow = true;
          }
        });
      });

      if (hasOverflow && gridCols.includes("grid-cols-4")) {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      }
    };

    const timeoutId = setTimeout(checkForOverflow, 300);
    return () => clearTimeout(timeoutId);
  }, [gridCols]);

  // Force 2 columns for very long text content
  useEffect(() => {
    const forceTwoColumns = () => {
      const width = window.innerWidth;
      const sidebarWidth = sidebarOpen ? 256 : 64;
      const availableWidth = width - sidebarWidth - 64;

      // Force 2 columns if available width is less than 1400px (4 * 320px + gaps)
      if (availableWidth < 1400 && gridCols.includes("grid-cols-4")) {
        setGridCols("grid-cols-1 sm:grid-cols-2 lg:grid-cols-2");
      }
    };

    const timeoutId = setTimeout(forceTwoColumns, 100);
    return () => clearTimeout(timeoutId);
  }, [sidebarOpen, gridCols]);

  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl("/current-admin-info");
      const response = await fetch(apiUrl, {
        headers: {
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
      });

      const data: CurrentAdminInfo = await response.json();

      if (response.ok) {
        setCurrentAdminInfo(data);
      } else {
        console.error("Failed to fetch current admin info:", data);
      }
    } catch (error) {
      console.error("Failed to fetch current admin info:", error);
    }
  };

  const loadAvailableMenus = async () => {
    setIsLoadingMenus(true);
    try {
      const apiUrl = await getApiUrl("/homescreen/distros");
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
      });

      const data: DistrosResponse = await response.json();

      if (data.success && data.distros) {
        // Add main home screen as the first option
        const mainHomeScreen: MenuDistro = {
          filename: "main_home_screen.json",
          name: "Aplikasi Utama",
          path: "main_home_screen.json",
        };

        const menusWithMain = [mainHomeScreen, ...data.distros];
        setAvailableMenus(menusWithMain);
        setSelectedMenu("Aplikasi Utama");
      } else {
        // Even if API fails, show main home screen option
        const mainHomeScreen: MenuDistro = {
          filename: "main_home_screen.json",
          name: "Aplikasi Utama",
          path: "main_home_screen.json",
        };
        setAvailableMenus([mainHomeScreen]);
        setSelectedMenu("Aplikasi Utama");
      }
    } catch (err) {
      console.error("Failed to load available menus:", err);
      // Even on error, show main home screen option
      const mainHomeScreen: MenuDistro = {
        filename: "main_home_screen.json",
        name: "Aplikasi Utama",
        path: "main_home_screen.json",
      };
      setAvailableMenus([mainHomeScreen]);
      setSelectedMenu("Aplikasi Utama");
    } finally {
      setIsLoadingMenus(false);
    }
  };

  const loadConfigFromBackend = async (menuName?: string) => {
    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      let apiUrl;

      if (menuName && menuName !== "Aplikasi Utama") {
        // Load specific distro menu
        apiUrl = await getApiUrl(`/homescreen/${menuName}`);
      } else {
        // Load main home screen
        apiUrl = await getApiUrl("/homescreen");
      }

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
      });

      const data = await response.json();

      // Both homescreen endpoints return raw JSON config
      setConfig(data);
      if (data.screens && Object.keys(data.screens).length > 0) {
        setSelectedScreen(Object.keys(data.screens)[0]);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);

        // Ensure all widgets have unique instanceId values
        const processedConfig = { ...importedConfig };
        if (processedConfig.screens) {
          Object.keys(processedConfig.screens).forEach((screenName) => {
            const screen = processedConfig.screens[screenName];
            if (screen.content) {
              screen.content.forEach((widget: any, index: number) => {
                // Generate unique instanceId if missing or duplicate
                if (
                  !widget.instanceId ||
                  widget.instanceId === "banner_slider_1"
                ) {
                  widget.instanceId = `${widget.id}_${Date.now()}_${index}`;
                }
              });
            }
          });
        }

        setConfig(processedConfig);
      } catch (error) {
        alert("File JSON tidak valid. Silakan periksa formatnya.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const dataStr = formatJSONForExport(config);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "menu_config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        return;
      }

      let apiUrl;
      let requestBody = {};
      let method = "POST";

      if (selectedMenu && selectedMenu !== "Aplikasi Utama") {
        // Save specific distro menu - send raw config
        apiUrl = await getApiUrl(`/homescreen/save/${selectedMenu}`);
        requestBody = config;
        method = "PUT";
      } else {
        // Save main home screen - wrap in config field
        apiUrl = await getApiUrl("/config/publish");
        requestBody = { config: config };
        method = "POST";
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
          "Session-Key": sessionKey,
          "Auth-Seed": authSeed,
        },
        body: formatJSONForAPI(requestBody),
      });

      const data: PublishResponse = await response.json();

      if (data.success) {
        console.log(
          `Config published successfully for menu: ${selectedMenu || "Aplikasi Utama"}!`,
        );
      } else {
        console.log(data.message || "Failed to publish config");
      }
    } catch (err) {
      console.error("Failed to publish config:", err);
      console.log("Failed to publish config");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConfigChange = (newConfig: DynamicScreenConfig) => {
    setConfig(newConfig);
  };

  // Upload functionality
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(files);
      // Automatically start upload
      await handleUpload(files);
    }
  };

  const handleUpload = async (files?: File[]) => {
    const filesToUpload = files || selectedFiles;
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const sessionKey = localStorage.getItem("adminSessionKey");
      if (!sessionKey) {
        console.log("Session key not found. Please login again.");
        return;
      }

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("session_key", sessionKey);
        formData.append("auth_seed", authSeed);
        formData.append("file", file);

        const apiUrl = await getApiUrl("/admin/assets/upload");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "X-Token": X_TOKEN_VALUE,
          },
          body: formData,
        });

        const data = await response.json();
        if (!data.success) {
          console.error("Upload failed:", data.message);
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      }

      // Clear selected files and reset
      setSelectedFiles([]);
      setUploadProgress(0);

      // Trigger refresh in AssetsManager if it's active
      if (activeSection === "assets") {
        setAssetsRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Unified save function for security management
  const handleSaveAllConfigurations = async () => {
    console.log("Save button clicked!");
    console.log(
      "securityManagementRef.current:",
      securityManagementRef.current,
    );

    if (!securityManagementRef.current?.saveAllConfigurations) {
      console.log("No save function available");
      return;
    }

    setIsSavingAll(true);
    try {
      await securityManagementRef.current.saveAllConfigurations();
    } catch (error) {
      console.error("Failed to save configurations:", error);
    } finally {
      setIsSavingAll(false);
    }
  };

  // Unified save function for system settings
  const handleSaveAllSystemSettings = async () => {
    console.log("System settings save button clicked!");
    console.log("systemSettingsRef.current:", systemSettingsRef.current);

    if (!systemSettingsRef.current?.saveAllConfigurations) {
      console.log("No system settings save function available");
      return;
    }

    setIsSavingSystemSettings(true);
    try {
      await systemSettingsRef.current.saveAllConfigurations();
    } catch (error) {
      console.error("Failed to save system settings configurations:", error);
    } finally {
      setIsSavingSystemSettings(false);
    }
  };

  // Unified save function for hadiah management
  const handleSaveAllHadiah = async () => {
    console.log("Hadiah management save button clicked!");
    console.log("hadiahManagementRef.current:", hadiahManagementRef.current);

    if (!hadiahManagementRef.current?.saveAllConfigurations) {
      console.log("No hadiah management save function available");
      return;
    }

    setIsSavingHadiah(true);
    try {
      await hadiahManagementRef.current.saveAllConfigurations();
    } catch (error) {
      console.error("Failed to save hadiah configurations:", error);
    } finally {
      setIsSavingHadiah(false);
    }
  };

  // Unified save function for promo management
  const handleSaveAllPromo = async () => {
    console.log("Promo management save button clicked!");
    console.log("promoManagementRef.current:", promoManagementRef.current);

    if (!promoManagementRef.current?.saveAllConfigurations) {
      console.log("No promo management save function available");
      return;
    }

    setIsSavingPromo(true);
    try {
      await promoManagementRef.current.saveAllConfigurations();
    } catch (error) {
      console.error("Failed to save promo configurations:", error);
    } finally {
      setIsSavingPromo(false);
    }
  };

  // Create menu items dynamically based on license status
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dasbor",
      icon: <Home className="h-5 w-5" />,
      description: "Ringkasan dan statistik",
      component: (
        <DashboardOverview
          authSeed={authSeed}
          onNavigate={setActiveSection}
          gridCols={gridCols}
          statsGridRef={statsGridRef}
          ref={dashboardOverviewRef}
        />
      ),
    },
    {
      id: "menu-editor",
      label: "Editor Menu",
      icon: <Palette className="h-5 w-5" />,
      description: "Edit menu dan tata letak aplikasi",
      component: (
        <EditorLayout
          config={config}
          selectedScreen={selectedScreen}
          onConfigChange={handleConfigChange}
          onScreenChange={(name) => setSelectedScreen(name)}
          onImportJSON={handleImportJSON}
          onExportJSON={handleExportJSON}
        />
      ),
    },
    {
      id: "users",
      label: "Manajemen Member",
      icon: <User className="h-5 w-5" />,
      description: "Kelola member dan data mereka",
      component: (
        <MemberManagement
          authSeed={authSeed}
          ref={memberManagementRef}
          onStatsChange={(total, loaded) => setMemberStats({ total, loaded })}
        />
      ),
    },
    {
      id: "transactions",
      label: "Transaksi",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Lihat dan kelola transaksi",
      component: (
        <TransactionManagement
          authSeed={authSeed}
          ref={transactionManagementRef}
          onAnalyticsChange={(analytics) => {
            if (analytics) {
              setTransactionAnalytics({
                total_today: analytics.total_today,
                success_count: analytics.success_count,
                process_count: analytics.process_count,
                failed_count: analytics.failed_count,
              });
            } else {
              setTransactionAnalytics(null);
            }
          }}
        />
      ),
    },
    {
      id: "notifications",
      label: "Broadcast",
      icon: <Megaphone className="h-5 w-5" />,
      description: "Kirim notifikasi push ke reseller",
      component: (
        <BroadcastCenter
          ref={broadcastCenterRef}
          authSeed={authSeed}
          onStateChange={handleBroadcastStateChange}
        />
      ),
    },
    // Only show chat management if licensed
    ...(chatLicenseStatus?.is_licensed
      ? [
          {
            id: "chat",
            label: "Customer Support",
            icon: <MessageSquare className="h-5 w-5" />,
            description: "Kelola percakapan dengan pelanggan",
            component: (
              <ChatManagement
                authSeed={authSeed}
                ref={chatManagementRef}
                onConversationChange={(conversation) => {
                  if (conversation) {
                    setChatConversation({
                      user_name: conversation.user_name,
                      user_id: conversation.user_id,
                      status: conversation.status,
                      resolved: conversation.resolved,
                    });
                  } else {
                    setChatConversation(null);
                  }
                }}
                onConnectionStatusChange={(status) => setChatConnectionStatus(status)}
              />
            ),
          },
        ]
      : []),
    {
      id: "analytics",
      label: "Analitik",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Lihat analitik dan laporan aplikasi",
      component: <AnalyticsDashboard authSeed={authSeed} ref={analyticsDashboardRef} />,
    },
    {
      id: "session-manager",
      label: "Manajemen Sesi",
      icon: <Activity className="h-5 w-5" />,
      description: "Kelola semua sesi pengguna",
      component: (
        <SessionManager
          authSeed={authSeed}
          ref={sessionManagerRef}
          onStatsChange={(total, displayed) => setSessionStats({ total, displayed })}
        />
      ),
    },
    {
      id: "system",
      label: "Pengaturan Aplikasi",
      icon: <Settings className="h-5 w-5" />,
      description: "Konfigurasi pengaturan aplikasi",
      component: <SystemSettings authSeed={authSeed} ref={systemSettingsRef} />,
    },
    {
      id: "hadiah",
      label: "Manajemen Hadiah",
      icon: <Store className="h-5 w-5" />,
      description: "Kelola daftar hadiah",
      component: (
        <HadiahManagement
          authSeed={authSeed}
          ref={hadiahManagementRef}
          onStatsChange={(total) => setHadiahStats({ total })}
        />
      ),
    },
    {
      id: "promo",
      label: "Manajemen Promo",
      icon: <Tag className="h-5 w-5" />,
      description: "Kelola daftar promo dan diskon",
      component: (
        <PromoManagement
          authSeed={authSeed}
          ref={promoManagementRef}
          onStatsChange={(total) => setPromoStats({ total })}
        />
      ),
    },
    {
      id: "assets",
      label: "Assets Manager",
      icon: <Upload className="h-5 w-5" />,
      description: "Upload dan kelola file untuk aplikasi",
      component: (
        <AssetsManager
          authSeed={authSeed}
          refreshTrigger={assetsRefreshTrigger}
        />
      ),
    },
    {
      id: "markdown-editor",
      label: "Kelola Konten",
      icon: <FileText className="h-5 w-5" />,
      description: "Edit dan kelola file markdown",
      component: (
        <MarkdownEditor 
          authSeed={authSeed} 
          onNavigate={setActiveSection}
          ref={markdownEditorRef}
        />
      ),
    },
    {
      id: "release-prep",
      label: "Release Prep",
      icon: <RocketIcon className="h-5 w-5" />,
      description: "Panduan rilis & dependensi yang dibutuhkan",
      component: <ReleasePrep />,
    },
    {
      id: "privacy-policy",
      label: "Editor Privacy Policy",
      icon: <FileCheck className="h-5 w-5" />,
      description: "Edit privacy policy dalam format Markdown",
      component: (
        <PrivacyPolicyEditor
          authSeed={authSeed}
          onNavigate={setActiveSection}
        />
      ),
    },
    {
      id: "feedback-viewer",
      label: "Feedback",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Lihat dan kelola feedback dari pengguna",
      component: (
        <FeedbackViewer
          authSeed={authSeed}
          onNavigate={setActiveSection}
          ref={feedbackViewerRef}
          onStatsChange={(total) => setFeedbackStats({ total })}
        />
      ),
    },
    {
      id: "logs",
      label: "Log Sistem",
      icon: <Terminal className="h-5 w-5" />,
      description: "Lihat log dan kesalahan sistem",
      component: (
        <SystemLogs
          authSeed={authSeed}
          ref={systemLogsRef}
          onStatsChange={(total) => setSystemLogsStats({ total })}
        />
      ),
    },
    // Only show security menu for super admins
    ...(currentAdminInfo?.is_super_admin
      ? [
          {
            id: "security",
            label: "Konfigurasi Server",
            icon: <Shield className="h-5 w-5" />,
            description: "Pengaturan dan pemantauan server(Super Admin Only)",
            component: (
              <SecurityManagement
                authSeed={authSeed}
                onNavigate={setActiveSection}
                ref={securityManagementRef}
              />
            ),
          },
        ]
      : []),
  ];

  const activeMenuItem = menuItems.find((item) => item.id === activeSection);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300`
        } bg-white shadow-lg flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Panel Admin</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  if (isMobile) {
                    setSidebarOpen(false);
                  }
                }}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === item.id
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span className="ml-3">Keluar</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "ml-0" : ""}`}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2">
          {isMobile ? (
            /* Mobile Layout */
            <div className="flex flex-col gap-2">
              {/* Top Row: Menu + Icon + Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="mr-2 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  {activeMenuItem?.icon && (
                    <div className="flex items-center flex-shrink-0 mr-2">
                      {activeMenuItem.icon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base font-semibold text-gray-900 truncate">
                      {activeSection === "analytics"
                        ? "Dashboard Analitik"
                        : activeSection === "session-manager"
                          ? "Manajemen Sesi"
                          : activeSection === "hadiah"
                            ? "Manajemen Hadiah"
                            : activeSection === "promo"
                              ? "Manajemen Promo"
                              : activeSection === "feedback-viewer"
                                ? "Feedback"
                                : activeSection === "logs"
                                  ? "Log Sistem"
                                  : activeSection === "chat" && chatConversation
                                    ? chatConversation.user_name
                                    : activeMenuItem?.label}
                    </h1>
                  </div>
                </div>
                {activeSection === "dashboard" && dashboardOverviewRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => dashboardOverviewRef.current?.refresh()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
                {activeSection === "markdown-editor" && markdownEditorRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {markdownCurrentFile ? (
                      <>
                        <button
                          onClick={() => markdownEditorRef.current?.backToFiles()}
                          className="inline-flex items-center justify-center w-8 h-8 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          title="Back to files"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => markdownEditorRef.current?.saveCurrentFile()}
                          disabled={markdownEditorRef.current?.saving}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md transition-colors"
                        >
                          {markdownEditorRef.current?.saving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => markdownEditorRef.current?.refresh()}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          <span>Refresh</span>
                        </button>
                        <button
                          onClick={() => markdownEditorRef.current?.showNewFileDialog()}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                        >
                          <FilePlus className="h-4 w-4 mr-1" />
                          <span>New</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
                {activeSection === "logs" && systemLogsRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => systemLogsRef.current?.toggleFilter()}
                      className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        systemLogsRef.current.showFilters
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      <span>Filter</span>
                    </button>
                    <button
                      onClick={() => systemLogsRef.current?.refresh()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
                {activeSection === "feedback-viewer" && feedbackViewerRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => feedbackViewerRef.current?.toggleTechnicalDetails()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Tampilkan Detail Teknis</span>
                    </button>
                    <button
                      onClick={() => feedbackViewerRef.current?.refresh()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
                {activeSection === "analytics" && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => analyticsDashboardRef.current?.refresh()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
                {activeSection === "session-manager" && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => sessionManagerRef.current?.refresh()}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Refresh</span>
                    </button>
                  </div>
                )}
                {activeSection === "chat" && chatConversation && chatManagementRef.current && (
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => chatManagementRef.current?.resolveConversation(
                        chatManagementRef.current.selectedConversation!.id,
                        chatConversation.resolved === 0
                      )}
                      className={`inline-flex items-center justify-center w-8 h-8 border text-xs font-medium rounded transition-colors ${
                        chatConversation.resolved === 1
                          ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                          : "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100"
                      }`}
                      title={chatConversation.resolved === 1 ? "Unresolve conversation" : "Resolve conversation"}
                    >
                      {chatConversation.resolved === 1 ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {/* Subtitle Row */}
              {activeSection === "analytics" ? (
                <p className="text-xs text-gray-600 truncate">
                  Analisis transaksi 7 hari terakhir
                </p>
              ) : activeSection === "session-manager" && sessionStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Total sesi: {sessionStats.total} • {sessionStats.displayed} ditampilkan
                </p>
              ) : activeSection === "hadiah" && hadiahStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Kelola daftar hadiah ({hadiahStats.total} hadiah)
                </p>
              ) : activeSection === "promo" && promoStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Kelola daftar promo dan diskon ({promoStats.total} promo)
                </p>
              ) : activeSection === "feedback-viewer" && feedbackStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Kelola feedback dari pengguna aplikasi ({feedbackStats.total} feedback)
                </p>
              ) : activeSection === "logs" && systemLogsStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Aktivitas admin dan log sistem ({systemLogsStats.total} total)
                </p>
              ) : activeSection === "users" && memberStats ? (
                <p className="text-xs text-gray-600 truncate">
                  Kelola {memberStats.total} member • {memberStats.loaded} dimuat
                </p>
              ) : activeSection === "transactions" && transactionAnalytics ? (
                <p className="text-xs text-gray-600 truncate">
                  Lihat dan kelola transaksi terbaru
                </p>
              ) : activeSection === "chat" && chatConversation ? (
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-xs text-gray-600 truncate min-w-0 flex-1">
                    {chatConversation.user_id} • {chatConversation.status}
                  </p>
                  <div className="flex items-center flex-shrink-0 gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        chatConnectionStatus === "connected"
                          ? "bg-green-500"
                          : chatConnectionStatus === "connecting"
                            ? "bg-yellow-500"
                            : chatConnectionStatus === "error"
                              ? "bg-red-500"
                              : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {chatConnectionStatus === "connected"
                        ? "Connected"
                        : chatConnectionStatus === "connecting"
                          ? "Connecting..."
                          : chatConnectionStatus === "error"
                            ? "Error"
                            : "Disconnected"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 truncate">
                  {activeMenuItem?.description}
                </p>
              )}
            </div>
          ) : (
            /* Desktop Layout */
            <div className="grid grid-cols-3 items-center gap-4">
              {/* Left: Mobile menu button + Icon */}
              <div className="flex items-center">
                {activeMenuItem?.icon && (
                  <div className="flex items-center">
                    {activeMenuItem.icon}
                  </div>
                )}
              </div>

              {/* Center: Title and Subtitle */}
              <div className="text-center min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {activeSection === "analytics"
                    ? "Dashboard Analitik"
                    : activeSection === "session-manager"
                      ? "Manajemen Sesi"
                      : activeSection === "hadiah"
                        ? "Manajemen Hadiah"
                        : activeSection === "promo"
                          ? "Manajemen Promo"
                          : activeSection === "feedback-viewer"
                            ? "Feedback"
                            : activeSection === "logs"
                              ? "Log Sistem"
                              : activeSection === "chat" && chatConversation
                                ? chatConversation.user_name
                                : activeMenuItem?.label}
                </h1>
                {activeSection === "analytics" ? (
                  <p className="text-xs text-gray-600 truncate">
                    Analisis transaksi 7 hari terakhir
                  </p>
                ) : activeSection === "session-manager" && sessionStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Total sesi: {sessionStats.total} • {sessionStats.displayed} ditampilkan
                  </p>
                ) : activeSection === "hadiah" && hadiahStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Kelola daftar hadiah ({hadiahStats.total} hadiah)
                  </p>
                ) : activeSection === "promo" && promoStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Kelola daftar promo dan diskon ({promoStats.total} promo)
                  </p>
                ) : activeSection === "feedback-viewer" && feedbackStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Kelola feedback dari pengguna aplikasi ({feedbackStats.total} feedback)
                  </p>
                ) : activeSection === "logs" && systemLogsStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Aktivitas admin dan log sistem ({systemLogsStats.total} total)
                  </p>
                ) : activeSection === "users" && memberStats ? (
                  <p className="text-xs text-gray-600 truncate">
                    Kelola {memberStats.total} member • {memberStats.loaded} dimuat
                  </p>
                ) : activeSection === "transactions" && transactionAnalytics ? (
                  <p className="text-xs text-gray-600 truncate">
                    Lihat dan kelola transaksi terbaru
                  </p>
                ) : activeSection === "chat" && chatConversation ? (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xs text-gray-600 truncate">
                      {chatConversation.user_id} • {chatConversation.status}
                    </p>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-1.5 ${
                          chatConnectionStatus === "connected"
                            ? "bg-green-500"
                            : chatConnectionStatus === "connecting"
                              ? "bg-yellow-500"
                              : chatConnectionStatus === "error"
                                ? "bg-red-500"
                                : "bg-gray-400"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        {chatConnectionStatus === "connected"
                          ? "Connected"
                          : chatConnectionStatus === "connecting"
                            ? "Connecting..."
                            : chatConnectionStatus === "error"
                              ? "Error"
                              : "Disconnected"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 truncate">
                    {activeMenuItem?.description}
                  </p>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center justify-end gap-2">
              {/* Dashboard Refresh Button - Only show for dashboard section */}
              {activeSection === "dashboard" && dashboardOverviewRef.current && (
                <button
                  onClick={() => dashboardOverviewRef.current?.refresh()}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              )}

              {/* Member Management Refresh Button - Only show for users section */}
              {activeSection === "users" && (
                <button
                  onClick={() => memberManagementRef.current?.refresh()}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              )}

              {/* Transaction Management Refresh Button - Only show for transactions section */}
              {activeSection === "transactions" && (
                <button
                  onClick={() => transactionManagementRef.current?.refresh()}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              )}

              {/* Chat Management Buttons - Only show for chat section */}
              {activeSection === "chat" && chatConversation && chatManagementRef.current && (
                <>
                  <button
                    onClick={() => chatManagementRef.current?.resolveConversation(
                      chatManagementRef.current.selectedConversation!.id,
                      chatConversation.resolved === 0
                    )}
                    className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded transition-colors ${
                      chatConversation.resolved === 1
                        ? "border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                        : "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100"
                    }`}
                    title={chatConversation.resolved === 1 ? "Unresolve conversation" : "Resolve conversation"}
                  >
                    {chatConversation.resolved === 1 ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Unresolve
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Resolve
                      </>
                    )}
                  </button>
                </>
              )}

              {/* Menu Editor Buttons - Only show for menu-editor section */}
              {activeSection === "menu-editor" && (
                <div className="flex items-center gap-2">
                {/* Menu Selection Dropdown */}
                <div className="relative">
                  <select
                    value={selectedMenu}
                    onChange={(e) => {
                      setSelectedMenu(e.target.value);
                      loadConfigFromBackend(e.target.value);
                    }}
                    disabled={isLoadingMenus}
                    className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-6"
                  >
                    {isLoadingMenus ? (
                      <option value="">Loading menus...</option>
                    ) : (
                      availableMenus.map((menu) => (
                        <option key={menu.name} value={menu.name}>
                          {menu.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown
                    size={12}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                </div>

                {/* Import JSON */}
                <label className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 cursor-pointer transition-colors">
                  <Upload size={14} />
                  Impor
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>

                {/* Export JSON */}
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  <Download size={14} />
                  Ekspor
                </button>

                {/* Publish */}
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                  title="Publish to backend"
                >
                  {isPublishing ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  Publish
                </button>
              </div>
            )}

            {/* Assets Upload Button - Only show for assets section */}
            {activeSection === "assets" && (
              <div className="flex items-center gap-2">
                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="assets-upload"
                />

                {/* Upload Button */}
                <label
                  htmlFor="assets-upload"
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    isUploading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  }`}
                  title={isUploading ? "Uploading..." : "Upload files"}
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  {isUploading ? "Uploading..." : "Upload"}
                </label>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
                </div>
              )}

              {/* Security Management Save Button - Only show for security section */}
              {activeSection === "security" && (
                <div className="flex items-center gap-2">
                {/* Save All Configurations */}
                <button
                  onClick={handleSaveAllConfigurations}
                  disabled={isSavingAll}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  title="Save all security configurations"
                >
                  {isSavingAll ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  Simpan Semua Konfigurasi
                </button>
                </div>
              )}

              {/* System Settings Save Button - Only show for system section */}
              {activeSection === "system" && (
                <div className="flex items-center gap-2">
                {/* Save All System Settings */}
                <button
                  onClick={handleSaveAllSystemSettings}
                  disabled={isSavingSystemSettings}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  title="Save all system settings configurations"
                >
                  {isSavingSystemSettings ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  Simpan Semua Pengaturan
                </button>
                </div>
              )}

              {/* Hadiah Management Save Button - Only show for hadiah section */}
              {activeSection === "hadiah" && (
                <div className="flex items-center gap-2">
                {/* Save All Hadiah */}
                <button
                  onClick={handleSaveAllHadiah}
                  disabled={isSavingHadiah}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  title="Save all hadiah configurations"
                >
                  {isSavingHadiah ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  Simpan Semua Hadiah
                </button>
                </div>
              )}

              {/* Promo Management Save Button - Only show for promo section */}
              {activeSection === "promo" && (
                <div className="flex items-center gap-2">
                {/* Save All Promo */}
                <button
                  onClick={handleSaveAllPromo}
                  disabled={isSavingPromo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                  title="Save all promo configurations"
                >
                  {isSavingPromo ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={14} />
                  )}
                  Simpan Semua Promo
                </button>
              </div>
            )}

              {/* Broadcast Send Button - Only show for notifications section */}
              {activeSection === "notifications" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => broadcastCenterRef.current?.sendBroadcast()}
                    disabled={!canSendBroadcast}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                    title="Send broadcast message"
                  >
                    {isBroadcastSending ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Megaphone size={14} />
                    )}
                    Kirim Broadcast
                  </button>
                </div>
              )}

              {/* Analytics Refresh Button - Only show for analytics section */}
              {activeSection === "analytics" && (
                <button
                  onClick={() => analyticsDashboardRef.current?.refresh()}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              )}

              {/* Session Manager Refresh Button - Only show for session-manager section */}
              {activeSection === "session-manager" && (
                <button
                  onClick={() => sessionManagerRef.current?.refresh()}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              )}

              {/* Feedback Viewer Buttons - Only show for feedback-viewer section */}
              {activeSection === "feedback-viewer" && feedbackViewerRef.current && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => feedbackViewerRef.current?.toggleTechnicalDetails()}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Tampilkan Detail Teknis</span>
                  </button>
                  <button
                    onClick={() => feedbackViewerRef.current?.refresh()}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}

              {/* System Logs Buttons - Only show for logs section */}
              {activeSection === "logs" && systemLogsRef.current && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => systemLogsRef.current?.toggleFilter()}
                    className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      systemLogsRef.current.showFilters
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </button>
                  <button
                    onClick={() => systemLogsRef.current?.refresh()}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              )}

              {/* Markdown Editor Buttons - Only show for markdown-editor section */}
              {activeSection === "markdown-editor" && markdownEditorRef.current && (
                <div className="flex items-center gap-2">
                  {markdownCurrentFile ? (
                    <>
                      <button
                        onClick={() => markdownEditorRef.current?.backToFiles()}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                      <button
                        onClick={() => markdownEditorRef.current?.downloadMarkdown()}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => markdownEditorRef.current?.saveCurrentFile()}
                        disabled={markdownEditorRef.current?.saving}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-md transition-colors"
                      >
                        {markdownEditorRef.current?.saving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>{markdownEditorRef.current?.saving ? 'Saving...' : 'Save'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => markdownEditorRef.current?.refresh()}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={() => markdownEditorRef.current?.showNewFileDialog()}
                        className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                      >
                        <FilePlus className="h-4 w-4" />
                        <span>New File</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          className={`flex-1 overflow-y-auto ${activeSection === "menu-editor" ? "p-0" : "p-6"}`}
        >
          {activeMenuItem?.component}
        </div>
      </div>
    </div>
  );
};

// Proper Dashboard Overview Component
const DashboardOverview = forwardRef<{ refresh: () => void }, {
  authSeed: string;
  onNavigate: (section: string) => void;
  gridCols: string;
  statsGridRef: React.RefObject<HTMLDivElement>;
}>(({ authSeed, onNavigate, gridCols, statsGridRef }, ref) => {
  const [stats, setStats] = useState({
    totalResellers: 0,
    todayTransactions: 0,
    activeSessions: 0,
    systemHealth: "checking",
  });
  const [systemStatus, setSystemStatus] = useState({
    serverStatus: "Checking...",
    databaseStatus: "Checking...",
    apiResponseTime: "N/A",
    lastBackup: "N/A",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    totalRequests: 0,
    monthlyAppSuccessTrx: 0,
  });
  const [licenseStatus, setLicenseStatus] = useState({
    is_valid: false,
    days_remaining: null as number | null,
    is_expired: true,
    status_message: "Checking...",
  });
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    systemStatus: true,
    transactions: true,
    licenseStatus: true,
  });

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        // Fetch real system status from backend
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          console.error("No session key found");
          setLoadingStates({
            systemStatus: false,
            stats: false,
            transactions: false,
            licenseStatus: false,
          });
          return;
        }

        // Load system status
        try {
          const apiUrl = await getApiUrl("/admin/system-status");
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
            },
            body: JSON.stringify({
              session_key: sessionKey,
              auth_seed: authSeed,
            }),
          });

          const data = await response.json();

          if (data.success && data.status) {
            const status = data.status;
            setSystemStatus({
              serverStatus: status.server_status,
              databaseStatus: status.database_status,
              apiResponseTime: `${status.api_response_time}ms`,
              lastBackup: status.last_backup || "Tidak ada backup",
              memoryUsage: status.memory_usage || 0,
              cpuUsage: status.cpu_usage || 0,
              activeConnections: status.active_connections,
              totalRequests: status.total_requests,
              monthlyAppSuccessTrx: status.monthly_app_success_trx || 0,
            });

            // Update dashboard health based on system status
            setStats((prevStats) => ({
              ...prevStats,
              systemHealth:
                status.server_status === "Online" ? "healthy" : "critical",
            }));
          } else {
            // Backend is not responding or returned error
            setSystemStatus({
              serverStatus: "Offline",
              databaseStatus: "Unknown",
              apiResponseTime: "N/A",
              lastBackup: "N/A",
              memoryUsage: 0,
              cpuUsage: 0,
              activeConnections: 0,
              totalRequests: 0,
              monthlyAppSuccessTrx: 0,
            });

            // Set critical health when backend is offline
            setStats((prevStats) => ({
              ...prevStats,
              systemHealth: "critical",
            }));
          }
        } catch (error) {
          console.error("Failed to fetch system status:", error);
          setSystemStatus({
            serverStatus: "Offline",
            databaseStatus: "Unknown",
            apiResponseTime: "N/A",
            lastBackup: "N/A",
            memoryUsage: 0,
            cpuUsage: 0,
            activeConnections: 0,
            totalRequests: 0,
            monthlyAppSuccessTrx: 0,
          });
          setStats((prevStats) => ({
            ...prevStats,
            systemHealth: "critical",
          }));
        } finally {
          // Mark system status as loaded
          setLoadingStates((prev) => ({ ...prev, systemStatus: false }));
        }

        // Load dashboard stats
        try {
          const statsApiUrl = await getApiUrl("/admin/dashboard-stats");
          const statsResponse = await fetch(statsApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
            },
            body: JSON.stringify({
              session_key: sessionKey,
              auth_seed: authSeed,
            }),
          });

          const statsData = await statsResponse.json();

          if (statsData.success && statsData.stats) {
            const dashboardStats = statsData.stats;
            setStats((prevStats) => ({
              ...prevStats,
              totalResellers: dashboardStats.total_resellers,
              activeSessions: dashboardStats.active_sessions,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch dashboard stats:", error);
        } finally {
          // Mark stats as loaded
          setLoadingStates((prev) => ({ ...prev, stats: false }));
        }

        // Load transaction analytics
        try {
          const analyticsApiUrl = await getApiUrl(
            "/admin/transactions/analytics",
          );
          const analyticsResponse = await fetch(analyticsApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
            },
            body: JSON.stringify({
              session_key: sessionKey,
              auth_seed: authSeed,
            }),
          });

          const analyticsData = await analyticsResponse.json();

          if (analyticsData.success && analyticsData.analytics) {
            setStats((prevStats) => ({
              ...prevStats,
              todayTransactions: analyticsData.analytics.total_today || 0,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch transaction analytics:", error);
        } finally {
          // Mark transactions as loaded
          setLoadingStates((prev) => ({ ...prev, transactions: false }));
        }

        // Load license status
        try {
          const licenseApiUrl = await getApiUrl("/admin/license-status");
          const licenseResponse = await fetch(licenseApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Token": X_TOKEN_VALUE,
            },
            body: JSON.stringify({
              session_key: sessionKey,
              auth_seed: authSeed,
            }),
          });

          const licenseData = await licenseResponse.json();

          if (licenseData.success && licenseData.license_status) {
            setLicenseStatus(licenseData.license_status);
          } else {
            console.error(
              "Failed to fetch license status:",
              licenseData.message,
            );
            setLicenseStatus((prev) => ({
              ...prev,
              status_message: "Failed to load license status",
            }));
          }
        } catch (error) {
          console.error("Failed to fetch license status:", error);
          setLicenseStatus((prev) => ({
            ...prev,
            status_message: "Error loading license status",
          }));
        } finally {
          // Mark license status as loaded
          setLoadingStates((prev) => ({ ...prev, licenseStatus: false }));
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
        // Set offline status when network error occurs
        setSystemStatus({
          serverStatus: "Offline",
          databaseStatus: "Unknown",
          apiResponseTime: "N/A",
          lastBackup: "N/A",
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0,
          totalRequests: 0,
          monthlyAppSuccessTrx: 0,
        });
        // Set critical system health when backend is offline
        setStats({
          totalResellers: 0,
          todayTransactions: 0,
          activeSessions: 0,
          systemHealth: "critical",
        });
        setLoadingStates({
          stats: false,
          systemStatus: false,
          transactions: false,
          licenseStatus: false,
        });
      }
    };

    loadDashboardStats();
  }, [authSeed]);

  // Auto-refresh disabled; use manual refresh button instead

  const refreshDashboard = async () => {
    const sessionKey = localStorage.getItem("adminSessionKey");
    if (!sessionKey) {
      console.error("No session key found");
      return;
    }

    // Set loading states for refresh
    setLoadingStates({
      stats: true,
      systemStatus: true,
      transactions: true,
      licenseStatus: true,
    });

    try {
      // Fetch real system status from backend
      const apiUrl = await getApiUrl("/admin/system-status");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();
      console.log("System status response:", data);

      if (data.success && data.status) {
        const status = data.status;
        setSystemStatus({
          serverStatus: status.server_status,
          databaseStatus: status.database_status,
          apiResponseTime: `${status.api_response_time}ms`,
          lastBackup: status.last_backup || "Tidak ada backup",
          memoryUsage: status.memory_usage || 0,
          cpuUsage: status.cpu_usage || 0,
          activeConnections: status.active_connections,
          totalRequests: status.total_requests,
          monthlyAppSuccessTrx: status.monthly_app_success_trx || 0,
        });

        // Update dashboard health based on system status
        setStats((prevStats) => ({
          ...prevStats,
          systemHealth:
            status.server_status === "Online" ? "healthy" : "critical",
        }));
      } else {
        // Backend is not responding or returned error
        setSystemStatus({
          serverStatus: "Offline",
          databaseStatus: "Unknown",
          apiResponseTime: "N/A",
          lastBackup: "N/A",
          memoryUsage: 0,
          cpuUsage: 0,
          activeConnections: 0,
          totalRequests: 0,
          monthlyAppSuccessTrx: 0,
        });

        // Set critical health when backend is offline
        setStats((prevStats) => ({
          ...prevStats,
          systemHealth: "critical",
        }));
      }

      // Mark system status as loaded
      setLoadingStates((prev) => ({ ...prev, systemStatus: false }));

      // Fetch active sessions from dashboard stats (session table)
      try {
        const statsApiUrl = await getApiUrl("/admin/dashboard-stats");
        const statsResponse = await fetch(statsApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
          }),
        });

        const statsData = await statsResponse.json();

        if (statsData.success && statsData.stats) {
          const dashboardStats = statsData.stats;
          setStats((prevStats) => ({
            ...prevStats,
            totalResellers: dashboardStats.total_resellers,
            activeSessions: dashboardStats.active_sessions,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        // Mark stats as loaded
        setLoadingStates((prev) => ({ ...prev, stats: false }));
      }

      // Fetch today's transactions from TransactionManagement logic (working endpoint)
      try {
        const analyticsApiUrl = await getApiUrl(
          "/admin/transactions/analytics",
        );
        const analyticsResponse = await fetch(analyticsApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
          }),
        });

        const analyticsData = await analyticsResponse.json();

        if (analyticsData.success && analyticsData.analytics) {
          setStats((prevStats) => ({
            ...prevStats,
            todayTransactions: analyticsData.analytics.total_today || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch transaction analytics:", error);
      } finally {
        // Mark transactions as loaded
        setLoadingStates((prev) => ({ ...prev, transactions: false }));
      }

      // Fetch license status
      try {
        const licenseApiUrl = await getApiUrl("/admin/license-status");
        const licenseResponse = await fetch(licenseApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
          }),
        });

        const licenseData = await licenseResponse.json();

        if (licenseData.success && licenseData.license_status) {
          setLicenseStatus(licenseData.license_status);
        } else {
          console.error("Failed to fetch license status:", licenseData.message);
          setLicenseStatus((prev) => ({
            ...prev,
            status_message: "Failed to load license status",
          }));
        }
      } catch (error) {
        console.error("Failed to fetch license status:", error);
        setLicenseStatus((prev) => ({
          ...prev,
          status_message: "Error loading license status",
        }));
      } finally {
        // Mark license status as loaded
        setLoadingStates((prev) => ({ ...prev, licenseStatus: false }));
      }
    } catch (error) {
      console.error("Failed to refresh dashboard stats:", error);
      // Set offline status when network error occurs
      setSystemStatus({
        serverStatus: "Offline",
        databaseStatus: "Unknown",
        apiResponseTime: "N/A",
        lastBackup: "N/A",
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        totalRequests: 0,
        monthlyAppSuccessTrx: 0,
      });
      // Set critical system health when backend is offline
      setStats((prevStats) => ({
        ...prevStats,
        systemHealth: "critical",
      }));
      // Mark all as loaded even on error
      setLoadingStates({
        stats: false,
        systemStatus: false,
        transactions: false,
        licenseStatus: false,
      });
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshDashboard,
  }));

  // Skeleton loader component
  const SkeletonLoader = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold mb-2">
            Selamat Datang di Panel Admin
          </h1>
          <p className="text-indigo-100">
            Kelola sistem dan pantau aktivitas aplikasi dari sini
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div ref={statsGridRef} className={`grid ${gridCols} gap-4 lg:gap-6`}>
        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Store className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Total Reseller
              </p>
              {loadingStates.stats ? (
                <SkeletonLoader className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalResellers.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Transaksi Hari Ini
              </p>
              {loadingStates.transactions ? (
                <SkeletonLoader className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.todayTransactions.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <Activity className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Total Sesi Member
              </p>
              {loadingStates.stats ? (
                <SkeletonLoader className="h-8 w-12 mt-1" />
              ) : (
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.activeSessions}
                </p>
              )}
            </div>
          </div>
        </div>

        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Status Sistem
              </p>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-8 w-20 mt-1" />
              ) : (
                <p
                  className={`text-2xl font-semibold capitalize ${
                    stats.systemHealth === "healthy"
                      ? "text-green-600"
                      : stats.systemHealth === "warning"
                        ? "text-yellow-600"
                        : stats.systemHealth === "checking"
                          ? "text-blue-600"
                          : "text-red-600"
                  }`}
                >
                  {stats.systemHealth}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-600 whitespace-nowrap">
              Status Lisensi
            </p>
            {loadingStates.licenseStatus ? (
              <SkeletonLoader className="h-8 w-20 mt-1" />
            ) : (
              <div className="mt-1">
                <p
                  className={`text-2xl font-semibold ${
                    licenseStatus.is_valid
                      ? "text-green-600"
                      : licenseStatus.is_expired
                        ? "text-red-600"
                        : "text-yellow-600"
                  }`}
                >
                  {licenseStatus.is_valid
                    ? "Valid"
                    : licenseStatus.is_expired
                      ? "Expired"
                      : "Invalid"}
                </p>
                {licenseStatus.days_remaining !== null && (
                  <p className="text-xs text-gray-500">
                    {licenseStatus.is_expired
                      ? `Expired ${Math.abs(licenseStatus.days_remaining)} days ago`
                      : `${licenseStatus.days_remaining} days remaining`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate("users")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Kelola Member</p>
                  <p className="text-sm text-gray-600">Lihat dan edit member</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("transactions")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Lihat Transaksi</p>
                  <p className="text-sm text-gray-600">Monitor transaksi</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("menu-editor")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Edit Menu</p>
                  <p className="text-sm text-gray-600">Konfigurasi aplikasi</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate("logs")}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Terminal className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Log Sistem</p>
                  <p className="text-sm text-gray-600">Lihat log sistem</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div
          data-card
          className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Status Sistem
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Status</span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-16" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatus.serverStatus === "Online"
                      ? "bg-green-100 text-green-800"
                      : systemStatus.serverStatus === "Checking..."
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {systemStatus.serverStatus}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-20" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatus.databaseStatus === "Connected"
                      ? "bg-green-100 text-green-800"
                      : systemStatus.databaseStatus === "SQLite Only" ||
                          systemStatus.databaseStatus === "SQL Server Only"
                        ? "bg-yellow-100 text-yellow-800"
                        : systemStatus.databaseStatus === "Checking..."
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                  }`}
                >
                  {systemStatus.databaseStatus}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response</span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-12" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    systemStatus.apiResponseTime === "N/A"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {systemStatus.apiResponseTime}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">License Status</span>
              {loadingStates.licenseStatus ? (
                <SkeletonLoader className="h-6 w-20" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    licenseStatus.is_valid
                      ? "bg-green-100 text-green-800"
                      : licenseStatus.is_expired
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {licenseStatus.is_valid
                    ? "Valid"
                    : licenseStatus.is_expired
                      ? "Expired"
                      : "Invalid"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Transaksi success bulan ini (via app)
              </span>
              {loadingStates.systemStatus ? (
                <SkeletonLoader className="h-6 w-24" />
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {systemStatus.monthlyAppSuccessTrx.toLocaleString()}
                </span>
              )}
            </div>
            {!loadingStates.licenseStatus &&
              licenseStatus.days_remaining !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Days Remaining</span>
                  <span
                    className={`text-sm font-medium ${
                      licenseStatus.is_valid
                        ? licenseStatus.days_remaining! <= 30
                          ? "text-yellow-600"
                          : "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {licenseStatus.is_expired
                      ? `${Math.abs(licenseStatus.days_remaining!)} days ago`
                      : `${licenseStatus.days_remaining} days`}
                  </span>
                </div>
              )}
            {!loadingStates.licenseStatus && licenseStatus.status_message && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                {licenseStatus.status_message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardOverview.displayName = "DashboardOverview";

interface PublishResponse {
  success: boolean;
  message: string;
}

// Remove the old UserManagement component since we're using MemberManagement now

export default AdminDashboard;

