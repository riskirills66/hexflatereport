import React, { useState, useEffect } from 'react';
import { 
  LogOut, 
  History, 
  TrendingUp, 
  Package, 
  User, 
  Menu,
  X,
  Home,
  CreditCard,
  BarChart3
} from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import MutationsView from './MutationsView';
import ProductsView from './ProductsView';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface WebReportDashboardProps {
  authSeed: string;
  onLogout: () => void;
}

interface UserInfo {
  kode: string;
  nama: string;
  email: string;
  saldo: number;
  alamat: string;
  poin: number;
  komisi: number;
  tgl_daftar?: string;
  nama_pemilik: string;
}

const WebReportDashboard: React.FC<WebReportDashboardProps> = ({ authSeed, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [authSeed]);

  const fetchUserInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        onLogout();
        return;
      }

      const apiUrl = await getApiUrl('/infouser');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User info response:', data);
        if (data.success && data.user_info) {
          setUserInfo(data.user_info);
        } else {
          console.error('Failed to get user info:', data.message);
          // Set some default data for testing
          setUserInfo({
            kode: 'TEST001',
            nama: 'Test User',
            email: 'test@example.com',
            saldo: 100000,
            alamat: 'Test Address',
            poin: 50,
            komisi: 5000,
            nama_pemilik: 'Test Owner'
          });
        }
      } else {
        console.error('HTTP error:', response.status, response.statusText);
        // Set some default data for testing
        setUserInfo({
          kode: 'TEST001',
          nama: 'Test User',
          email: 'test@example.com',
          saldo: 100000,
          alamat: 'Test Address',
          poin: 50,
          komisi: 5000,
          nama_pemilik: 'Test Owner'
        });
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('memberAuthSeed');
    localStorage.removeItem('memberSessionKey');
    onLogout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'Riwayat Transaksi', icon: History },
    { id: 'mutations', label: 'Mutasi Saldo', icon: TrendingUp },
    { id: 'products', label: 'Daftar Harga', icon: Package },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Saldo</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Rp {userInfo?.saldo?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Level</p>
                    <p className="text-2xl font-bold text-gray-900">Member</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-2xl font-bold text-green-600">Aktif</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Akun</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.nama || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kode Member</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.kode || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alamat</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.alamat || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poin</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.poin || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Komisi</label>
                  <p className="mt-1 text-sm text-gray-900">Rp {userInfo?.komisi?.toLocaleString('id-ID') || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return <TransactionHistory authSeed={authSeed} />;
      case 'mutations':
        return <MutationsView authSeed={authSeed} />;
      case 'products':
        return <ProductsView authSeed={authSeed} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Web Report</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo?.nama || 'Member'}</p>
                <p className="text-xs text-gray-500">{userInfo?.email || ''}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default WebReportDashboard;
