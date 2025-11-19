import { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, Settings, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedSecurityManagement, setCachedSecurityManagement } from '../utils/securityManagementCache';

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
    sdh_pernah_filter: string;
  };
  trx?: {
    pesan_format_no_val: string;
    pesan_format_with_val_nonzero: string;
    pesan_format_with_val_zero: string;
    combo_code_format: string;
  };
  commission_exchange?: {
    tukar_format: string;
  };
  client_config?: {
    blocked_referrals: string[];
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<CurrentAdminInfo | null>(null);
  const [dynamicPatternOrder, setDynamicPatternOrder] = useState<string[]>([]);
  const [demoNumber, setDemoNumber] = useState<string | null>(null);
  
  // Priority settings state
  const [appRules, setAppRules] = useState<AppRules | null>(null);
  const [dynamicRules, setDynamicRules] = useState<AppRules | null>(null);
  
  // Cutoff configuration state
  const [cutoffConfig, setCutoffConfig] = useState<CutoffConfig | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('priority_settings');
  const hasInitializedTab = useRef(false);
  const hasLoadedRef = useRef(false);
  const prevConfigRef = useRef<SecurityConfig | null>(null);
  const prevAppRulesRef = useRef<AppRules | null>(null);
  const prevDynamicRulesRef = useRef<AppRules | null>(null);
  const prevCutoffConfigRef = useRef<CutoffConfig | null>(null);
  const prevDemoNumberRef = useRef<string | null>(null);

  useEffect(() => {
    fetchCurrentAdminInfo();
  }, []);

  useEffect(() => {
    if (currentAdminInfo?.is_super_admin) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        
        // Load from cache immediately
        const cached = getCachedSecurityManagement();
        if (cached) {
          if (cached.config) {
            prevConfigRef.current = cached.config;
            setConfig(cached.config);
          }
          if (cached.appRules) {
            prevAppRulesRef.current = cached.appRules;
            setAppRules(cached.appRules);
          }
          if (cached.dynamicRules) {
            prevDynamicRulesRef.current = cached.dynamicRules;
            setDynamicRules(cached.dynamicRules);
          }
          if (cached.cutoffConfig) {
            prevCutoffConfigRef.current = cached.cutoffConfig;
            setCutoffConfig(cached.cutoffConfig);
          }
          if (cached.demoNumber !== null) {
            prevDemoNumberRef.current = cached.demoNumber;
            setDemoNumber(cached.demoNumber);
          }
        }
        
        // Fetch from API in background
        loadSecurityConfig(true);
        loadAppRules(true);
        loadDynamicRules(true);
        loadCutoffConfig(true);
        loadDemoNumber(true);
      }
    } else if (currentAdminInfo && !currentAdminInfo.is_super_admin) {
      setMessage({ type: 'error', text: 'Access denied. Only super admins can access security configuration.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAdminInfo]);

  // Update cache when state changes
  useEffect(() => {
    if (config && prevConfigRef.current !== config) {
      if (!prevConfigRef.current || JSON.stringify(prevConfigRef.current) !== JSON.stringify(config)) {
        setCachedSecurityManagement({ config });
        prevConfigRef.current = config;
      }
    }
  }, [config]);

  useEffect(() => {
    if (appRules && prevAppRulesRef.current !== appRules) {
      if (!prevAppRulesRef.current || JSON.stringify(prevAppRulesRef.current) !== JSON.stringify(appRules)) {
        setCachedSecurityManagement({ appRules });
        prevAppRulesRef.current = appRules;
      }
    }
  }, [appRules]);

  useEffect(() => {
    if (dynamicRules && prevDynamicRulesRef.current !== dynamicRules) {
      if (!prevDynamicRulesRef.current || JSON.stringify(prevDynamicRulesRef.current) !== JSON.stringify(dynamicRules)) {
        setCachedSecurityManagement({ dynamicRules });
        prevDynamicRulesRef.current = dynamicRules;
      }
    }
  }, [dynamicRules]);

  useEffect(() => {
    if (cutoffConfig && prevCutoffConfigRef.current !== cutoffConfig) {
      if (!prevCutoffConfigRef.current || JSON.stringify(prevCutoffConfigRef.current) !== JSON.stringify(cutoffConfig)) {
        setCachedSecurityManagement({ cutoffConfig });
        prevCutoffConfigRef.current = cutoffConfig;
      }
    }
  }, [cutoffConfig]);

  useEffect(() => {
    if (demoNumber !== null && prevDemoNumberRef.current !== demoNumber) {
      setCachedSecurityManagement({ demoNumber });
      prevDemoNumberRef.current = demoNumber;
    }
  }, [demoNumber]);

  // Initialize dynamic pattern order when config loads
  useEffect(() => {
    if (config?.outbox_patterns?.dynamic_patterns && dynamicPatternOrder.length === 0) {
      setDynamicPatternOrder(Object.keys(config?.outbox_patterns?.dynamic_patterns || {}));
    }
  }, [config?.outbox_patterns?.dynamic_patterns, dynamicPatternOrder.length]);

  // Set initial active tab to priority_settings when data loads
  useEffect(() => {
    if (!hasInitializedTab.current) {
      hasInitializedTab.current = true;
      // Always default to priority_settings if appRules is available
      if (appRules) {
        setActiveTab('priority_settings');
      } else if (config) {
        // Only switch to other tabs if priority_settings is not available
        if (config?.balance_transfer || config?.trx || config?.commission_exchange) setActiveTab('transfer_transaksi');
        else if (config?.client_config) setActiveTab('client_config');
        else if (config?.outbox_patterns || config?.combotrx) setActiveTab('outbox_patterns');
      }
    }
  }, [config, appRules]);


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

  const loadSecurityConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        }
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
        setConfig(prev => {
          if (prev && JSON.stringify(prev) === JSON.stringify(data.config)) {
            return prev;
          }
          return data.config!;
        });
        if (!background) {
          setMessage(null);
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: data.message || 'Failed to load security configuration' });
        }
      }
    } catch (error) {
      console.error('Failed to load security config:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Failed to load security configuration' });
      }
    }
  }, [authSeed]);

  const loadDemoNumber = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        }
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
        setDemoNumber(prev => {
          if (prev === (data.demo_number || null)) {
            return prev;
          }
          return data.demo_number || null;
        });
      } else {
        setDemoNumber(null);
      }
    } catch (_e) {
      setDemoNumber(null);
    }
  }, [authSeed]);


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
      } else if (section === 'trx' && newConfig.trx) {
        newConfig.trx = { 
          ...prev.trx!, 
          [field]: value 
        };
      } else if (section === 'commission_exchange' && newConfig.commission_exchange) {
        newConfig.commission_exchange = {
          ...prev.commission_exchange,
          [field]: value
        } as SecurityConfig['commission_exchange'];
      } else if (section === 'client_config' && newConfig.client_config) {
        if (field === 'blocked_referrals') {
          newConfig.client_config = { 
            ...prev.client_config!, 
            blocked_referrals: Array.isArray(value) ? value : [] 
          };
        }
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
    const currentCount = Object.keys(config?.outbox_patterns?.dynamic_patterns || {}).length;
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
  const loadAppRules = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session tidak valid' });
        }
        if (!appRules) {
          setAppRules(getDefaultRules());
        }
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
          setAppRules(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.rules)) {
              return prev;
            }
            return data.rules;
          });
        } else {
          if (!background) {
            setMessage({ type: 'error', text: data.message || 'Gagal memuat pengaturan' });
          }
          if (!appRules) {
            setAppRules(getDefaultRules());
          }
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: 'Gagal memuat pengaturan dari server' });
        }
        if (!appRules) {
          setAppRules(getDefaultRules());
        }
      }
    } catch (error) {
      console.error('Failed to load app rules:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat pengaturan' });
      }
      if (!appRules) {
        setAppRules(getDefaultRules());
      }
    }
  }, [authSeed, appRules]);

  const loadDynamicRules = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session tidak valid' });
        }
        if (!dynamicRules) {
          setDynamicRules(getDefaultDynamicRules());
        }
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
          
          setDynamicRules(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(dynamicRulesFiltered)) {
              return prev;
            }
            return dynamicRulesFiltered;
          });
        } else {
          if (!dynamicRules) {
            setDynamicRules(getDefaultDynamicRules());
          }
        }
      } else {
        if (!dynamicRules) {
          setDynamicRules(getDefaultDynamicRules());
        }
      }
    } catch (error) {
      console.error('Failed to load dynamic rules:', error);
      if (!dynamicRules) {
        setDynamicRules(getDefaultDynamicRules());
      }
    }
  }, [authSeed, dynamicRules]);

  const loadCutoffConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session tidak valid' });
        }
        if (!cutoffConfig) {
          setCutoffConfig(getDefaultCutoffConfig());
        }
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
        setCutoffConfig(prev => {
          if (prev && JSON.stringify(prev) === JSON.stringify(data.config)) {
            return prev;
          }
          return data.config;
        });
      } else {
        console.error('Failed to load cutoff config:', data.message);
        if (!cutoffConfig) {
          setCutoffConfig(getDefaultCutoffConfig());
        }
      }
    } catch (error) {
      console.error('Failed to load cutoff config:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat konfigurasi cutoff' });
      }
      if (!cutoffConfig) {
        setCutoffConfig(getDefaultCutoffConfig());
      }
    }
  }, [authSeed, cutoffConfig]);

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
  const getFieldType = (key: string, value: any): 'boolean' | 'number' | 'string' | 'time' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    
    // Special handling for cutoff fields
    if (key === 'cutoff_start' || key === 'cutoff_end') {
      return 'time';
    }
    
    // Special handling for history and poin fields
    if (key === 'minimum_harga_to_display_in_history' || key === 'exchange_rate' || key === 'minimum_exchange') {
      return 'number';
    }
    
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
      'liveChatHelpFormat': 'Format Pesan Bantuan Live Chat',
      'cutoff_start': 'Waktu Mulai Cutoff',
      'cutoff_end': 'Waktu Selesai Cutoff',
      'demo_number': 'Nomor Pengirim Demo',
      'minimum_harga_to_display_in_history': 'Minimum Harga untuk Ditampilkan di Riwayat',
      'exchange_rate': 'Kurs Tukar Poin',
      'minimum_exchange': 'Jumlah Tukar Minimum Poin'
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
      'liveChatHelpFormat': 'Format pesan untuk live chat bantuan transaksi. Gunakan placeholder: {inv} (ID transaksi), {product} (kode produk), {number} (nomor tujuan), {tgl_entri} (tanggal entri)',
      'cutoff_start': 'Waktu ketika sistem mulai periode cutoff (format 24 jam, contoh: 23:45)',
      'cutoff_end': 'Waktu ketika sistem mengakhiri periode cutoff (format 24 jam, contoh: 00:15)',
      'demo_number': 'Nomor demo yang akan di-normalisasi otomatis dan digunakan untuk bypass OTP saat login. Kosongkan untuk menonaktifkan. Pastikan akun demo sudah dibuat menggunakan nomor ini.',
      'minimum_harga_to_display_in_history': 'Ambang batas harga minimum untuk menampilkan transaksi di riwayat. Hanya transaksi di atas jumlah ini yang akan ditampilkan.',
      'exchange_rate': 'Kurs tukar untuk mengkonversi poin ke mata uang.',
      'minimum_exchange': 'Jumlah minimum yang diperlukan untuk tukar poin. Kosongkan untuk menonaktifkan minimum.'
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


  // Helper function to get field description for transfer & transaksi configs
  const getTransferTransaksiDescription = (section: string, field: string): string => {
    const descriptions: Record<string, Record<string, string>> = {
      balance_transfer: {
        add_format: 'Format untuk menambah saldo. Gunakan {destination}, {val}, {pin} sebagai placeholder.',
        trans_format: 'Format untuk mentransfer saldo. Gunakan {destination}, {val}, {pin} sebagai placeholder.',
      },
      combotrx: {
        outbox_like_pattern: 'Pola untuk mencocokkan pesan outbox untuk mengambil list paket combo. Gunakan {product}, {destination} sebagai placeholder dan \'%\' sebagai delimiter.',
        sdh_pernah_filter: 'Pola untuk memfilter pesan sudah diproses untuk diabaikan saat mengambil list paket combo. Gunakan \'%\' sebagai delimiter.',
      },
      trx: {
        pesan_format_no_val: 'Format untuk transaksi reguler. Gunakan {trxid}, {product}, {destination}, {pin} sebagai placeholder.',
        pesan_format_with_val_nonzero: 'Format untuk transaksi nominal bebas. Gunakan {trxid}, {product}, {destination}, {val}, {pin} sebagai placeholder.',
        pesan_format_with_val_zero: 'Format untuk transaksi dengan prefix 0 (contoh: 081234567890(end user number)). Gunakan {product}, {destination}, {pin}, {val} sebagai end user number sebagai placeholder.',
        combo_code_format: 'Format transaksi untuk transaksi paket combo (Combo Sakti, Cuanku, dll). Gunakan {trxid}, {combo_code}, {product}, {destination}, {pin} sebagai placeholder.',
      },
      commission_exchange: {
        tukar_format: 'Format untuk tukar komisi. Gunakan {val}, {pin} sebagai placeholder.',
      },
    };
    return descriptions[section]?.[field] || '';
  };

  // Helper function to get field label for transfer & transaksi configs
  const getTransferTransaksiLabel = (section: string, field: string): string => {
    const labels: Record<string, Record<string, string>> = {
      balance_transfer: {
        add_format: 'Format Tambah',
        trans_format: 'Format Transfer',
      },
      combotrx: {
        outbox_like_pattern: 'Pola Outbox Like',
        sdh_pernah_filter: 'Filter Sudah Diproses',
      },
      trx: {
        pesan_format_no_val: 'Format Transaksi Reguler',
        pesan_format_with_val_nonzero: 'Format Transaksi Nominal Bebas',
        pesan_format_with_val_zero: 'Format Transaksi (Dengan Prefix 0)',
        combo_code_format: 'Format Transaksi Combo',
      },
      commission_exchange: {
        tukar_format: 'Format Tukar',
      },
    };
    return labels[section]?.[field] || field;
  };

  // Render table row for transfer & transaksi configs
  const renderTransferTransaksiRow = (
    section: keyof SecurityConfig,
    field: string,
    value: string,
    onUpdate: (field: string, value: string) => void
  ) => {
    const label = getTransferTransaksiLabel(section as string, field);
    const description = getTransferTransaksiDescription(section as string, field);
    const displayValue = value === null || value === undefined ? '' : String(value);

    return (
      <div
        key={field}
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* Name */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <span className="text-sm font-medium text-gray-700 truncate block" title={label}>
            {label}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Description */}
        <div className="flex-1 min-w-0 flex items-start">
          <span className="text-xs text-gray-600 block break-words whitespace-normal" title={description}>
            {description}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Format */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => onUpdate(field, e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder={`Masukkan format ${label.toLowerCase()}`}
          />
        </div>
      </div>
    );
  };

  // Render table row for outbox static patterns with 3 columns: Key | Title | Pattern
  const renderOutboxPatternRow = (
    key: string,
    title: string,
    pattern: string,
    onUpdate: (field: 'title' | 'pattern', value: string) => void
  ) => {
    return (
      <div
        key={key}
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* Key */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <span className="text-xs font-mono text-gray-500 truncate block" title={key}>
            {key}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Title */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdate('title', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Judul pattern"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Pattern */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={pattern}
            onChange={(e) => onUpdate('pattern', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Pattern regex"
          />
        </div>
      </div>
    );
  };

  // Component for demo number row
  const DemoNumberRow = ({
    demoNumber,
    onUpdate
  }: {
    demoNumber: string;
    onUpdate: (value: string) => void;
  }) => {
    const [localValue, setLocalValue] = useState(demoNumber);
    const [isFocused, setIsFocused] = useState(false);

    // Only sync with parent when not focused (to avoid losing focus during typing)
    useEffect(() => {
      if (!isFocused) {
        setLocalValue(demoNumber);
      }
    }, [demoNumber, isFocused]);

    const key = 'demo_number';
    const label = getFieldLabel(key);
    const description = getFieldDescription(key, demoNumber);

    return (
      <div className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50">
        {/* Key */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <span className="text-xs font-mono text-gray-500 truncate block" title={key}>
            {key}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Name */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <span className="text-sm font-medium text-gray-700 truncate block" title={label}>
            {label}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Description */}
        <div className="flex-1 min-w-0 flex items-start">
          <span className="text-xs text-gray-600 block break-words whitespace-normal" title={description}>
            {description}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Value */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <input
            type="text"
            value={localValue}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => {
              setLocalValue(e.target.value);
            }}
            onBlur={() => {
              setIsFocused(false);
              onUpdate(localValue);
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="contoh: 085156880420"
          />
        </div>
      </div>
    );
  };

  // Component for dynamic pattern row to maintain local state
  const DynamicPatternRow = ({
    originalKey,
    title,
    pattern,
    onUpdateKey,
    onUpdateTitle,
    onUpdatePattern,
    onDelete
  }: {
    originalKey: string;
    title: string;
    pattern: string;
    onUpdateKey: (newKey: string) => void;
    onUpdateTitle: (value: string) => void;
    onUpdatePattern: (value: string) => void;
    onDelete: () => void;
  }) => {
    const [localKey, setLocalKey] = useState(originalKey);

    // Update local key when original key changes (from external updates)
    useEffect(() => {
      setLocalKey(originalKey);
    }, [originalKey]);

    return (
      <div
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* Key */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <input
            type="text"
            value={localKey}
            onChange={(e) => {
              const newKey = e.target.value.replace(/\s+/g, '');
              setLocalKey(newKey);
            }}
            onBlur={(e) => {
              const trimmedKey = e.target.value.replace(/\s+/g, '');
              setLocalKey(trimmedKey);
              if (trimmedKey !== originalKey && trimmedKey !== '') {
                onUpdateKey(trimmedKey);
              } else if (trimmedKey === '') {
                // If empty, revert to original
                setLocalKey(originalKey);
              }
            }}
            className="w-full px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Key pattern"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Title */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Judul pattern"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Pattern */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={pattern}
            onChange={(e) => onUpdatePattern(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Pattern regex"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Actions */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Hapus pattern"
          >
            Hapus
          </button>
        </div>
      </div>
    );
  };

  // Render table row for priority settings with 4 columns: Key | Name | Descriptions | Value
  const renderPrioritySettingsRow = (key: string, value: any, onUpdate?: (key: string, value: any) => void) => {
    const type = getFieldType(key, value);
    const label = getFieldLabel(key);
    const description = getFieldDescription(key, value);
    const updateFn = onUpdate || updateRule;

    return (
      <div
        key={key}
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* Key */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <span className="text-xs font-mono text-gray-500 truncate block" title={key}>
            {key}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Name */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          <span className="text-sm font-medium text-gray-700 truncate block" title={label}>
            {label}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Description */}
        <div className="flex-1 min-w-0 flex items-start">
          <span className="text-xs text-gray-600 block break-words whitespace-normal" title={description}>
            {description}
          </span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Value */}
        <div className="flex-shrink-0 w-1/5 flex items-start">
          {type === 'boolean' ? (
            <button
              onClick={() => updateFn(key, !value)}
              className="flex items-center"
            >
              {value ? (
                <ToggleRight className="h-6 w-6 text-green-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-gray-400" />
              )}
            </button>
          ) : type === 'number' ? (
            <input
              type="number"
              step={key === 'exchange_rate' || key === 'minimum_exchange' || key === 'minimum_harga_to_display_in_history' ? '0.01' : '1'}
              value={value ?? ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === '') {
                  // For optional fields like minimum_exchange, pass empty string to allow undefined
                  if (key === 'minimum_exchange') {
                    updateFn(key, '');
                  } else {
                    updateFn(key, 0);
                  }
                } else {
                  const numValue = key === 'exchange_rate' || key === 'minimum_exchange' || key === 'minimum_harga_to_display_in_history' 
                    ? parseFloat(inputValue) 
                    : parseInt(inputValue);
                  updateFn(key, isNaN(numValue) ? 0 : numValue);
                }
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : type === 'time' ? (
            <input
              type="time"
              value={value || ''}
              onChange={(e) => updateFn(key, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          ) : (
            (() => {
              const isLongText = String(value).length > 50;
              return isLongText ? (
                <textarea
                  value={value || ''}
                  onChange={(e) => updateFn(key, e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              ) : (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => updateFn(key, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              );
            })()
          )}
        </div>
      </div>
    );
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

    // Save Demo Number
    try {
      const apiUrl = await getApiUrl('/admin/demo-config/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ demo_number: demoNumber || '' }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        results.push('Demo number saved successfully');
      } else {
        results.push(`Demo number error: ${data.message || 'Failed to save'}`);
        hasErrors = true;
      }
    } catch (error) {
      results.push('Demo number error: Network error');
      hasErrors = true;
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
      loadDemoNumber();
    }, 1000);
  };

  // Expose save function to parent component via ref
  useImperativeHandle(ref, () => ({
    saveAllConfigurations
  }));



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
              onClick={() => setActiveTab('client_config')}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'client_config'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Blokir Referral
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

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/5">Key</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Value</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {prioritySettings.map(key => {
                        const value = appRules[key];
                        if (value !== undefined) {
                          return renderPrioritySettingsRow(key, value);
                        }
                        return null;
                      })}
                    </div>
                  </div>
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

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/5">Key</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Value</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(dynamicRules).map(([key, value]) => {
                        if (value !== undefined) {
                          return renderPrioritySettingsRow(key, value, updateDynamicRule);
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Cutoff Configuration Section */}
              {cutoffConfig && (
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pengaturan Cutoff</h3>
                      <p className="text-sm text-gray-600">Konfigurasi waktu cutoff untuk transaksi</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3 pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                          <div className="flex-shrink-0 w-1/5">Key</div>
                          <div className="flex-shrink-0 text-gray-400">|</div>
                          <div className="flex-shrink-0 w-1/5">Name</div>
                          <div className="flex-shrink-0 text-gray-400">|</div>
                          <div className="flex-1 min-w-0">Descriptions</div>
                          <div className="flex-shrink-0 text-gray-400">|</div>
                          <div className="flex-shrink-0 w-1/5">Value</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {renderPrioritySettingsRow(
                          'cutoff_start',
                          cutoffConfig.cutoff_start,
                          (_key, value) => setCutoffConfig({ ...cutoffConfig, cutoff_start: value })
                        )}
                        {renderPrioritySettingsRow(
                          'cutoff_end',
                          cutoffConfig.cutoff_end,
                          (_key, value) => setCutoffConfig({ ...cutoffConfig, cutoff_end: value })
                        )}
                      </div>
                    </div>
                </div>
              )}

              {/* History Configuration Section */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">H</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Riwayat</h3>
                    <p className="text-sm text-gray-600">Konfigurasi pengaturan riwayat transaksi</p>
                  </div>
                </div>

                {!config?.history && (
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

                {config?.history && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/5">Key</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Value</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderPrioritySettingsRow(
                        'minimum_harga_to_display_in_history',
                        config?.history?.minimum_harga_to_display_in_history,
                        (_key, value) => updateConfig('history', 'minimum_harga_to_display_in_history', value)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Poin Configuration Section */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-bold text-sm">P</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Poin</h3>
                    <p className="text-sm text-gray-600">Konfigurasi pengaturan tukar poin</p>
                  </div>
                </div>

                {!config?.poin && (
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

                {config?.poin && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/5">Key</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Value</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderPrioritySettingsRow(
                        'exchange_rate',
                        config?.poin?.exchange_rate,
                        (_key, value) => updateConfig('poin', 'exchange_rate', value)
                      )}
                      {renderPrioritySettingsRow(
                        'minimum_exchange',
                        config?.poin?.minimum_exchange ?? '',
                        (_key, value) => updateConfig('poin', 'minimum_exchange', value === '' ? undefined : (typeof value === 'number' ? value : parseFloat(String(value)) || undefined))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Number Configuration Section */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">DN</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Nomor Pengirim Demo</h3>
                    <p className="text-sm text-gray-600">Konfigurasi nomor demo untuk bypass OTP</p>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/5">Key</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-shrink-0 w-1/5">Value</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <DemoNumberRow
                        demoNumber={demoNumber || ''}
                        onUpdate={(value) => setDemoNumber(value)}
                      />
                    </div>
                  </div>
              </div>
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
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Format Transfer Saldo</h3>
                </div>

                {!config?.balance_transfer && (
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
                      Aktifkan Konfigurasi Format Transfer Saldo
                    </button>
                  </div>
                )}

                {config?.balance_transfer && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/4">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Format</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderTransferTransaksiRow(
                        'balance_transfer',
                        'add_format',
                        config?.balance_transfer?.add_format,
                        (field, value) => updateConfig('balance_transfer', field, value)
                      )}
                      {renderTransferTransaksiRow(
                        'balance_transfer',
                        'trans_format',
                        config?.balance_transfer?.trans_format,
                        (field, value) => updateConfig('balance_transfer', field, value)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trx Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">TRX</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Format Transaksi</h3>
                </div>

                {!config?.trx && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          trx: {
                            pesan_format_no_val: "{trxid}.{product}.{destination}.{pin}",
                            pesan_format_with_val_nonzero: "{trxid}.{product}.{destination}.{val}.{pin}",
                            pesan_format_with_val_zero: "{product}.{destination}.{pin}.{val}",
                            combo_code_format: "{trxid}.{combo_code}.{product}.{destination}.{pin}"
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Format Transaksi
                    </button>
                  </div>
                )}

                {config?.trx && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/4">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Format</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderTransferTransaksiRow(
                        'trx',
                        'pesan_format_no_val',
                        config?.trx?.pesan_format_no_val,
                        (field, value) => updateConfig('trx', field, value)
                      )}
                      {renderTransferTransaksiRow(
                        'trx',
                        'pesan_format_with_val_nonzero',
                        config?.trx?.pesan_format_with_val_nonzero,
                        (field, value) => updateConfig('trx', field, value)
                      )}
                      {renderTransferTransaksiRow(
                        'trx',
                        'pesan_format_with_val_zero',
                        config?.trx?.pesan_format_with_val_zero,
                        (field, value) => updateConfig('trx', field, value)
                      )}
                      {renderTransferTransaksiRow(
                        'trx',
                        'combo_code_format',
                        config?.trx?.combo_code_format || '',
                        (field, value) => updateConfig('trx', field, value)
                      )}
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
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Format Tukar Komisi</h3>
                </div>

                {!config?.commission_exchange && (
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
                      Aktifkan Konfigurasi Format Tukar Komisi
                    </button>
                  </div>
                )}

                {config?.commission_exchange && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/4">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Format</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderTransferTransaksiRow(
                        'commission_exchange',
                        'tukar_format',
                        config?.commission_exchange?.tukar_format,
                        (field, value) => updateConfig('commission_exchange', field, value)
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blokir Referral Tab */}
          {activeTab === 'client_config' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">CC</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Blokir Referral</h3>
                </div>

                {!config?.client_config && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          client_config: {
                            blocked_referrals: []
                          }
                        }));
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Aktifkan Blokir Referral
                    </button>
                  </div>
                )}

                {config?.client_config && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daftar Referral yang Diblokir
                    </label>
                    <div className="space-y-2">
                      {config?.client_config?.blocked_referrals?.map((referral, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={referral}
                            onChange={(e) => {
                              const newBlocked = [...(config?.client_config?.blocked_referrals || [])];
                              newBlocked[index] = e.target.value;
                              updateConfig('client_config', 'blocked_referrals', newBlocked);
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Kode referral yang diblokir"
                          />
                          <button
                            onClick={() => {
                              const newBlocked = (config?.client_config?.blocked_referrals || []).filter((_, i) => i !== index);
                              updateConfig('client_config', 'blocked_referrals', newBlocked);
                            }}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newBlocked = [...(config?.client_config?.blocked_referrals || []), ''];
                          updateConfig('client_config', 'blocked_referrals', newBlocked);
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        + Tambah Referral yang Diblokir
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Daftar kode referral yang dilarang digunakan untuk registrasi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Outbox Patterns Tab */}
          {activeTab === 'outbox_patterns' && (
            <div className="space-y-8">
              {/* Combotrx Configuration */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">CT</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfigurasi Outbox Paket Combo</h3>
                </div>

                {!config?.combotrx && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev!,
                          combotrx: {
                            outbox_like_pattern: "%{product}.{destination}%Sukses%",
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

                {config?.combotrx && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <div className="flex-shrink-0 w-1/4">Name</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Descriptions</div>
                        <div className="flex-shrink-0 text-gray-400">|</div>
                        <div className="flex-1 min-w-0">Format</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {renderTransferTransaksiRow(
                        'combotrx',
                        'outbox_like_pattern',
                        config?.combotrx?.outbox_like_pattern,
                        (field, value) => updateConfig('combotrx', field, value)
                      )}
                      {renderTransferTransaksiRow(
                        'combotrx',
                        'sdh_pernah_filter',
                        config?.combotrx?.sdh_pernah_filter,
                        (field, value) => updateConfig('combotrx', field, value)
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Outbox Patterns */}
              {!config?.outbox_patterns && (
                <div>
                  <div className="mb-4">
                    <button
                      onClick={initializeOutboxPatterns}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Aktifkan Konfigurasi Outbox Patterns
                    </button>
                  </div>
                </div>
              )}

              {config?.outbox_patterns && (
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
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                            <div className="flex-shrink-0 w-1/4">Key</div>
                            <div className="flex-shrink-0 text-gray-400">|</div>
                            <div className="flex-1 min-w-0">Title</div>
                            <div className="flex-shrink-0 text-gray-400">|</div>
                            <div className="flex-1 min-w-0">Regex Pattern</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {renderOutboxPatternRow(
                            'transaksi_sukses',
                            config?.outbox_patterns?.static_patterns?.transaksi_sukses?.title,
                            config?.outbox_patterns?.static_patterns?.transaksi_sukses?.pattern,
                            (field, value) => updateConfig('outbox_patterns', 'static_transaksi_sukses', {
                              ...(config?.outbox_patterns?.static_patterns?.transaksi_sukses || {}),
                              [field]: value
                            })
                          )}
                          {renderOutboxPatternRow(
                            'transaksi_proses',
                            config?.outbox_patterns?.static_patterns?.transaksi_proses?.title,
                            config?.outbox_patterns?.static_patterns?.transaksi_proses?.pattern,
                            (field, value) => updateConfig('outbox_patterns', 'static_transaksi_proses', {
                              ...(config?.outbox_patterns?.static_patterns?.transaksi_proses || {}),
                              [field]: value
                            })
                          )}
                          {renderOutboxPatternRow(
                            'transaksi_gagal',
                            config?.outbox_patterns?.static_patterns?.transaksi_gagal?.title,
                            config?.outbox_patterns?.static_patterns?.transaksi_gagal?.pattern,
                            (field, value) => updateConfig('outbox_patterns', 'static_transaksi_gagal', {
                              ...(config?.outbox_patterns?.static_patterns?.transaksi_gagal || {}),
                              [field]: value
                            })
                          )}
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
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="mb-3 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                            <div className="flex-shrink-0 w-1/5">Key</div>
                            <div className="flex-shrink-0 text-gray-400">|</div>
                            <div className="flex-1 min-w-0">Title</div>
                            <div className="flex-shrink-0 text-gray-400">|</div>
                            <div className="flex-1 min-w-0">Regex Pattern</div>
                            <div className="flex-shrink-0 text-gray-400">|</div>
                            <div className="flex-shrink-0 w-20">Actions</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {dynamicPatternOrder.map((key, index) => {
                            const pattern = config?.outbox_patterns?.dynamic_patterns?.[key];
                            if (!pattern) return null;
                            return (
                              <DynamicPatternRow
                                key={`dynamic-pattern-${index}`}
                                originalKey={key}
                                title={pattern.title}
                                pattern={pattern.pattern}
                                onUpdateKey={(newKey) => {
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
                                  setDynamicPatternOrder(prev => prev.map(k => k === key ? newKey : k));
                                }}
                                onUpdateTitle={(value) => updateConfig('outbox_patterns', `dynamic_${key}`, {
                                  ...pattern,
                                  title: value
                                })}
                                onUpdatePattern={(value) => updateConfig('outbox_patterns', `dynamic_${key}`, {
                                  ...pattern,
                                  pattern: value
                                })}
                                onDelete={() => removeDynamicPattern(key)}
                              />
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
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
});

SecurityManagement.displayName = 'SecurityManagement';

export default SecurityManagement;
