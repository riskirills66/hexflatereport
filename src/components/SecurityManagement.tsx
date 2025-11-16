import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Shield, AlertTriangle, CheckCircle, Settings, ToggleLeft, ToggleRight, Clock, Info } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface SecurityManagementProps {
  authSeed: string;
  onNavigate: (section: string) => void;
}

interface SecurityManagementRef {
  saveAllConfigurations: () => Promise<void>;
}

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
}

interface SecurityConfig {
  server_config: {};
  database_config: {
    connectionstring: string;
  };
  cors_config?: {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    allow_credentials: boolean;
  };
  balance_transfer?: {
    add_format: string;
    trans_format: string;
  };
  combotrx?: {
    outbox_like_pattern: string;
    pesan_format_no_val: string;
    pesan_format_with_val: string;
    sdh_pernah_filter: string;
  };
  commission_exchange?: {
    tukar_format: string;
  };
  history?: {
    minimum_harga_to_display_in_history: number;
  };
  poin?: {
    exchange_rate: number;
    minimum_exchange?: number;
  };
  outbox_patterns?: {
    static_patterns: {
      transaksi_sukses: {
        title: string;
        pattern: string;
      };
      transaksi_proses: {
        title: string;
        pattern: string;
      };
      transaksi_gagal: {
        title: string;
        pattern: string;
      };
    };
    dynamic_patterns: {
      [key: string]: {
        title: string;
        pattern: string;
      };
    };
  };
}

interface SecurityConfigResponse {
  success: boolean;
  message: string;
  config?: SecurityConfig;
}

// Dynamic type for any app rules
type AppRules = Record<string, any>;

// Cutoff configuration type
interface CutoffConfig {
  cutoff_start: string;
  cutoff_end: string;
}

