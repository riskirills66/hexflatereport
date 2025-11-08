import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { X_TOKEN_VALUE, getApiUrl } from "../config/api";

// Dynamic type for any app rules
type AppRules = Record<string, any>;

// Type for info config (message configuration)
type InfoConfig = Record<string, any>;

// Type for tiket regex config
type TiketRegexConfig = Record<string, any>;

// Type for check products config
type CheckProductsConfig = Record<string, string[]>;

// Type for cektagihan config
type CektagihanConfig = Record<string, string>;

// Type for receipt maps config
type ReceiptConfig = {
  name: string;
  product_prefixes: string[];
  regex: string;
  highlight_key: string;
  dash: boolean;
  receipt_title: string;
  info_text: string;
};

type ReceiptMapsConfig = {
  configs: ReceiptConfig[];
};

// Type for bantuan config
type TopicCard = {
  icon: string;
  title: string;
  desc: string;
  url?: string;
  route?: string;
  routeArgs?: {
    url: string;
  };
};

type BantuanConfig = {
  mainCard: string;
  mainCardContent: string;
  topicTitle: string;
  topicCards: TopicCard[];
};

// Type for app info config
// Removed AppInfoConfig type

interface SystemSettingsProps {
  authSeed: string;
}

export interface SystemSettingsRef {
  saveAllConfigurations: () => Promise<void>;
}