const SecurityManagement = forwardRef<SecurityManagementRef, SecurityManagementProps>(
  ({ authSeed, onNavigate }, ref) => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<CurrentAdminInfo | null>(null);
  const [dynamicPatternOrder, setDynamicPatternOrder] = useState<string[]>([]);
  const [demoNumber, setDemoNumber] = useState<string | null>(null);
  const [loadingDemoNumber, setLoadingDemoNumber] = useState(false);
  
  // Priority settings state
  const [appRules, setAppRules] = useState<AppRules | null>(null);
  const [loadingAppRules, setLoadingAppRules] = useState(false);
  const [dynamicRules, setDynamicRules] = useState<AppRules | null>(null);
  
  // Cutoff configuration state
  const [cutoffConfig, setCutoffConfig] = useState<CutoffConfig | null>(null);
  const [loadingCutoff, setLoadingCutoff] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('priority_settings');

  useEffect(() => {
    fetchCurrentAdminInfo();
  }, []);

  useEffect(() => {
    if (currentAdminInfo?.is_super_admin) {
      loadSecurityConfig();
      loadAppRules();
      loadDynamicRules();
      loadCutoffConfig();
      loadDemoNumber();
    } else if (currentAdminInfo && !currentAdminInfo.is_super_admin) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Access denied. Only super admins can access security configuration.' });
    }
  }, [currentAdminInfo]);

  // Initialize dynamic pattern order when config loads
  useEffect(() => {
    if (config?.outbox_patterns?.dynamic_patterns && dynamicPatternOrder.length === 0) {
      setDynamicPatternOrder(Object.keys(config.outbox_patterns.dynamic_patterns));
    }
  }, [config?.outbox_patterns?.dynamic_patterns, dynamicPatternOrder.length]);

  // Set initial active tab to first available config when loading completes
  useEffect(() => {
    if (!loading && config) {
      // Only set if current tab's config doesn't exist
      const currentTabHasConfig = 
        (activeTab === 'priority_settings' && appRules) ||
        (activeTab === 'transfer_transaksi' && (config.balance_transfer || config.combotrx || config.commission_exchange)) ||
        (activeTab === 'produk_poin' && (config.history || config.poin)) ||
        (activeTab === 'outbox_patterns' && config.outbox_patterns) ||
        (activeTab === 'cutoff' && cutoffConfig) ||
        (activeTab === 'demo_number' && demoNumber !== null);

      if (!currentTabHasConfig) {
        // Set to first available tab
        if (appRules) setActiveTab('priority_settings');
        else if (config.balance_transfer || config.combotrx || config.commission_exchange) setActiveTab('transfer_transaksi');
        else if (config.history || config.poin) setActiveTab('produk_poin');
        else if (config.outbox_patterns) setActiveTab('outbox_patterns');
        else if (cutoffConfig) setActiveTab('cutoff');
        else if (demoNumber !== null) setActiveTab('demo_number');
      }
    }
  }, [loading, config, appRules, cutoffConfig, demoNumber, activeTab]);


  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        return;
      }

      const apiUrl = await getApiUrl('/current-admin-info');
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: CurrentAdminInfo = await response.json();

      if (response.ok) {
        setCurrentAdminInfo(data);
      } else {
        console.error('Failed to fetch current admin info:', data);
        setMessage({ type: 'error', text: 'Failed to verify admin privileges.' });
      }
    } catch (error) {
      console.error('Failed to fetch current admin info:', error);
      setMessage({ type: 'error', text: 'Failed to verify admin privileges.' });
    }
  };

  const loadSecurityConfig = async () => {
    try {
      setLoading(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/security-config');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: SecurityConfigResponse = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to load security configuration' });
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
      setMessage({ type: 'error', text: 'Failed to load security configuration' });
    } finally {
      setLoading(false);
    }
  };

  const loadDemoNumber = async () => {
    try {
      setLoadingDemoNumber(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        setLoadingDemoNumber(false);
        return;
      }
      const apiUrl = await getApiUrl('/admin/demo-config');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setDemoNumber(data.demo_number || null);
      } else {
        setDemoNumber(null);
      }
    } catch (_e) {
      setDemoNumber(null);
    } finally {
      setLoadingDemoNumber(false);
    }
  };


  const updateConfig = (section: keyof SecurityConfig, field: string, value: any) => {
    if (!config) return;

    setConfig(prev => {
      if (!prev) return null;
      
      const newConfig = { ...prev };
      if (section === 'server_config') {
        newConfig.server_config = { ...prev.server_config, [field]: value };
      } else if (section === 'database_config') {
        newConfig.database_config = { ...prev.database_config, [field]: value };
      } else if (section === 'cors_config' && newConfig.cors_config) {
        newConfig.cors_config = { 
          ...prev.cors_config, 
          [field]: value 
        } as SecurityConfig['cors_config'];
      } else if (section === 'balance_transfer' && newConfig.balance_transfer) {
        newConfig.balance_transfer = {
          ...prev.balance_transfer,
          [field]: value
        } as SecurityConfig['balance_transfer'];
      } else if (section === 'combotrx' && newConfig.combotrx) {
        newConfig.combotrx = {
          ...prev.combotrx,
          [field]: value
        } as SecurityConfig['combotrx'];
      } else if (section === 'commission_exchange' && newConfig.commission_exchange) {
        newConfig.commission_exchange = {
          ...prev.commission_exchange,
          [field]: value
        } as SecurityConfig['commission_exchange'];
      } else if (section === 'history' && newConfig.history) {
        newConfig.history = {
          ...prev.history,
          [field]: value
        } as SecurityConfig['history'];
      } else if (section === 'poin' && newConfig.poin) {
        newConfig.poin = {
          ...prev.poin,
          [field]: value
        } as SecurityConfig['poin'];
      } else if (section === 'outbox_patterns' && newConfig.outbox_patterns && prev.outbox_patterns) {
        if (field.startsWith('static_')) {
          const staticField = field.replace('static_', '') as keyof NonNullable<SecurityConfig['outbox_patterns']>['static_patterns'];
          newConfig.outbox_patterns = {
            ...prev.outbox_patterns,
            static_patterns: {
              ...(prev.outbox_patterns as any).static_patterns,
              [staticField]: value
            }
          } as SecurityConfig['outbox_patterns'];
        } else if (field.startsWith('dynamic_')) {
          const dynamicKey = field.replace('dynamic_', '');
          newConfig.outbox_patterns = {
            ...prev.outbox_patterns,
            dynamic_patterns: {
              ...(prev.outbox_patterns as any).dynamic_patterns,
              [dynamicKey]: value
            }
          } as SecurityConfig['outbox_patterns'];
        }
      }
      
      return newConfig;
    });
  };

  const initializeOutboxPatterns = () => {
    if (!config) return;
    
    const initialDynamicPatterns = {
      dynamic_sukses: {
        title: "Deposit Berhasil",
        pattern: "(?i)ditambahkan"
      },
      dynamic_dibatalkan: {
        title: "Tiket Deposit Dibatalkan",
        pattern: "Tiket .* sudah dibatalkan \\(kadaluarsa\\)\\."
      }
    };
    
    setConfig(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        outbox_patterns: {
          static_patterns: {
            transaksi_sukses: {
              title: "Transaksi Sukses",
              pattern: "(?i)sukses"
            },
            transaksi_proses: {
              title: "Transaksi Dalam Proses",
              pattern: "(?i)proses"
            },
            transaksi_gagal: {
              title: "Transaksi Gagal",
              pattern: "(?i)Gagal"
            }
          },
          dynamic_patterns: initialDynamicPatterns
        }
      };
    });
    
    // Set the initial order
    setDynamicPatternOrder(Object.keys(initialDynamicPatterns));
  };

  const addDynamicPattern = () => {
    if (!config?.outbox_patterns) return;

    // Generate a unique key based on current dynamic patterns count
    const currentCount = Object.keys(config.outbox_patterns.dynamic_patterns).length;
    const key = `dynamic_pattern_${currentCount + 1}`;
    const title = `Custom Pattern ${currentCount + 1}`;
    const pattern = "(?i)custom";

    updateConfig('outbox_patterns', `dynamic_${key}`, {
      title: title,
      pattern: pattern
    });
    
    // Add to the order array
    setDynamicPatternOrder(prev => [...prev, key]);
  };

  const cleanKey = (key: string): string => {
    return key.replace(/\s+/g, ''); // Remove all spaces
  };

  const removeDynamicPattern = (key: string) => {
    if (!config?.outbox_patterns) return;

    setConfig(prev => {
      if (!prev?.outbox_patterns) return null;
      
      const newDynamicPatterns = { ...prev.outbox_patterns.dynamic_patterns };
      delete newDynamicPatterns[key];
      
      return {
        ...prev,
        outbox_patterns: {
          ...prev.outbox_patterns,
          dynamic_patterns: newDynamicPatterns
        }
      };
    });
    
    // Remove from the order array
    setDynamicPatternOrder(prev => prev.filter(k => k !== key));
  };

  // Priority Settings Functions
  const loadAppRules = async () => {
    try {
      setLoadingAppRules(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session tidak valid' });
        setAppRules(getDefaultRules());
        return;
      }

      const apiUrl = await getApiUrl('/admin/app-rules');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rules) {
          setAppRules(data.rules);
        } else {
          setMessage({ type: 'error', text: data.message || 'Gagal memuat pengaturan' });
          setAppRules(getDefaultRules());
        }
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat pengaturan dari server' });
        setAppRules(getDefaultRules());
      }
    } catch (error) {
      console.error('Failed to load app rules:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat pengaturan' });
      setAppRules(getDefaultRules());
    } finally {
      setLoadingAppRules(false);
    }
  };

  const loadDynamicRules = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session tidak valid' });
        setDynamicRules({});
        return;
      }

      const apiUrl = await getApiUrl('/admin/app-rules');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.rules) {
          // Filter rules that start with the specified prefixes
          const dynamicRulesFiltered: AppRules = {};
          const prefixes = ['newUserUpline', 'newUserGroup', 'newUserMarkup'];
          
          Object.entries(data.rules).forEach(([key, value]) => {
            if (prefixes.some(prefix => key.startsWith(prefix))) {
              dynamicRulesFiltered[key] = value;
            }
          });
          
          setDynamicRules(dynamicRulesFiltered);
        } else {
          setDynamicRules(getDefaultDynamicRules());
        }
      } else {
        setDynamicRules(getDefaultDynamicRules());
      }
    } catch (error) {
      console.error('Failed to load dynamic rules:', error);
      setDynamicRules(getDefaultDynamicRules());
    }
  };

  const loadCutoffConfig = async () => {
    try {
      setLoadingCutoff(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session tidak valid' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/cutoff-config');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data = await response.json();

      if (data.success && data.config) {
        setCutoffConfig(data.config);
      } else {
        console.error('Failed to load cutoff config:', data.message);
        setCutoffConfig(getDefaultCutoffConfig());
      }
    } catch (error) {
      console.error('Failed to load cutoff config:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat konfigurasi cutoff' });
      setCutoffConfig(getDefaultCutoffConfig());
    } finally {
      setLoadingCutoff(false);
    }
  };

  const getDefaultCutoffConfig = (): CutoffConfig => ({
    cutoff_start: '23:45',
    cutoff_end: '00:15',
  });

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
    cs_phone: '+628123456789',
    cs_whatsapp: '628123456789',
    cs_email: 'support@company.com',
    newUserGroup: 'X',
    newUserUpline: '',
    
    // WhatsApp Help Configuration
    whatsappHelp: true,
    whatsappHelpFormat: 'https://wa.me/6285274444440?text=Halo%20kak%2C%20bantu%20cek%20transaksi%20berikut%2C%{inv}%2C%20{product}%2C%20{number}%2C%{tgl_entri}',
    liveChatHelpFormat: 'Halo kak, bantu cek transaksi berikut, {inv}, {product}, {number}, {tgl_entri}',
    
    // Sample messages (in real implementation, this would load all 900+ fields)
    authBiometricReason: 'Autentikasi dengan biometrik',
    authTooManyRetriesMessage: 'Terlalu banyak percobaan PIN gagal. Anda akan keluar.',
    authBiometricNotSupportedMessage: 'Fitur biometrik tidak didukung pada perangkat atau sistem operasi ini.',
    authBiometricNotAvailableMessage: 'Biometrik tidak tersedia di perangkat ini.',
    authBiometricFailedMessage: 'Autentikasi biometrik gagal atau dibatalkan.',
    authBiometricErrorMessage: 'Terjadi kesalahan biometrik.',
    authNoBiometricEnrolledMessage: 'Tidak ada biometrik yang terdaftar di perangkat ini.',
    authBiometricLockedMessage: 'Sensor biometrik terkunci. Silakan coba lagi nanti.',
    authBiometricNotAvailableDeviceMessage: 'Fitur biometrik tidak tersedia di perangkat ini.',
    authPasscodeNotSetMessage: 'Setel kunci layar perangkat Anda untuk menggunakan biometrik.',
    authGeneralErrorMessage: 'Terjadi kesalahan: ',
    authSessionNotFoundMessage: 'Session tidak ditemukan.',
    authCannotConnectMessage: 'Tidak dapat terhubung ke server.',
    authWrongPinMessage: 'PIN salah.',
    authEnterPinMessage: 'Masukkan PIN Anda',
    authPinLabel: 'PIN',
    authPinValidationMessage: 'PIN harus 6 digit',
    authVerifyPinButtonText: 'Verifikasi PIN',
    authBackToNumpadButtonText: 'Kembali ke Numpad',
  });

  const getDefaultDynamicRules = (): AppRules => ({
    // Example dynamic rules with different suffixes
    newUserUplineHexflateBlue: 'HEX001',
    newUserGroupHexflateBlue: 'Premium',
    newUserMarkupHexflateBlue: 75,
    newUserUplineHexflateRed: 'HEX002',
    newUserGroupHexflateRed: 'Standard',
    newUserMarkupHexflateRed: 50,
  });

  const updateRule = (key: string, value: any) => {
    if (!appRules) return;
    setAppRules({ ...appRules, [key]: value });
  };

  const updateDynamicRule = (key: string, value: any) => {
    if (!dynamicRules) return;
    setDynamicRules({ ...dynamicRules, [key]: value });
  };

  // Define priority settings that should appear at the top
  const prioritySettings = [
    'verificationFeature',
    'editProfileFeature', 
    'biometrictTrxFeature',
    'maxTransactionsTotal',
    'maxTransaction',
    'blockNonVerifiedMLM',
    'blockNonVerifiedTransfer',
    'maxWelcomePosterPerDay',
    'cs_phone',
    'cs_whatsapp',
    'cs_email',
    'exchangePoinToSaldo',
    'exchangePoinToGift',
    'minimumProductPriceToDisplay',
    'maximumVoucherActivation',
    'permissionIntroFeatureEnabled',
    'whatsappHelp',
    'whatsappHelpFormat',
    'liveChatHelpFormat'
  ];

  // Dynamic field type detection and rendering
  const getFieldType = (key: string, value: any): 'boolean' | 'number' | 'string' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    
    // Special handling for dynamic rules based on prefix
    if (key.startsWith('newUserMarkup')) {
      return 'number';
    }
    if (key.startsWith('newUserUpline') || key.startsWith('newUserGroup')) {
      return 'string';
    }
    
    return 'string';
  };

  const getFieldLabel = (key: string): string => {
    // Priority settings labels
    const priorityLabels: Record<string, string> = {
      'verificationFeature': 'Fitur Verifikasi',
      'editProfileFeature': 'Fitur Edit Profil',
      'biometrictTrxFeature': 'Fitur Biometric',
      'maxTransactionsTotal': 'Maksimal Total Transaksi',
      'maxTransaction': 'Maksimal Per Transaksi',
      'blockNonVerifiedMLM': 'Blokir Registrasi Agen',
      'blockNonVerifiedTransfer': 'Blokir Transfer',
      'newUserGroup': 'Level Grup Member Baru',
      'newUserMarkup': 'Markup Member Baru',
      'newUserUpline': 'Kode Upline Member Baru',
      'maxWelcomePosterPerDay': 'Maximal Welcome Poster Per Hari',
      'cs_phone': 'Nomor HP CS',
      'cs_whatsapp': 'Nomor Whatsapp CS',
      'cs_email': 'Email CS',
      'exchangePoinToSaldo': 'Tukar Poin ke Saldo',
      'exchangePoinToGift': 'Tukar Poin Ke Hadiah',
      'minimumProductPriceToDisplay': 'Minimum Harga Produk',
      'maximumVoucherActivation': 'Maximal Aktivasi Voucher',
      'permissionIntroFeatureEnabled': 'Izin Aplikasi Pertama Login',
      'whatsappHelp': 'Aktifkan Bantuan WhatsApp',
      'whatsappHelpFormat': 'Format URL Bantuan WhatsApp',
      'liveChatHelpFormat': 'Format Pesan Bantuan Live Chat'
    };

    // Return specific label for priority settings
    if (priorityLabels[key]) {
      return priorityLabels[key];
    }

    // Handle dynamic rules
    if (key.startsWith('newUserUpline')) {
      const suffix = key.replace('newUserUpline', '');
      return `Kode Upline ${suffix || 'Default'}`;
    }
    if (key.startsWith('newUserGroup')) {
      const suffix = key.replace('newUserGroup', '');
      return `Level Grup ${suffix || 'Default'}`;
    }
    if (key.startsWith('newUserMarkup')) {
      const suffix = key.replace('newUserMarkup', '');
      return `Markup ${suffix || 'Default'}`;
    }

    // Default label conversion for other settings
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getFieldDescription = (key: string, value: any): string => {
    // Priority settings descriptions
    const priorityDescriptions: Record<string, string> = {
      'verificationFeature': 'Fitur Verifikasi',
      'editProfileFeature': 'Fitur Edit Profil',
      'biometrictTrxFeature': 'Fitur Biometric',
      'maxTransactionsTotal': 'Maksimal Total Transaksi Untuk Member Yang Belum Ditandai Aman',
      'maxTransaction': 'Maksimal Per Transaksi Untuk Member Yang Belum Ditandai Aman',
      'blockNonVerifiedMLM': 'Blokir Fitur Registrasi Agen Untuk Member Belum Verifikasi',
      'blockNonVerifiedTransfer': 'Blokir Fitur Transfer Untuk Member Belum Verifikasi',
      'newUserGroup': 'Level Grup Member Baru',
      'newUserMarkup': 'Markup Member Baru',
      'newUserUpline': 'Kode Upline Member Baru',
      'maxWelcomePosterPerDay': 'Maximal Welcome Poster Muncul Per Hari',
      'cs_phone': 'Nomor HP CS',
      'cs_whatsapp': 'Nomor Whatsapp CS',
      'cs_email': 'Email CS',
      'exchangePoinToSaldo': 'Fitur Tukar Poin ke Saldo',
      'exchangePoinToGift': 'Fitur Tukar Poin Ke Hadiah',
      'minimumProductPriceToDisplay': 'Minimum Harga Produk Yang Muncul',
      'maximumVoucherActivation': 'Maximal Aktivasi Voucher Masal',
      'permissionIntroFeatureEnabled': 'Munculkan Izin Aplikasi Saat Pertama Kali Login',
      'whatsappHelp': 'Jika aktif, tombol bantuan di detail transaksi akan mengarah ke WhatsApp. Jika tidak aktif, akan menggunakan live chat di aplikasi',
      'whatsappHelpFormat': 'Format URL WhatsApp untuk bantuan transaksi. Gunakan placeholder: {inv} (ID transaksi), {product} (kode produk), {number} (nomor tujuan), {tgl_entri} (tanggal entri)',
      'liveChatHelpFormat': 'Format pesan untuk live chat bantuan transaksi. Gunakan placeholder: {inv} (ID transaksi), {product} (kode produk), {number} (nomor tujuan), {tgl_entri} (tanggal entri)'
    };

    // Return specific description for priority settings
    if (priorityDescriptions[key]) {
      return priorityDescriptions[key];
    }

    // Handle dynamic rules
    if (key.startsWith('newUserUpline')) {
      const suffix = key.replace('newUserUpline', '');
      return `Kode upline untuk member baru dengan aplikasi ${suffix || 'default'}`;
    }
    if (key.startsWith('newUserGroup')) {
      const suffix = key.replace('newUserGroup', '');
      return `Level grup untuk member baru dengan aplikasi ${suffix || 'default'}`;
    }
    if (key.startsWith('newUserMarkup')) {
      const suffix = key.replace('newUserMarkup', '');
      return `Persentase markup untuk member baru dengan aplikasi ${suffix || 'default'}`;
    }

    // Default descriptions for other settings
    const type = getFieldType(key, value);
    if (type === 'boolean') {
      return 'Toggle untuk mengaktifkan/menonaktifkan fitur ini';
    } else if (type === 'number') {
      return 'Masukkan nilai numerik';
    } else {
      return 'Masukkan teks atau pesan';
    }
  };

  const renderField = (key: string, value: any) => {
    const type = getFieldType(key, value);
    const label = getFieldLabel(key);
    const description = getFieldDescription(key, value);

    if (type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
          </div>
          <button
            onClick={() => updateRule(key, !value)}
            className="ml-4 flex items-center"
          >
            {value ? (
              <ToggleRight className="h-6 w-6 text-green-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </button>
        </div>
      );
    } else if (type === 'number') {
      return (
        <div key={key} className="p-3 bg-white rounded-lg border border-gray-200">
          <label className="block">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => updateRule(key, parseInt(e.target.value) || 0)}
              className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>
      );
    } else {
      const isLongText = String(value).length > 50;
      return (
        <div key={key} className="p-3 bg-white rounded-lg border border-gray-200">
          <label className="block">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
            {isLongText ? (
              <textarea
                value={value || ''}
                onChange={(e) => updateRule(key, e.target.value)}
                rows={2}
                className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => updateRule(key, e.target.value)}
                className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </label>
        </div>
      );
    }
  };

  const renderDynamicField = (key: string, value: any) => {
    const type = getFieldType(key, value);
    const label = getFieldLabel(key);
    const description = getFieldDescription(key, value);

    if (type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
          </div>
          <button
            onClick={() => updateDynamicRule(key, !value)}
            className="ml-4 flex items-center"
          >
            {value ? (
              <ToggleRight className="h-6 w-6 text-green-600" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-400" />
            )}
          </button>
        </div>
      );
    } else if (type === 'number') {
      return (
        <div key={key} className="p-3 bg-white rounded-lg border border-gray-200">
          <label className="block">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => updateDynamicRule(key, parseInt(e.target.value) || 0)}
              className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>
      );
    } else {
      const isLongText = String(value).length > 50;
      return (
        <div key={key} className="p-3 bg-white rounded-lg border border-gray-200">
          <label className="block">
            <h3 className="text-sm font-medium text-gray-900">{label}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{key}</p>
            {isLongText ? (
              <textarea
                value={value || ''}
                onChange={(e) => updateDynamicRule(key, e.target.value)}
                rows={2}
                className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => updateDynamicRule(key, e.target.value)}
                className="mt-1.5 w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </label>
        </div>
      );
    }
  };

  // Unified save function that saves both configurations
  const saveAllConfigurations = async () => {
    const sessionKey = localStorage.getItem('adminSessionKey');
    if (!sessionKey) {
      setMessage({ type: 'error', text: 'Session tidak valid' });
      return;
    }

    const results = [];
    let hasErrors = false;

    // Save Security Configuration
    if (config) {
      try {
        // Clean all dynamic pattern keys before saving
        const cleanedConfig = { ...config };
        if (cleanedConfig.outbox_patterns?.dynamic_patterns) {
          const cleanedDynamicPatterns: { [key: string]: { title: string; pattern: string } } = {};
          Object.entries(cleanedConfig.outbox_patterns.dynamic_patterns).forEach(([key, pattern]) => {
            const cleanedKey = cleanKey(key);
            cleanedDynamicPatterns[cleanedKey] = pattern;
          });
          cleanedConfig.outbox_patterns.dynamic_patterns = cleanedDynamicPatterns;
        }

        const apiUrl = await getApiUrl('/admin/security-config/save');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
          body: JSON.stringify({ config: cleanedConfig }),
        });

        const data: SecurityConfigResponse = await response.json();
        if (data.success) {
          results.push('Security configuration saved successfully');
        } else {
          results.push(`Security config error: ${data.message || 'Failed to save'}`);
          hasErrors = true;
        }
      } catch (error) {
        results.push('Security config error: Network error');
        hasErrors = true;
      }
    }

    // Save App Rules (Priority Settings + Dynamic Rules)
    if (appRules) {
      try {
        // Merge dynamic rules with app rules if they exist
        const rulesToSave = dynamicRules ? { ...appRules, ...dynamicRules } : appRules;
        
        const apiUrl = await getApiUrl('/admin/app-rules/save');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
          body: JSON.stringify({
            rules: rulesToSave,
          }),
        });

        const data = await response.json();
        if (data.success) {
          results.push('App rules saved successfully');
        } else {
          results.push(`App rules error: ${data.message || 'Failed to save'}`);
          hasErrors = true;
        }
      } catch (error) {
        results.push('App rules error: Network error');
        hasErrors = true;
      }
    }

    // Save Cutoff Configuration
    if (cutoffConfig) {
      try {
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(cutoffConfig.cutoff_start) || !timeRegex.test(cutoffConfig.cutoff_end)) {
          results.push('Cutoff config error: Invalid time format. Please use HH:MM format');
          hasErrors = true;
        } else {
          const apiUrl = await getApiUrl('/admin/cutoff-config/save');
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Token': X_TOKEN_VALUE,
              'Session-Key': sessionKey,
              'Auth-Seed': authSeed,
            },
            body: JSON.stringify({ config: cutoffConfig }),
          });

          const data = await response.json();
          if (data.success) {
            results.push('Cutoff configuration saved successfully');
          } else {
            results.push(`Cutoff config error: ${data.message || 'Failed to save'}`);
            hasErrors = true;
          }
        }
      } catch (error) {
        results.push('Cutoff config error: Network error');
        hasErrors = true;
      }
    }

    // Show result message
    if (hasErrors) {
      setMessage({ 
        type: 'error', 
        text: `Some configurations failed to save: ${results.join('; ')}` 
      });
    } else {
      setMessage({ 
        type: 'success', 
        text: 'All configurations saved successfully!' 
      });
    }

    // Reload configurations to get updated values
    setTimeout(() => {
      if (config) loadSecurityConfig();
      if (appRules) {
        loadAppRules();
        loadDynamicRules(); // Reload dynamic rules after app rules
      }
      if (cutoffConfig) loadCutoffConfig();
    }, 1000);
  };

  // Expose save function to parent component via ref
  useImperativeHandle(ref, () => ({
    saveAllConfigurations
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading security configuration...</span>
      </div>
    );
  }


  // Check if user is not a super admin
  if (currentAdminInfo && !currentAdminInfo.is_super_admin) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            Only super administrators can access security configuration settings.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your current role: <span className="font-medium">{currentAdminInfo.admin_type}</span>
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Configuration Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load security configuration.</p>
          <button
            onClick={loadSecurityConfig}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
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
            {appRules && (
              <button
                onClick={() => setActiveTab('priority_settings')}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'priority_settings'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pengaturan Prioritas
              </button>
            )}
            <button
              onClick={() => setActiveTab('transfer_transaksi')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'transfer_transaksi'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transfer & Transaksi
            </button>
            <button
              onClick={() => setActiveTab('produk_poin')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'produk_poin'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Produk & Poin
            </button>
            <button
              onClick={() => setActiveTab('outbox_patterns')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'outbox_patterns'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Outbox Patterns
            </button>
            <button
              onClick={() => setActiveTab('cutoff')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'cutoff'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cutoff
            </button>
            <button
              onClick={() => setActiveTab('demo_number')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'demo_number'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Demo Number
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Priority Settings Tab */}
          {appRules && activeTab === 'priority_settings' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <Settings className="h-6 w-6 text-indigo-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pengaturan Prioritas</h3>
                    <p className="text-sm text-gray-600">Konfigurasi pengaturan aplikasi yang paling penting</p>
                  </div>
                </div>

                {loadingAppRules ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Memuat pengaturan prioritas...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prioritySettings.map(key => {
                      const value = appRules[key];
                      if (value !== undefined) {
                        return renderField(key, value);
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Rules Section */}
              {dynamicRules && Object.keys(dynamicRules).length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pengaturan Member Baru</h3>
                      <p className="text-sm text-gray-600">Konfigurasi pengaturan dinamis berdasarkan aplikasi</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(dynamicRules).map(([key, value]) => {
                      if (value !== undefined) {
                        return renderDynamicField(key, value);
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transfer & Transaksi Tab */}
          {activeTab === 'transfer_transaksi' && (
            <div className="space-y-6">
              {/* Balance Transfer Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">BT</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Transfer Saldo</h3>
                </div>

                {!config.balance_transfer && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          balance_transfer: {
                            add_format: "ADD.{destination}.{val}.{pin}",
                            trans_format: "TRANS.{destination}.{val}.{pin}"
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Transfer Saldo
                    </button>
                  </div>
                )}

                {config.balance_transfer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format Tambah
                      </label>
                      <input
                        type="text"
                        value={config.balance_transfer.add_format}
                        onChange={(e) => updateConfig('balance_transfer', 'add_format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ADD.{destination}.{val}.{pin}"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Format untuk menambah saldo. Gunakan {`{destination}`}, {`{val}`}, {`{pin}`} sebagai placeholder.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Format Transfer
                      </label>
                      <input
                        type="text"
                        value={config.balance_transfer.trans_format}
                        onChange={(e) => updateConfig('balance_transfer', 'trans_format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="TRANS.{destination}.{val}.{pin}"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Format untuk mentransfer saldo. Gunakan {`{destination}`}, {`{val}`}, {`{pin}`} sebagai placeholder.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Combotrx Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">CT</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Combotrx</h3>
                </div>

                {!config.combotrx && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          combotrx: {
                            outbox_like_pattern: "%{product}.{destination}%Sukses%",
                            pesan_format_no_val: "{trxid}.{product}.{destination}.{pin}",
                            pesan_format_with_val: "{trxid}.{product}.{destination}.{val}.{pin}",
                            sdh_pernah_filter: "%sdh pernah%"
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Combotrx
                    </button>
                  </div>
                )}

                {config.combotrx && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pola Outbox Like
                      </label>
                      <input
                        type="text"
                        value={config.combotrx.outbox_like_pattern}
                        onChange={(e) => updateConfig('combotrx', 'outbox_like_pattern', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="%{product}.{destination}%Sukses%"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Pola untuk mencocokkan pesan outbox. Gunakan {`{product}`}, {`{destination}`} sebagai placeholder.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Format Pesan (Tanpa Nilai)
                        </label>
                        <input
                          type="text"
                          value={config.combotrx.pesan_format_no_val}
                          onChange={(e) => updateConfig('combotrx', 'pesan_format_no_val', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="{trxid}.{product}.{destination}.{pin}"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Format untuk pesan tanpa nilai. Gunakan {`{trxid}`}, {`{product}`}, {`{destination}`}, {`{pin}`} sebagai placeholder.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Format Pesan (Dengan Nilai)
                        </label>
                        <input
                          type="text"
                          value={config.combotrx.pesan_format_with_val}
                          onChange={(e) => updateConfig('combotrx', 'pesan_format_with_val', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="{trxid}.{product}.{destination}.{val}.{pin}"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Format untuk pesan dengan nilai. Gunakan {`{trxid}`}, {`{product}`}, {`{destination}`}, {`{val}`}, {`{pin}`} sebagai placeholder.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Sudah Diproses
                      </label>
                      <input
                        type="text"
                        value={config.combotrx.sdh_pernah_filter}
                        onChange={(e) => updateConfig('combotrx', 'sdh_pernah_filter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="%sdh pernah%"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Pola untuk memfilter pesan yang sudah diproses.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Commission Exchange Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">CE</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Tukar Komisi</h3>
                </div>

                {!config.commission_exchange && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          commission_exchange: {
                            tukar_format: "TUKAR.{val}.{pin}"
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Tukar Komisi
                    </button>
                  </div>
                )}

                {config.commission_exchange && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format Tukar
                    </label>
                    <input
                      type="text"
                      value={config.commission_exchange.tukar_format}
                      onChange={(e) => updateConfig('commission_exchange', 'tukar_format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="TUKAR.{val}.{pin}"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Format untuk tukar komisi. Gunakan {`{val}`}, {`{pin}`} sebagai placeholder.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Produk & Poin Tab */}
          {activeTab === 'produk_poin' && (
            <div className="space-y-6">
              {/* History Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">H</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Riwayat</h3>
                </div>

                {!config.history && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          history: {
                            minimum_harga_to_display_in_history: 1
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Riwayat
                    </button>
                  </div>
                )}

                {config.history && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga Minimum untuk Ditampilkan di Riwayat
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.history.minimum_harga_to_display_in_history}
                      onChange={(e) => updateConfig('history', 'minimum_harga_to_display_in_history', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Ambang batas harga minimum untuk menampilkan transaksi di riwayat. Hanya transaksi di atas jumlah ini yang akan ditampilkan.
                    </p>
                  </div>
                )}
              </div>

              {/* Poin Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">P</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Poin</h3>
                </div>

                {!config.poin && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          poin: {
                            exchange_rate: 4.0,
                            minimum_exchange: 500.0
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Poin
                    </button>
                  </div>
                )}

                {config.poin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kurs Tukar
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={config.poin.exchange_rate}
                        onChange={(e) => updateConfig('poin', 'exchange_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="4.0"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Kurs tukar untuk mengkonversi poin ke mata uang.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Tukar Minimum
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={config.poin.minimum_exchange || ''}
                        onChange={(e) => updateConfig('poin', 'minimum_exchange', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="500.0"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Jumlah minimum yang diperlukan untuk tukar poin. Kosongkan untuk menonaktifkan minimum.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outbox Patterns Tab */}
          {activeTab === 'outbox_patterns' && (
            <div>
              {!config.outbox_patterns && (
                <div className="mb-4">
                  <button
                    onClick={initializeOutboxPatterns}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Aktifkan Konfigurasi Outbox Patterns
                  </button>
                </div>
              )}

              {config.outbox_patterns && (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">OP</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Outbox Patterns</h3>
                  </div>
                  <div className="space-y-8">
                    {/* Static Patterns */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-4">Pattern Statis (Tidak Dapat Dihapus)</h4>
                      <div className="space-y-4">
                        {/* Transaksi Sukses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Judul Transaksi Sukses
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_sukses.title}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_sukses', {
                                ...config.outbox_patterns!.static_patterns.transaksi_sukses,
                                title: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pattern Transaksi Sukses
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_sukses.pattern}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_sukses', {
                                ...config.outbox_patterns!.static_patterns.transaksi_sukses,
                                pattern: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="(?i)sukses"
                            />
                          </div>
                        </div>

                        {/* Transaksi Proses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Judul Transaksi Proses
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_proses.title}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_proses', {
                                ...config.outbox_patterns!.static_patterns.transaksi_proses,
                                title: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pattern Transaksi Proses
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_proses.pattern}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_proses', {
                                ...config.outbox_patterns!.static_patterns.transaksi_proses,
                                pattern: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="(?i)proses"
                            />
                          </div>
                        </div>

                        {/* Transaksi Gagal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Judul Transaksi Gagal
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_gagal.title}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_gagal', {
                                ...config.outbox_patterns!.static_patterns.transaksi_gagal,
                                title: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Pattern Transaksi Gagal
                            </label>
                            <input
                              type="text"
                              value={config.outbox_patterns.static_patterns.transaksi_gagal.pattern}
                              onChange={(e) => updateConfig('outbox_patterns', 'static_transaksi_gagal', {
                                ...config.outbox_patterns!.static_patterns.transaksi_gagal,
                                pattern: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="(?i)Gagal"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Patterns */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-800">Pattern Dinamis (Dapat Ditambah/Dihapus)</h4>
                        <button
                          onClick={addDynamicPattern}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                        >
                          + Tambah Pattern
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {dynamicPatternOrder.map((key, index) => {
                          const pattern = config.outbox_patterns?.dynamic_patterns[key];
                          if (!pattern) return null;
                          return (
                            <div key={`pattern-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-md">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Key Pattern
                                </label>
                                <input
                                  type="text"
                                  value={key}
                                  onChange={(e) => {
                                    const newKey = e.target.value.replace(/\s+/g, ''); // Remove all spaces
                                    if (newKey !== key) {
                                      // Update the key in the dynamic patterns
                                      setConfig(prev => {
                                        if (!prev?.outbox_patterns) return null;
                                        const newDynamicPatterns = { ...prev.outbox_patterns.dynamic_patterns };
                                        const patternData = newDynamicPatterns[key];
                                        delete newDynamicPatterns[key];
                                        newDynamicPatterns[newKey] = patternData;
                                        
                                        return {
                                          ...prev,
                                          outbox_patterns: {
                                            ...prev.outbox_patterns,
                                            dynamic_patterns: newDynamicPatterns
                                          }
                                        };
                                      });
                                      
                                      // Update the order array
                                      setDynamicPatternOrder(prev => prev.map(k => k === key ? newKey : k));
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Ensure no spaces on blur (when user finishes editing)
                                    const trimmedKey = e.target.value.replace(/\s+/g, '');
                                    if (trimmedKey !== e.target.value) {
                                      e.target.value = trimmedKey;
                                      if (trimmedKey !== key) {
                                        setConfig(prev => {
                                          if (!prev?.outbox_patterns) return null;
                                          const newDynamicPatterns = { ...prev.outbox_patterns.dynamic_patterns };
                                          const patternData = newDynamicPatterns[key];
                                          delete newDynamicPatterns[key];
                                          newDynamicPatterns[trimmedKey] = patternData;
                                          
                                          return {
                                            ...prev,
                                            outbox_patterns: {
                                              ...prev.outbox_patterns,
                                              dynamic_patterns: newDynamicPatterns
                                            }
                                          };
                                        });
                                        
                                        // Update the order array
                                        setDynamicPatternOrder(prev => prev.map(k => k === key ? trimmedKey : k));
                                      }
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Judul
                                </label>
                                <input
                                  type="text"
                                  value={pattern.title}
                                  onChange={(e) => updateConfig('outbox_patterns', `dynamic_${key}`, {
                                    ...pattern,
                                    title: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-end space-x-2">
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pattern Regex
                                  </label>
                                  <input
                                    type="text"
                                    value={pattern.pattern}
                                    onChange={(e) => updateConfig('outbox_patterns', `dynamic_${key}`, {
                                      ...pattern,
                                      pattern: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <button
                                  onClick={() => removeDynamicPattern(key)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        {dynamicPatternOrder.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>Belum ada pattern dinamis. Klik "Tambah Pattern" untuk menambahkan.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cutoff Tab */}
          {activeTab === 'cutoff' && (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pengaturan Cutoff</h3>
                  <p className="text-sm text-gray-600">Konfigurasi waktu cutoff untuk transaksi</p>
                </div>
              </div>

              {loadingCutoff ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Memuat konfigurasi cutoff...</span>
                </div>
              ) : cutoffConfig ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cutoff Start Time */}
                  <div>
                    <label htmlFor="cutoff_start" className="block text-sm font-medium text-gray-700 mb-2">
                      Waktu Mulai Cutoff
                    </label>
                    <input
                      type="time"
                      id="cutoff_start"
                      value={cutoffConfig.cutoff_start}
                      onChange={(e) => setCutoffConfig({ ...cutoffConfig, cutoff_start: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Waktu ketika sistem mulai periode cutoff (format 24 jam)
                    </p>
                  </div>

                  {/* Cutoff End Time */}
                  <div>
                    <label htmlFor="cutoff_end" className="block text-sm font-medium text-gray-700 mb-2">
                      Waktu Selesai Cutoff
                    </label>
                    <input
                      type="time"
                      id="cutoff_end"
                      value={cutoffConfig.cutoff_end}
                      onChange={(e) => setCutoffConfig({ ...cutoffConfig, cutoff_end: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Waktu ketika sistem mengakhiri periode cutoff (format 24 jam)
                    </p>
                  </div>

                  {/* Information Box */}
                  <div className="md:col-span-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">Tentang Waktu Cutoff:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Selama periode cutoff, transaksi tertentu mungkin dibatasi atau ditunda</li>
                            <li>Waktu dalam format 24 jam (HH:MM)</li>
                            <li>Perubahan berlaku segera setelah disimpan</li>
                            <li>Contoh: 23:45 sampai 00:15 berarti cutoff dari 11:45 PM sampai 12:15 AM</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Konfigurasi cutoff belum dimuat. Silakan refresh halaman.</p>
                </div>
              )}
            </div>
          )}

          {/* Demo Number Tab */}
          {activeTab === 'demo_number' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">DN</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nomor Pengirim Demo</h3>
                    <p className="text-sm text-gray-600">Konfigurasi nomor demo untuk bypass OTP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDemoNumber}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                    disabled={loadingDemoNumber}
                  >
                    {loadingDemoNumber ? 'Refreshing...' : 'Refresh'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const sessionKey = localStorage.getItem('adminSessionKey');
                        if (!sessionKey) {
                          setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
                          return;
                        }
                        const apiUrl = await getApiUrl('/admin/demo-config/save');
                        const res = await fetch(apiUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-Token': X_TOKEN_VALUE,
                            'Session-Key': sessionKey,
                            'Auth-Seed': authSeed,
                          },
                          body: JSON.stringify({ demo_number: demoNumber || '' }),
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setMessage({ type: 'success', text: 'Demo number saved' });
                          loadDemoNumber();
                        } else {
                          setMessage({ type: 'error', text: data.message || 'Failed to save demo number' });
                        }
                      } catch (e) {
                        setMessage({ type: 'error', text: 'Network error saving demo number' });
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div>
                {loadingDemoNumber ? (
                  <span className="text-sm text-gray-500">Memuat...</span>
                ) : (
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Demo</label>
                    <input
                      type="text"
                      value={demoNumber || ''}
                      onChange={(e) => setDemoNumber(e.target.value)}
                      placeholder="contoh: 085156880420 (kosongkan untuk menonaktifkan)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nomor ini akan di-normalisasi otomatis dan digunakan untuk bypass OTP saat login.</p>
                    <p className="text-xs text-gray-500 mt-1">Pastikan akun demo sudah dibuat menggunakan nomor ini.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  }
);

SecurityManagement.displayName = 'SecurityManagement';

export default SecurityManagement;