const SystemSettings = forwardRef<SystemSettingsRef, SystemSettingsProps>(
  ({ authSeed }, ref) => {
    const [appRules, setAppRules] = useState<AppRules | null>(null);
    const [infoConfig, setInfoConfig] = useState<InfoConfig | null>(null);
    const [tiketRegexConfig, setTiketRegexConfig] =
      useState<TiketRegexConfig | null>(null);
    const [checkProductsConfig, setCheckProductsConfig] =
      useState<CheckProductsConfig | null>(null);
    const [combotrxConfig, setCombotrxConfig] = useState<Record<
      string,
      any
    > | null>(null);
    const [cektagihanConfig, setCektagihanConfig] =
      useState<CektagihanConfig | null>(null);
    const [receiptMapsConfig, setReceiptMapsConfig] =
      useState<ReceiptMapsConfig | null>(null);
    const [bantuanConfig, setBantuanConfig] = useState<BantuanConfig | null>(
      null,
    );
    // Removed appInfoConfig state
    const [loading, setLoading] = useState(true);
    const [loadingStates, setLoadingStates] = useState({
      appRules: true,
      infoConfig: true,
      tiketRegex: true,
      checkProducts: true,
      combotrx: true,
      cektagihan: true,
      receiptMaps: true,
      bantuan: true,
    });
    const [message, setMessage] = useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<string>("info_config");
    const [expandedReceiptConfigs, setExpandedReceiptConfigs] = useState<
      Set<number>
    >(new Set());
    const [localCektagihanKeys, setLocalCektagihanKeys] = useState<
      Record<string, string>
    >({});

    useEffect(() => {
      loadAppRules();
      loadInfoConfig();
      loadTiketRegexConfig();
      loadCheckProductsConfig();
      loadCombotrxConfig();
      loadCektagihanConfig();
      loadReceiptMapsConfig();
      loadBantuanConfig();
    }, []);

    // Update main loading state based on individual loading states
    useEffect(() => {
      setLoading(
        loadingStates.appRules ||
          loadingStates.infoConfig ||
          loadingStates.tiketRegex ||
          loadingStates.checkProducts ||
          loadingStates.combotrx ||
          loadingStates.cektagihan ||
          loadingStates.receiptMaps ||
          loadingStates.bantuan,
      );
    }, [loadingStates]);

    // Set initial active tab to first available config when loading completes
    useEffect(() => {
      if (!loading) {
        // Only set if current tab's config doesn't exist
        const currentTabHasConfig = 
          (activeTab === "info_config" && infoConfig) ||
          (activeTab === "tiket_regex" && tiketRegexConfig) ||
          (activeTab === "check_products" && checkProductsConfig) ||
          (activeTab === "combotrx_config" && combotrxConfig) ||
          (activeTab === "cektagihan_config" && cektagihanConfig) ||
          (activeTab === "receipt_maps_config" && receiptMapsConfig) ||
          (activeTab === "bantuan_config" && bantuanConfig) ||
          (activeTab === "textEditing" && appRules);

        if (!currentTabHasConfig) {
          // Set to first available tab
          if (infoConfig) setActiveTab("info_config");
          else if (tiketRegexConfig) setActiveTab("tiket_regex");
          else if (checkProductsConfig) setActiveTab("check_products");
          else if (combotrxConfig) setActiveTab("combotrx_config");
          else if (cektagihanConfig) setActiveTab("cektagihan_config");
          else if (receiptMapsConfig) setActiveTab("receipt_maps_config");
          else if (bantuanConfig) setActiveTab("bantuan_config");
          else if (appRules) setActiveTab("textEditing");
        }
      }
    }, [loading, infoConfig, tiketRegexConfig, checkProductsConfig, combotrxConfig, cektagihanConfig, receiptMapsConfig, bantuanConfig, appRules, activeTab]);

    // Synchronize local cektagihan keys with cektagihan config
    useEffect(() => {
      if (cektagihanConfig) {
        const localKeys: Record<string, string> = {};
        Object.keys(cektagihanConfig).forEach((key) => {
          localKeys[key] = key;
        });
        setLocalCektagihanKeys(localKeys);
      }
    }, [cektagihanConfig]);

    const loadAppRules = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, appRules: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          setAppRules(getDefaultRules());
          return;
        }

        const apiUrl = await getApiUrl("/admin/app-rules");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rules) {
            setAppRules(data.rules);
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal memuat pengaturan",
            });
            // Fallback to default rules
            setAppRules(getDefaultRules());
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal memuat pengaturan dari server",
          });
          // Fallback to default rules
          setAppRules(getDefaultRules());
        }
      } catch (error) {
        console.error("Failed to load app rules:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat memuat pengaturan",
        });
        // Fallback to default rules
        setAppRules(getDefaultRules());
      } finally {
        setLoadingStates((prev) => ({ ...prev, appRules: false }));
      }
    };

    const loadInfoConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, infoConfig: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          setInfoConfig(getDefaultInfoConfig());
          return;
        }

        const apiUrl = await getApiUrl("/admin/info-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setInfoConfig(data.config);
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal memuat konfigurasi info",
            });
            setInfoConfig(getDefaultInfoConfig());
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal memuat konfigurasi info dari server",
          });
          setInfoConfig(getDefaultInfoConfig());
        }
      } catch (error) {
        console.error("Failed to load info config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat memuat konfigurasi info",
        });
        setInfoConfig(getDefaultInfoConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, infoConfig: false }));
      }
    };

    const loadTiketRegexConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, tiketRegex: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          setTiketRegexConfig(getDefaultTiketRegexConfig());
          return;
        }

        const apiUrl = await getApiUrl("/admin/tiket-regex");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setTiketRegexConfig(data.config);
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal memuat konfigurasi tiket regex",
            });
            setTiketRegexConfig(getDefaultTiketRegexConfig());
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal memuat konfigurasi tiket regex dari server",
          });
          setTiketRegexConfig(getDefaultTiketRegexConfig());
        }
      } catch (error) {
        console.error("Failed to load tiket regex config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat memuat konfigurasi tiket regex",
        });
        setTiketRegexConfig(getDefaultTiketRegexConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, tiketRegex: false }));
      }
    };

    const loadCheckProductsConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, checkProducts: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          setCheckProductsConfig(getDefaultCheckProductsConfig());
          return;
        }

        const apiUrl = await getApiUrl("/admin/check-products");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setCheckProductsConfig(data.config);
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal memuat konfigurasi cek produk",
            });
            setCheckProductsConfig(getDefaultCheckProductsConfig());
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal memuat konfigurasi cek produk dari server",
          });
          setCheckProductsConfig(getDefaultCheckProductsConfig());
        }
      } catch (error) {
        console.error("Failed to load check products config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat memuat konfigurasi cek produk",
        });
        setCheckProductsConfig(getDefaultCheckProductsConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, checkProducts: false }));
      }
    };

    const getDefaultRules = (): AppRules => ({
      // Core system settings
      verificationFeature: true,
      editProfileFeature: true,
      biometrictTrxFeature: true,
      blockNonVerifiedMLM: true,
      blockNonVerifiedTransfer: false,
      exchangePoinToSaldo: true,
      exchangePoinToGift: true,
      permissionIntroFeatureEnabled: false,
      maxTransactionsTotal: 1000000,
      maxTransaction: 250000,
      newUserMarkup: 50,
      maxWelcomePosterPerDay: 5,
      minimumProductPriceToDisplay: 1,
      maximumVoucherActivation: 50,
      cs_phone: "+628123456789",
      cs_whatsapp: "628123456789",
      cs_email: "support@company.com",
      newUserGroup: "X",
      newUserUpline: "",

      // Sample messages (in real implementation, this would load all 900+ fields)
      authBiometricReason: "Autentikasi dengan biometrik",
      authTooManyRetriesMessage:
        "Terlalu banyak percobaan PIN gagal. Anda akan keluar.",
      authBiometricNotSupportedMessage:
        "Fitur biometrik tidak didukung pada perangkat atau sistem operasi ini.",
      authBiometricNotAvailableMessage:
        "Biometrik tidak tersedia di perangkat ini.",
      authBiometricFailedMessage:
        "Autentikasi biometrik gagal atau dibatalkan.",
      authBiometricErrorMessage: "Terjadi kesalahan biometrik.",
      authNoBiometricEnrolledMessage:
        "Tidak ada biometrik yang terdaftar di perangkat ini.",
      authBiometricLockedMessage:
        "Sensor biometrik terkunci. Silakan coba lagi nanti.",
      authBiometricNotAvailableDeviceMessage:
        "Fitur biometrik tidak tersedia di perangkat ini.",
      authPasscodeNotSetMessage:
        "Setel kunci layar perangkat Anda untuk menggunakan biometrik.",
      authGeneralErrorMessage: "Terjadi kesalahan: ",
      authSessionNotFoundMessage: "Session tidak ditemukan.",
      authCannotConnectMessage: "Tidak dapat terhubung ke server.",
      authWrongPinMessage: "PIN salah.",
      authEnterPinMessage: "Masukkan PIN Anda",
      authPinLabel: "PIN",
      authPinValidationMessage: "PIN harus 6 digit",
      authVerifyPinButtonText: "Verifikasi PIN",
      authBackToNumpadButtonText: "Kembali ke Numpad",
    });

    const getDefaultInfoConfig = (): InfoConfig => ({
      message_config: {
        otp_template:
          "Kode OTP Kamu: {}\nJangan berikan kode ini ke siapa pun, termasuk pihak operator/admin.\n Kode berlaku selama 5 menit.",
        user_inactive_message:
          "Akun pengguna tidak aktif. Silakan hubungi Customer Service.",
        user_suspended_message:
          "Akun pengguna disuspend. Silakan hubungi Customer Services.",
        otp_success_message: "OTP Berhasil dikirim",
        auth_success_message: "Otentikasi Login Berhasil",
        auth_invalid_credentials_message:
          "Otentikasi tidak valid, silakan coba clear cache aplikasi, dan coba lagi.",
        auth_otp_expired_message:
          "OTP telah kedaluwarsa, silakan login kembali untuk mendapatkan OTP baru.",
        auth_invalid_otp_message: "Kode OTP tidak valid, silakan coba lagi.",
        cooldown_message: "Mohon tunggu 60 detik sebelum mencoba lagi.",
        attempt_limit_message:
          "Terlalu banyak percobaan login, silakan coba lagi nanti. Hubungi Customer Service jika masalah berlanjut.",
        check_failed_message:
          "Gagal mendapatkan informasi pengguna, silakan coba lagi nanti.",
      },
    });

    const getDefaultTiketRegexConfig = (): TiketRegexConfig => ({
      tiket_regex: {
        regex:
          "(?s).*?Rp\\.\\s*(?P<amount>[\\d.,]+).*?\\n(?P<name>[^\\n\\s]+(?:\\s+[^\\n\\s]+)*)\\s*\\nBRI:\\s*(?P<bank_bri>\\d+)\\s*\\nMANDIRI:\\s*(?P<bank_close_mandiri>\\d+)\\s*\\nBNI:\\s*(?P<bank_bni>\\d+)\\s*\\nBCA:\\s*(?P<bank_bca>\\d+)\\s*\\nBSI:\\s*(?P<bank_bsi>\\d+)\\s*\\n(?P<note>.*)",
      },
    });

    const getDefaultCheckProductsConfig = (): CheckProductsConfig => ({
      CEKDN: ["DN%", "ADN%", "DANA%"],
      CEKGJK: ["GJK%", "GOPAY%"],
      CEKOVO: ["OVO%", "UOVO%"],
      CEKIDPEL: ["PM%", "TOKENP%"],
      "VAL.CEKTSEL": ["TSEL"],
      "INQ.CEKTDC": ["TDC"],
      CPLN: ["BPLN"],
      CEKPDAMPDG: ["PDAMPDG"],
      CEKTDOMQ: ["TDOMQ"],
    });

    // Combotrx Configuration Functions
    const loadCombotrxConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, combotrx: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          setCombotrxConfig(getDefaultCombotrxConfig());
          return;
        }

        const apiUrl = await getApiUrl("/admin/combotrx-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setCombotrxConfig(data.config);
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal memuat konfigurasi combotrx",
            });
            setCombotrxConfig(getDefaultCombotrxConfig());
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal memuat konfigurasi combotrx dari server",
          });
          setCombotrxConfig(getDefaultCombotrxConfig());
        }
      } catch (error) {
        console.error("Failed to load combotrx config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat memuat konfigurasi combotrx",
        });
        setCombotrxConfig(getDefaultCombotrxConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, combotrx: false }));
      }
    };

    const getDefaultCombotrxConfig = (): Record<string, any> => ({
      CEKTDC: {
        pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
      },
      CEKTDT: {
        pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
      },
    });

    const saveCombotrxConfig = async () => {
      if (!combotrxConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/combotrx-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: combotrxConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: "Konfigurasi combotrx berhasil disimpan",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal menyimpan konfigurasi combotrx",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal menyimpan konfigurasi combotrx",
          });
        }
      } catch (error) {
        console.error("Error saving combotrx config:", error);
        setMessage({
          type: "error",
          text: "Gagal menyimpan konfigurasi combotrx",
        });
      } finally {
      }
    };

    const updateCombotrxConfig = (
      header: string,
      field: string,
      value: string,
    ) => {
      if (!combotrxConfig) return;

      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        if (!newConfig[header]) {
          newConfig[header] = {};
        }
        newConfig[header] = {
          ...newConfig[header],
          [field]: value,
        };
        return newConfig;
      });
    };

    const addNewCombotrxHeader = () => {
      const newHeader = `NEW_HEADER_${Date.now()}`;
      setCombotrxConfig((prev) => ({
        ...prev,
        [newHeader]: {
          pattern: "# (?P<kode>\\d+)\\|(?P<nama>[^|]+)\\|(?P<harga_final>\\d+)",
        },
      }));
    };

    const removeCombotrxHeader = (header: string) => {
      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        delete newConfig[header];
        return newConfig;
      });
    };

    const updateCombotrxHeaderName = (oldHeader: string, newHeader: string) => {
      if (oldHeader === newHeader) return;

      setCombotrxConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        const headerData = newConfig[oldHeader];
        delete newConfig[oldHeader];
        newConfig[newHeader] = headerData;
        return newConfig;
      });
    };

    // Cektagihan Configuration Functions
    const loadCektagihanConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, cektagihan: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/cektagihan-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setCektagihanConfig(data.config);
          } else {
            setCektagihanConfig(getDefaultCektagihanConfig());
          }
        } else {
          setCektagihanConfig(getDefaultCektagihanConfig());
        }
      } catch (error) {
        console.error("Error loading cektagihan config:", error);
        setCektagihanConfig(getDefaultCektagihanConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, cektagihan: false }));
      }
    };

    const getDefaultCektagihanConfig = (): CektagihanConfig => {
      return {
        CPLN: "(?P<nama>[^/]+)/TARIFDAYA:(?P<tarif>[^/]+)/(?P<daya>[^/]+)/PERIODE:(?P<periode>[^/]+)/STAND:(?P<stand>[^/]+)/RPTAG:(?P<rp_tag>[^/]+)/DENDA:(?P<denda>[^/]+)/TOTALTAG:(?P<tagihan>.*)",
        CEKTSEL: "(?P<tagihan>[\\d.,]+)",
        CEKGJK: "Nama Nasabah:\\s*(?P<nama_pelanggan>[^/]+?)\\s*/",
        CEKPDAMPDG:
          "(?P<nama>[^/]+)/PERIODE:(?P<periode>[^/]+)/DENDA:(?P<denda>[^/]+)/RP\\.TAGIHAN:(?P<rp_tagihan>[^/]+)/TTL\\.TAGIHAN:(?P<tagihan>.*)",
        CEKTDOMQ: "(?P<tagihan>[\\d.,]+)\\}",
      };
    };

    const saveCektagihanConfig = async () => {
      if (!cektagihanConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/cektagihan-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: cektagihanConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: "Cektagihan configuration saved successfully!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to save cektagihan configuration",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Failed to save cektagihan configuration",
          });
        }
      } catch (error) {
        console.error("Error saving cektagihan config:", error);
        setMessage({
          type: "error",
          text: "Error saving cektagihan configuration",
        });
      } finally {
      }
    };

    const updateCektagihanConfig = (key: string, value: string) => {
      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: value,
        };
      });
    };

    const addNewCektagihanKey = () => {
      const newKey = `NEW_KEY_${Date.now()}`;
      setCektagihanConfig((prev) => ({
        ...prev,
        [newKey]: "(?P<tagihan>[\\d.,]+)",
      }));
    };

    const removeCektagihanKey = (key: string) => {
      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        delete newConfig[key];
        return newConfig;
      });
    };

    const updateCektagihanKeyName = (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;

      setCektagihanConfig((prev) => {
        if (!prev) return prev;
        const newConfig = { ...prev };
        const value = newConfig[oldKey];
        delete newConfig[oldKey];
        newConfig[newKey] = value;
        return newConfig;
      });
    };

    const handleCektagihanKeyNameChange = (oldKey: string, newKey: string) => {
      setLocalCektagihanKeys((prev) => ({
        ...prev,
        [oldKey]: newKey,
      }));
    };

    const handleCektagihanKeyNameBlur = (oldKey: string) => {
      const newKey = localCektagihanKeys[oldKey];
      if (newKey && newKey !== oldKey) {
        updateCektagihanKeyName(oldKey, newKey);
      }
    };

    const handleCektagihanKeyNameKeyDown = (
      oldKey: string,
      e: React.KeyboardEvent,
    ) => {
      if (e.key === "Enter") {
        const newKey = localCektagihanKeys[oldKey];
        if (newKey && newKey !== oldKey) {
          updateCektagihanKeyName(oldKey, newKey);
        }
      }
    };

    // Receipt Maps Configuration Functions
    const loadReceiptMapsConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, receiptMaps: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/receipt-maps-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setReceiptMapsConfig(data.config);
          } else {
            setReceiptMapsConfig(getDefaultReceiptMapsConfig());
          }
        } else {
          setReceiptMapsConfig(getDefaultReceiptMapsConfig());
        }
      } catch (error) {
        console.error("Error loading receipt maps config:", error);
        setReceiptMapsConfig(getDefaultReceiptMapsConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, receiptMaps: false }));
      }
    };

    const getDefaultReceiptMapsConfig = (): ReceiptMapsConfig => {
      return {
        configs: [
          {
            name: "TEST",
            product_prefixes: ["BPLN", "TEST%"],
            regex:
              "^(?P<nama>[^/]+)/TARIFDAYA:(?P<tarifdaya>[^/]+)/(?P<tarifsub>[^/]+)/PERIODE:(?P<periode>[^/]+)/STAND:(?P<stand>[^/]+)/REFF:(?P<ref>[^/]+)/TTL\\.TAGIHAN:(?P<tagihan>[^\\s]+)",
            highlight_key: "ref",
            dash: false,
            receipt_title: "STRUK PEMBAYARAN TAGIHAN PLN PASCABAYAR",
            info_text:
              "Simpan bukti struk ini sebagai bukti pembayaran yang sah.",
          },
          {
            name: "TOKEN",
            product_prefixes: ["PMP%", "PM%", "TOKENP%"],
            regex:
              "(?P<token>[\\dO-]+)/(?P<nama_pelanggan>[^/]+(?:/[^/]+)?)/(?P<golongan>[^/]+)/(?P<daya>[O0]*\\d+VA)/(?P<kwh>[\\d,-]+(?:[kK][wW][hH])?)",
            highlight_key: "token",
            dash: true,
            receipt_title: "STRUK PEMBELIAN LISTRIK PRABAYAR",
            info_text: "Info Hubungi Call Center 123 Atau Hubungi PLN Terdekat",
          },
          {
            name: "PDAMPDG",
            product_prefixes: ["PDAMPDG"],
            regex:
              "(?P<nama>.*?)/PERIODE:(?P<periode>[^/]+)/DENDA:(?P<denda>[^/]+)/TAGIHAN:(?P<tagihan>[^/]+)/REF:(?P<ref>.*)",
            highlight_key: "ref",
            dash: false,
            receipt_title: "STRUK PEMBBAYARAN TAGIHAN PDAM PRABAYAR",
            info_text: "Info Hubungi Kantor PDAM Terdekat",
          },
        ],
      };
    };

    const saveReceiptMapsConfig = async () => {
      if (!receiptMapsConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/receipt-maps-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: receiptMapsConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: "Receipt maps configuration saved successfully!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to save receipt maps configuration",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Failed to save receipt maps configuration",
          });
        }
      } catch (error) {
        console.error("Error saving receipt maps config:", error);
        setMessage({
          type: "error",
          text: "Error saving receipt maps configuration",
        });
      } finally {
      }
    };

    const updateReceiptConfig = (
      index: number,
      field: keyof ReceiptConfig,
      value: any,
    ) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[index] = { ...newConfigs[index], [field]: value };
        return { ...prev, configs: newConfigs };
      });
    };

    const addNewReceiptConfig = () => {
      const newConfig: ReceiptConfig = {
        name: `NEW_CONFIG_${Date.now()}`,
        product_prefixes: ["NEW%"],
        regex: "(?P<tagihan>[\\d.,]+)",
        highlight_key: "tagihan",
        dash: false,
        receipt_title: "STRUK PEMBAYARAN",
        info_text: "Simpan bukti struk ini sebagai bukti pembayaran yang sah.",
      };

      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs, newConfig];
        const newIndex = newConfigs.length - 1;

        // Auto-expand the new configuration
        setExpandedReceiptConfigs((prevExpanded) => {
          const newExpanded = new Set(prevExpanded);
          newExpanded.add(newIndex);
          return newExpanded;
        });

        return {
          ...prev,
          configs: newConfigs,
        };
      });
    };

    const removeReceiptConfig = (index: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = prev.configs.filter((_, i) => i !== index);
        return { ...prev, configs: newConfigs };
      });
    };

    const addProductPrefix = (configIndex: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: [
            ...newConfigs[configIndex].product_prefixes,
            `NEW_PREFIX_${Date.now()}`,
          ],
        };
        return { ...prev, configs: newConfigs };
      });
    };

    const removeProductPrefix = (configIndex: number, prefixIndex: number) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: newConfigs[configIndex].product_prefixes.filter(
            (_, i) => i !== prefixIndex,
          ),
        };
        return { ...prev, configs: newConfigs };
      });
    };

    const updateProductPrefix = (
      configIndex: number,
      prefixIndex: number,
      value: string,
    ) => {
      setReceiptMapsConfig((prev) => {
        if (!prev) return prev;
        const newConfigs = [...prev.configs];
        const newPrefixes = [...newConfigs[configIndex].product_prefixes];
        newPrefixes[prefixIndex] = value;
        newConfigs[configIndex] = {
          ...newConfigs[configIndex],
          product_prefixes: newPrefixes,
        };
        return { ...prev, configs: newConfigs };
      });
    };

    // Bantuan Configuration Functions
    const loadBantuanConfig = async () => {
      try {
        setLoadingStates((prev) => ({ ...prev, bantuan: true }));
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/bantuan-config");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config) {
            setBantuanConfig(data.config);
          } else {
            setBantuanConfig(getDefaultBantuanConfig());
          }
        } else {
          setBantuanConfig(getDefaultBantuanConfig());
        }
      } catch (error) {
        console.error("Error loading bantuan config:", error);
        setBantuanConfig(getDefaultBantuanConfig());
      } finally {
        setLoadingStates((prev) => ({ ...prev, bantuan: false }));
      }
    };

    const getDefaultBantuanConfig = (): BantuanConfig => {
      return {
        mainCard: "Butuh Bantuan?",
        mainCardContent:
          "Pusat bantuan kami siap membantu Anda. Temukan jawaban dari pertanyaan umum atau hubungi tim support kami.",
        topicTitle: "Topik Populer",
        topicCards: [
          {
            icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
            title: "Akun & Profile",
            desc: "Cara mengelola akun dan memperbarui profil.",
            url: "https://google.com",
          },
          {
            icon: "https://www.svgrepo.com/download/529011/heart-unlock.svg",
            title: "Keamanan",
            desc: "Tips menjaga keamanan akun dan transaksi",
            route: "/webview",
            routeArgs: {
              url: "https://google.com",
            },
          },
        ],
      };
    };

    const saveBantuanConfig = async () => {
      if (!bantuanConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");

        if (!sessionKey) {
          setMessage({ type: "error", text: "No admin session found" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/bantuan-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({ config: bantuanConfig }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: "Bantuan configuration saved successfully!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Failed to save bantuan configuration",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Failed to save bantuan configuration",
          });
        }
      } catch (error) {
        console.error("Error saving bantuan config:", error);
        setMessage({
          type: "error",
          text: "Error saving bantuan configuration",
        });
      } finally {
      }
    };

    const updateBantuanConfig = (field: keyof BantuanConfig, value: any) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });
    };

    const addNewTopicCard = () => {
      const newCard: TopicCard = {
        icon: "https://www.svgrepo.com/download/529282/user-hand-up.svg",
        title: `New Topic ${Date.now()}`,
        desc: "Description for the new topic",
        url: "https://example.com",
      };

      setBantuanConfig((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topicCards: [...prev.topicCards, newCard],
        };
      });
    };

    const removeTopicCard = (index: number) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = prev.topicCards.filter((_, i) => i !== index);
        return { ...prev, topicCards: newCards };
      });
    };

    const updateTopicCard = (
      index: number,
      field: keyof TopicCard,
      value: any,
    ) => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.topicCards];
        newCards[index] = { ...newCards[index], [field]: value };
        return { ...prev, topicCards: newCards };
      });
    };

    const setTopicCardLinkType = (index: number, type: "url" | "route") => {
      setBantuanConfig((prev) => {
        if (!prev) return prev;
        const newCards = [...prev.topicCards];
        if (type === "url") {
          newCards[index] = {
            ...newCards[index],
            url: newCards[index].url || "https://example.com",
            route: undefined,
            routeArgs: undefined,
          };
        } else {
          newCards[index] = {
            ...newCards[index],
            url: undefined,
            route: "/webview",
            routeArgs: {
              url: newCards[index].url || "https://example.com",
            },
          };
        }
        return { ...prev, topicCards: newCards };
      });
    };

    // App Info Configuration removed

    const saveAppRules = async () => {
      if (!appRules) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/app-rules/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            rules: appRules,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: data.message || "Pengaturan berhasil disimpan!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal menyimpan pengaturan",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal menyimpan pengaturan ke server",
          });
        }
      } catch (error) {
        console.error("Failed to save app rules:", error);
        setMessage({ type: "error", text: "Terjadi kesalahan saat menyimpan" });
      } finally {
      }
    };

    const saveInfoConfig = async () => {
      if (!infoConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/info-config/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: infoConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: data.message || "Konfigurasi info berhasil disimpan!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal menyimpan konfigurasi info",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal menyimpan konfigurasi info ke server",
          });
        }
      } catch (error) {
        console.error("Failed to save info config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat menyimpan konfigurasi info",
        });
      } finally {
      }
    };

    const saveTiketRegexConfig = async () => {
      if (!tiketRegexConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/tiket-regex/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: tiketRegexConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text:
                data.message || "Konfigurasi tiket regex berhasil disimpan!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal menyimpan konfigurasi tiket regex",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal menyimpan konfigurasi tiket regex ke server",
          });
        }
      } catch (error) {
        console.error("Failed to save tiket regex config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat menyimpan konfigurasi tiket regex",
        });
      } finally {
      }
    };

    const saveCheckProductsConfig = async () => {
      if (!checkProductsConfig) return;

      try {
        const sessionKey = localStorage.getItem("adminSessionKey");
        if (!sessionKey) {
          setMessage({ type: "error", text: "Session tidak valid" });
          return;
        }

        const apiUrl = await getApiUrl("/admin/check-products/save");
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": X_TOKEN_VALUE,
            "Session-Key": sessionKey,
            "Auth-Seed": authSeed,
          },
          body: JSON.stringify({
            config: checkProductsConfig,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMessage({
              type: "success",
              text: data.message || "Konfigurasi cek produk berhasil disimpan!",
            });
          } else {
            setMessage({
              type: "error",
              text: data.message || "Gagal menyimpan konfigurasi cek produk",
            });
          }
        } else {
          setMessage({
            type: "error",
            text: "Gagal menyimpan konfigurasi cek produk ke server",
          });
        }
      } catch (error) {
        console.error("Failed to save check products config:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat menyimpan konfigurasi cek produk",
        });
      } finally {
      }
    };

    // Unified save function for all configurations
    const saveAllConfigurations = async () => {
      console.log("Saving all system settings configurations...");

      try {
        // Save all configurations in sequence
        await Promise.all([
          saveAppRules(),
          saveInfoConfig(),
          saveTiketRegexConfig(),
          saveCheckProductsConfig(),
          saveCombotrxConfig(),
          saveCektagihanConfig(),
          saveReceiptMapsConfig(),
          saveBantuanConfig(),
        ]);

        setMessage({
          type: "success",
          text: "Semua konfigurasi berhasil disimpan!",
        });
      } catch (error) {
        console.error("Failed to save all configurations:", error);
        setMessage({
          type: "error",
          text: "Terjadi kesalahan saat menyimpan konfigurasi",
        });
      }
    };

    // Expose saveAllConfigurations function to parent component
    useImperativeHandle(ref, () => ({
      saveAllConfigurations,
    }));

    const updateRule = (key: string, value: any) => {
      if (!appRules) return;
      setAppRules({ ...appRules, [key]: value });
    };

    const updateInfoConfig = (key: string, value: any) => {
      if (!infoConfig) return;

      // Handle nested updates for message_config
      if (
        infoConfig.message_config &&
        infoConfig.message_config.hasOwnProperty(key)
      ) {
        setInfoConfig({
          ...infoConfig,
          message_config: {
            ...infoConfig.message_config,
            [key]: value,
          },
        });
      } else {
        // Handle top-level updates
        setInfoConfig({ ...infoConfig, [key]: value });
      }
    };

    const updateTiketRegexConfig = (key: string, value: any) => {
      if (!tiketRegexConfig) return;

      // Handle nested updates for tiket_regex
      if (
        tiketRegexConfig.tiket_regex &&
        tiketRegexConfig.tiket_regex.hasOwnProperty(key)
      ) {
        setTiketRegexConfig({
          ...tiketRegexConfig,
          tiket_regex: {
            ...tiketRegexConfig.tiket_regex,
            [key]: value,
          },
        });
      } else {
        // Handle top-level updates
        setTiketRegexConfig({ ...tiketRegexConfig, [key]: value });
      }
    };

    const updateCheckProductsConfig = (key: string, value: string[]) => {
      if (!checkProductsConfig) return;
      setCheckProductsConfig({ ...checkProductsConfig, [key]: value });
    };

    const addNewKey = () => {
      if (!checkProductsConfig) return;
      const newKey = `NEW_KEY_${Date.now()}`;
      setCheckProductsConfig({ ...checkProductsConfig, [newKey]: [""] });
    };


    const getFieldLabel = (key: string): string => {
      // Info config labels
      const infoConfigLabels: Record<string, string> = {
        otp_template: "Template OTP",
        user_inactive_message: "Pesan User Tidak Aktif",
        user_suspended_message: "Pesan User Disuspend",
        otp_success_message: "Pesan OTP Berhasil",
        auth_success_message: "Pesan Autentikasi Berhasil",
        auth_invalid_credentials_message: "Pesan Kredensial Tidak Valid",
        auth_otp_expired_message: "Pesan OTP Kedaluwarsa",
        auth_invalid_otp_message: "Pesan OTP Tidak Valid",
        cooldown_message: "Pesan Cooldown",
        attempt_limit_message: "Pesan Batas Percobaan",
        check_failed_message: "Pesan Gagal Cek",
      };

      // Tiket regex labels
      const tiketRegexLabels: Record<string, string> = {
        regex: "Regex Pattern",
      };

      // Return specific label for info config
      if (infoConfigLabels[key]) {
        return infoConfigLabels[key];
      }

      // Return specific label for tiket regex
      if (tiketRegexLabels[key]) {
        return tiketRegexLabels[key];
      }

      // Default label conversion for other settings
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    };


    const shouldShowField = (key: string, value: any): boolean => {
      // Exclude specific keys
      const excludedKeys = [
        "verificationFeature",
        "exchangePoinToSaldo",
        "permissionIntroFeatureEnabled",
        "blockNonVerifiedMLM",
        "exchangePoinToGift",
        "blockNonVerifiedTransfer",
        "biometrictTrxFeature",
        "editProfileFeature",
        "maximumVoucherActivation",
        "minimumProductPriceToDisplay",
        "cs_email",
        "cs_whatsapp",
        "cs_phone",
        "maxWelcomePosterPerDay",
        "newUserMarkup",
        "newUserGroup",
        "newUserUpline",
        "blockNonVerifiedTransfer",
        "blockNonVerifiedMLM",
        "maxTransaction",
        "maxTransactionsTotal",
        "whatsappHelp",
        "whatsappHelpFormat",
        "liveChatHelpFormat",
      ];
      
      if (excludedKeys.includes(key)) return false;
      
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        key.toLowerCase().includes(searchLower) ||
        getFieldLabel(key).toLowerCase().includes(searchLower) ||
        String(value).toLowerCase().includes(searchLower)
      );
    };


    const renderField = (
      key: string,
      value: any,
      updateFunction: (key: string, value: any) => void = updateRule,
    ) => {
      const displayValue = value === null || value === undefined ? "" : String(value);

      return (
        <div
          key={key}
          className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
        >
          {/* Key */}
          <div className="flex-shrink-0 w-1/3">
            <span className="text-sm font-mono text-gray-700 truncate block" title={key}>
              {key}
            </span>
          </div>
          
          {/* Separator */}
          <div className="flex-shrink-0 text-gray-400">|</div>
          
          {/* Value */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => updateFunction(key, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      );
    };

    // State for managing local input values to prevent focus loss
    const [localInputValues, setLocalInputValues] = useState<
      Record<string, string>
    >({});

    // Sync local input values when checkProductsConfig changes
    useEffect(() => {
      if (checkProductsConfig) {
        const newLocalValues: Record<string, string> = {};
        Object.keys(checkProductsConfig).forEach((key) => {
          const { baseName } = getKeyTypeAndName(key);
          newLocalValues[key] = baseName;
        });
        setLocalInputValues(newLocalValues);
      }
    }, [checkProductsConfig]);

    // Helper function to parse key type and name
    const getKeyTypeAndName = (
      key: string,
    ): { type: "regular" | "val" | "inq"; baseName: string } => {
      if (key.startsWith("VAL.")) {
        return { type: "val", baseName: key.substring(4) };
      } else if (key.startsWith("INQ.")) {
        return { type: "inq", baseName: key.substring(4) };
      } else {
        return { type: "regular", baseName: key };
      }
    };

    // Special render function for check products (key-value pairs with arrays)
    const renderCheckProductField = (
      key: string,
      products: string[],
      updateFunction: (key: string, value: string[]) => void,
    ) => {
      const { type, baseName } = getKeyTypeAndName(key);

      // Get local input value, initialize if not exists
      const localBaseName =
        localInputValues[key] !== undefined ? localInputValues[key] : baseName;

      // Update local input value
      const updateLocalInputValue = (newValue: string) => {
        setLocalInputValues((prev) => ({
          ...prev,
          [key]: newValue,
        }));
      };

      const getKeyDescription = (type: string): string => {
        switch (type) {
          case "val":
            return "Cek tagihan setelah mengisi nominal (contoh: Pulsa Nominal Bebas)";
          case "inq":
            return "Query paket tersedia (contoh: Combo Sakti, XL Cuan, Only 4u)";
          default:
            return "Konfigurasi produk untuk cek reguler";
        }
      };

      const updateKeyType = (
        newType: "regular" | "val" | "inq",
        newBaseName: string,
      ) => {
        let newKey: string;
        switch (newType) {
          case "val":
            newKey = `VAL.${newBaseName}`;
            break;
          case "inq":
            newKey = `INQ.${newBaseName}`;
            break;
          default:
            newKey = newBaseName;
        }

        if (newKey !== key) {
          // Update the key by removing old key and adding new key
          const newConfig = { ...checkProductsConfig };
          delete newConfig[key];
          newConfig[newKey] = products;
          setCheckProductsConfig(newConfig);
        }
      };

      return (
        <div
          key={key}
          className="p-3 bg-white rounded-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1.5">
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as "regular" | "val" | "inq";
                    updateKeyType(newType, baseName);
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regular">Regular Cek</option>
                  <option value="val">Val Cek</option>
                  <option value="inq">Inq Cek</option>
                </select>
                <input
                  type="text"
                  value={localBaseName}
                  onChange={(e) => updateLocalInputValue(e.target.value)}
                  onBlur={() => updateKeyType(type, localBaseName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateKeyType(type, localBaseName);
                      e.currentTarget.blur();
                    }
                  }}
                  className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1 py-1 flex-1"
                  placeholder="Masukkan nama key"
                />
                <button
                  onClick={() => {
                    const newConfig = { ...checkProductsConfig };
                    delete newConfig[key];
                    setCheckProductsConfig(newConfig);
                  }}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Hapus key ini"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-500">{getKeyDescription(type)}</p>
            </div>
            <button
              onClick={() => {
                const newProducts = [...products, ""];
                updateFunction(key, newProducts);
              }}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              + Add Product
            </button>
          </div>
          <div className="space-y-2">
            {products.map((product, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={product}
                  onChange={(e) => {
                    const newProducts = [...products];
                    newProducts[index] = e.target.value;
                    updateFunction(key, newProducts);
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan kode produk"
                />
                <button
                  onClick={() => {
                    const newProducts = products.filter((_, i) => i !== index);
                    updateFunction(key, newProducts);
                  }}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Group fields by category

    const groupFields = (rules: AppRules) => {
      const groups: Record<string, Array<[string, any]>> = {
        textEditing: [], // Single group for ALL fields
      };

      Object.entries(rules).forEach(([key, value]) => {
        // Put ALL fields into the textEditing group
        groups["textEditing"].push([key, value]);
      });

      return groups;
    };


    const toggleReceiptConfig = (configIndex: number) => {
      setExpandedReceiptConfigs((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(configIndex)) {
          newSet.delete(configIndex);
        } else {
          newSet.add(configIndex);
        }
        return newSet;
      });
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">
            Memuat pengaturan sistem...
          </span>
        </div>
      );
    }

    if (!appRules) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Gagal Memuat Pengaturan
          </h3>
          <p className="text-gray-600 mb-4">
            Tidak dapat memuat konfigurasi sistem
          </p>
          <button
            onClick={loadAppRules}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    const groupedFields = groupFields(appRules);

    // Individual save functions are available for each section

    return (
      <div className="space-y-4">
        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-md flex items-center space-x-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 overflow-hidden">
            <nav 
              className="flex overflow-x-auto" 
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
              aria-label="Tabs"
            >
              {infoConfig && (
                <button
                  onClick={() => setActiveTab("info_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "info_config"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Konfigurasi Pesan
                </button>
              )}
              {tiketRegexConfig && (
                <button
                  onClick={() => setActiveTab("tiket_regex")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "tiket_regex"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Regex Tiket Deposit
                </button>
              )}
              {checkProductsConfig && (
                <button
                  onClick={() => setActiveTab("check_products")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "check_products"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Cek Produk
                </button>
              )}
              {combotrxConfig && (
                <button
                  onClick={() => setActiveTab("combotrx_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "combotrx_config"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Regex Paket Combo
                </button>
              )}
              {cektagihanConfig && (
                <button
                  onClick={() => setActiveTab("cektagihan_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "cektagihan_config"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Regex Cek Produk
                </button>
              )}
              {receiptMapsConfig && (
                <button
                  onClick={() => setActiveTab("receipt_maps_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "receipt_maps_config"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Struk
                </button>
              )}
              {bantuanConfig && (
                <button
                  onClick={() => setActiveTab("bantuan_config")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "bantuan_config"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bantuan
                </button>
              )}
              {appRules && (
                <button
                  onClick={() => setActiveTab("textEditing")}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "textEditing"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Edit Teks & Pesan
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Info Config Section */}
            {infoConfig && activeTab === "info_config" && (
              <div className="px-4 pb-4">
                <div className="space-y-3">
                  {Object.entries(infoConfig).map(
                    ([sectionKey, sectionValue]) => {
                      if (
                        typeof sectionValue === "object" &&
                        sectionValue !== null
                      ) {
                        return (
                          <div
                            key={sectionKey}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h3 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                              {sectionKey.replace(/_/g, " ")}
                            </h3>
                            <div className="space-y-2">
                              {Object.entries(
                                sectionValue as Record<string, any>,
                              ).map(([key, value]) =>
                                renderField(key, value, updateInfoConfig),
                              )}
                            </div>
                          </div>
                        );
                      }
                      return renderField(
                        sectionKey,
                        sectionValue,
                        updateInfoConfig,
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* Tiket Regex Config Section */}
            {tiketRegexConfig && activeTab === "tiket_regex" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Regex Pattern:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>Group Name Wajib:</strong>
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;amount&gt;...)</strong> - Capture group untuk
                      nominal deposit (wajib)
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;name&gt;...)</strong> - Capture group untuk
                      nama pengirim (wajib)
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;note&gt;...)</strong> - Capture group untuk
                      catatan/pesan (wajib)
                    </li>
                    <li className="mt-2">
                      <strong>Group Name Bank (opsional):</strong>
                    </li>
                    <li className="ml-4">
                      <strong>(?P&lt;bank_bankname&gt;...)</strong> - Capture
                      group untuk nomor rekening bank (contoh:{" "}
                      <strong>bank_bri</strong>, <strong>bank_mandiri</strong>,{" "}
                      <strong>bank_bni</strong>, <strong>bank_bca</strong>,{" "}
                      <strong>bank_bsi</strong>)
                    </li>
                    <li className="mt-2">
                      <strong>Bank Tutup:</strong>
                    </li>
                    <li className="ml-4">
                      <strong>bank_close_bankname</strong> - Jika bank tutup,
                      gunakan regex group name dengan pola{" "}
                      <strong>bank_close_bankname</strong> (contoh:{" "}
                      <strong>bank_close_mandiri</strong>,{" "}
                      <strong>bank_close_bri</strong>)
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  {Object.entries(tiketRegexConfig).map(
                    ([sectionKey, sectionValue]) => {
                      if (
                        typeof sectionValue === "object" &&
                        sectionValue !== null
                      ) {
                        return (
                          <div
                            key={sectionKey}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h3 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                              {sectionKey.replace(/_/g, " ")}
                            </h3>
                            <div className="space-y-2">
                              {Object.entries(
                                sectionValue as Record<string, any>,
                              ).map(([key, value]) =>
                                renderField(key, value, updateTiketRegexConfig),
                              )}
                            </div>
                          </div>
                        );
                      }
                      return renderField(
                        sectionKey,
                        sectionValue,
                        updateTiketRegexConfig,
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* Check Products Config Section */}
            {checkProductsConfig && activeTab === "check_products" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Tipe Cek:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>Regular Cek</strong> - Cek produk biasa tanpa
                      prefix khusus
                    </li>
                    <li>
                      <strong>Val Cek</strong> - Cek tagihan setelah mengisi
                      nominal (contoh: Pulsa Nominal Bebas)
                    </li>
                    <li>
                      <strong>Inq Cek</strong> - Query paket tersedia (contoh:
                      Combo Sakti, XL Cuan, Only 4u)
                    </li>
                    <li>
                      <strong>%</strong> - Wildcard pattern dalam kode produk,
                      hati-hati produk lain dapat berimbas
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  {Object.entries(checkProductsConfig).map(([key, products]) =>
                    renderCheckProductField(
                      key,
                      products,
                      updateCheckProductsConfig,
                    ),
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={addNewKey}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah Key Baru</span>
                  </button>
                </div>
              </div>
            )}

            {/* Combotrx Config Section */}
            {combotrxConfig && activeTab === "combotrx_config" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Regex Pattern:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>
                        #
                        (?P&lt;kode&gt;\d+)\|(?P&lt;nama&gt;[^|]+)\|(?P&lt;harga_final&gt;\d+)
                      </strong>{" "}
                      - Pattern untuk parsing kode, nama, dan harga final
                    </li>
                    <li>
                      <strong>(?P&lt;kode&gt;\d+)</strong> - Capture group untuk
                      kode produk (angka)
                    </li>
                    <li>
                      <strong>(?P&lt;nama&gt;[^|]+)</strong> - Capture group
                      untuk nama produk (bukan karakter |)
                    </li>
                    <li>
                      <strong>(?P&lt;harga_final&gt;\d+)</strong> - Capture
                      group untuk harga final (angka)
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  {Object.entries(combotrxConfig).map(
                    ([header, headerData]) => (
                      <div
                        key={header}
                        className="p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={header}
                              onChange={(e) =>
                                updateCombotrxHeaderName(header, e.target.value)
                              }
                              className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1 py-1"
                              placeholder="Nama header"
                            />
                          </div>
                          <button
                            onClick={() => removeCombotrxHeader(header)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus header"
                          >
                            ×
                          </button>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(
                            headerData as Record<string, any>,
                          ).map(([field, value]) => (
                            <div
                              key={field}
                              className="flex items-center space-x-2"
                            >
                              <label className="text-xs font-medium text-gray-700 w-16">
                                {field}:
                              </label>
                              <input
                                type="text"
                                value={value as string}
                                onChange={(e) =>
                                  updateCombotrxConfig(
                                    header,
                                    field,
                                    e.target.value,
                                  )
                                }
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder={`Masukkan ${field}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={addNewCombotrxHeader}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah Header Baru</span>
                  </button>
                </div>
              </div>
            )}

            {/* Cektagihan Config Section */}
            {cektagihanConfig && activeTab === "cektagihan_config" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Regex Pattern:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>(?P&lt;tagihan&gt;.*)</strong> - Capture group
                      untuk nominal tagihan (wajib ada)
                    </li>
                    <li>
                      <strong>(?P&lt;nama&gt;[^/]+)</strong> - Capture group
                      untuk nama pelanggan
                    </li>
                    <li>
                      <strong>(?P&lt;periode&gt;[^/]+)</strong> - Capture group
                      untuk periode tagihan
                    </li>
                    <li>
                      <strong>(?P&lt;denda&gt;[^/]+)</strong> - Capture group
                      untuk denda
                    </li>
                    <li>
                      <strong>(?P&lt;custom&gt;[^/]+)</strong> - Capture group
                      untuk custom group (bebas ditambahkan sebagai opsional)
                    </li>
                    <li>
                      <strong>\\d+</strong> - Mencocokkan satu atau lebih digit
                    </li>
                    <li>
                      <strong>[^/]+</strong> - Mencocokkan satu atau lebih
                      karakter yang bukan "/"
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  {Object.entries(cektagihanConfig).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={localCektagihanKeys[key] || key}
                            onChange={(e) =>
                              handleCektagihanKeyNameChange(key, e.target.value)
                            }
                            onBlur={() => handleCektagihanKeyNameBlur(key)}
                            onKeyDown={(e) =>
                              handleCektagihanKeyNameKeyDown(key, e)
                            }
                            className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 px-1 py-1"
                            placeholder="Nama key"
                          />
                        </div>
                        <button
                          onClick={() => removeCektagihanKey(key)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Hapus key"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <label className="text-xs font-medium text-gray-700 w-16">
                            Regex:
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              updateCektagihanConfig(key, e.target.value)
                            }
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Masukkan regex pattern"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={addNewCektagihanKey}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah Key Baru</span>
                  </button>
                </div>
              </div>
            )}

            {/* Receipt Maps Config Section */}
            {receiptMapsConfig && activeTab === "receipt_maps_config" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Konfigurasi Struk:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>name</strong> - Nama konfigurasi struk
                    </li>
                    <li>
                      <strong>product_prefixes</strong> - Array prefix produk
                      yang menggunakan konfigurasi ini
                    </li>
                    <li>
                      <strong>regex</strong> - Pattern regex untuk parsing data
                      dari response. <strong>Catatan:</strong> Nama group regex
                      (contoh: <strong>(?P&lt;nama&gt;...)</strong>,{" "}
                      <strong>(?P&lt;tagihan&gt;...)</strong>) akan menjadi nama
                      key detail pada struk
                    </li>
                    <li>
                      <strong>highlight_key</strong> - Key yang akan
                      di-highlight pada struk (harus sesuai dengan nama group
                      regex)
                    </li>
                    <li>
                      <strong>dash</strong> - Untuk menambahkan separator (-)
                      pada nilai highlight_key setiap 4 digit. Contoh:
                      1234-5678-9012-3456
                    </li>
                    <li>
                      <strong>receipt_title</strong> - Judul yang ditampilkan di
                      struk
                    </li>
                    <li>
                      <strong>info_text</strong> - Teks informasi di bawah struk
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  {receiptMapsConfig.configs.map((config, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-md border border-gray-300 ml-4"
                    >
                      <div className="p-3 flex items-center justify-between">
                        <button
                          onClick={() => toggleReceiptConfig(index)}
                          className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md flex-1"
                        >
                          <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-gray-800">
                              Konfigurasi {config.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Klik untuk{" "}
                              {expandedReceiptConfigs.has(index)
                                ? "menyembunyikan"
                                : "menampilkan"}{" "}
                              detail
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeReceiptConfig(index)}
                            className="text-red-500 hover:text-red-700 p-1 text-sm"
                            title="Hapus konfigurasi"
                          >
                            ×
                          </button>
                          {expandedReceiptConfigs.has(index) ? (
                            <ChevronUp className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedReceiptConfigs.has(index) && (
                        <div className="px-3 pb-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700">
                                Nama:
                              </label>
                              <input
                                type="text"
                                value={config.name}
                                onChange={(e) =>
                                  updateReceiptConfig(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                placeholder="Nama konfigurasi"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-700">
                                Highlight Key:
                              </label>
                              <input
                                type="text"
                                value={config.highlight_key}
                                onChange={(e) =>
                                  updateReceiptConfig(
                                    index,
                                    "highlight_key",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                placeholder="Key yang di-highlight"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-700">
                                Dash:
                              </label>
                              <select
                                value={config.dash.toString()}
                                onChange={(e) =>
                                  updateReceiptConfig(
                                    index,
                                    "dash",
                                    e.target.value === "true",
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              >
                                <option value="false">False</option>
                                <option value="true">True</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-gray-700">
                                Receipt Title:
                              </label>
                              <input
                                type="text"
                                value={config.receipt_title}
                                onChange={(e) =>
                                  updateReceiptConfig(
                                    index,
                                    "receipt_title",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                placeholder="Judul struk"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="text-xs font-medium text-gray-700">
                              Product Prefixes:
                            </label>
                            <div className="space-y-2">
                              {config.product_prefixes.map(
                                (prefix, prefixIndex) => (
                                  <div
                                    key={prefixIndex}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="text"
                                      value={prefix}
                                      onChange={(e) =>
                                        updateProductPrefix(
                                          index,
                                          prefixIndex,
                                          e.target.value,
                                        )
                                      }
                                      className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                      placeholder="Product prefix (e.g., BPLN, TEST%, PMP%)"
                                    />
                                    <button
                                      onClick={() =>
                                        removeProductPrefix(index, prefixIndex)
                                      }
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remove prefix"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ),
                              )}
                              <button
                                onClick={() => addProductPrefix(index)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center space-x-1"
                              >
                                <span>+</span>
                                <span>Add Prefix</span>
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="text-xs font-medium text-gray-700">
                              Regex Pattern:
                            </label>
                            <textarea
                              value={config.regex}
                              onChange={(e) =>
                                updateReceiptConfig(
                                  index,
                                  "regex",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              rows={2}
                              placeholder="Regex pattern untuk parsing data"
                            />
                          </div>

                          <div className="mt-3">
                            <label className="text-xs font-medium text-gray-700">
                              Info Text:
                            </label>
                            <textarea
                              value={config.info_text}
                              onChange={(e) =>
                                updateReceiptConfig(
                                  index,
                                  "info_text",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              rows={2}
                              placeholder="Teks informasi di bawah struk"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={addNewReceiptConfig}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>+</span>
                    <span>Tambah Konfigurasi Baru</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bantuan Config Section */}
            {bantuanConfig && activeTab === "bantuan_config" && (
              <div className="px-4 pb-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-xs font-medium text-blue-900 mb-1">
                    Keterangan Konfigurasi Bantuan:
                  </h3>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    <li>
                      <strong>mainCard</strong> - Judul utama layar bantuan
                    </li>
                    <li>
                      <strong>mainCardContent</strong> - Deskripsi utama layar
                      bantuan
                    </li>
                    <li>
                      <strong>topicTitle</strong> - Judul untuk daftar topik
                    </li>
                    <li>
                      <strong>topicCards</strong> - Array kartu topik dengan
                      icon, judul, deskripsi, dan link
                    </li>
                    <li>
                      <strong>Link Types</strong> - URL langsung atau route
                      /webview dengan routeArgs
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  {/* Main Card Configuration */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Konfigurasi Kartu Utama
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Judul Kartu Utama:
                        </label>
                        <input
                          type="text"
                          value={bantuanConfig.mainCard}
                          onChange={(e) =>
                            updateBantuanConfig("mainCard", e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          placeholder="Butuh Bantuan?"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Konten Kartu Utama:
                        </label>
                        <textarea
                          value={bantuanConfig.mainCardContent}
                          onChange={(e) =>
                            updateBantuanConfig(
                              "mainCardContent",
                              e.target.value,
                            )
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          rows={2}
                          placeholder="Pusat bantuan kami siap membantu Anda..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Judul Topik:
                        </label>
                        <input
                          type="text"
                          value={bantuanConfig.topicTitle}
                          onChange={(e) =>
                            updateBantuanConfig("topicTitle", e.target.value)
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          placeholder="Topik Populer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topic Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Kartu Topik
                      </h3>
                      <button
                        onClick={addNewTopicCard}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                      >
                        <span>+</span>
                        <span>Tambah Kartu</span>
                      </button>
                    </div>

                    {bantuanConfig.topicCards.map((card, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Kartu {index + 1}
                          </h4>
                          <button
                            onClick={() => removeTopicCard(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus kartu"
                          >
                            ×
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700">
                              Icon URL:
                            </label>
                            <input
                              type="text"
                              value={card.icon}
                              onChange={(e) =>
                                updateTopicCard(index, "icon", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              placeholder="https://example.com/icon.svg"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-700">
                              Judul:
                            </label>
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) =>
                                updateTopicCard(index, "title", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              placeholder="Judul topik"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-medium text-gray-700">
                            Deskripsi:
                          </label>
                          <textarea
                            value={card.desc}
                            onChange={(e) =>
                              updateTopicCard(index, "desc", e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                            rows={2}
                            placeholder="Deskripsi topik"
                          />
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-medium text-gray-700">
                            Tipe Link:
                          </label>
                          <div className="flex items-center space-x-4 mt-1">
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`linkType-${index}`}
                                checked={!!card.url}
                                onChange={() =>
                                  setTopicCardLinkType(index, "url")
                                }
                                className="rounded"
                              />
                              <span className="text-xs text-gray-700">
                                URL Langsung
                              </span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name={`linkType-${index}`}
                                checked={!!card.route}
                                onChange={() =>
                                  setTopicCardLinkType(index, "route")
                                }
                                className="rounded"
                              />
                              <span className="text-xs text-gray-700">
                                Route /webview
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="text-xs font-medium text-gray-700">
                            {card.url ? "URL:" : "URL dalam routeArgs:"}
                          </label>
                          <input
                            type="text"
                            value={card.url || card.routeArgs?.url || ""}
                            onChange={(e) => {
                              if (card.url) {
                                updateTopicCard(index, "url", e.target.value);
                              } else {
                                updateTopicCard(index, "routeArgs", {
                                  url: e.target.value,
                                });
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Sections (Text Editing) */}
            {Object.entries(groupedFields)
              .sort(([a], [b]) => {
                return a.localeCompare(b);
              })
              .map(([section, fields]) => {
                const filteredFields = fields.filter(
                  ([key, value]) => shouldShowField(key, value),
                );

                if (filteredFields.length === 0) return null;

                if (activeTab !== section) return null;

                return (
                  <div className="px-4 pb-4">
                    {/* Search and Filter - only for textEditing section */}
                    {section === "textEditing" && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <div className="flex flex-col md:flex-row gap-3">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Cari pengaturan teks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {filteredFields.map(([key, value]) =>
                        renderField(key, value),
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  },
);

SystemSettings.displayName = "SystemSettings";

export default SystemSettings;
