import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  User,
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner } from '../styles';
import VerificationImage from './VerificationImage';

interface Member {
  kode: string;
  nama: string;
  saldo: number;
  alamat?: string;
  aktif: boolean;
  kode_upline?: string;
  kode_level?: string;
  tgl_daftar?: string;
  tgl_aktivitas?: string;
  nama_pemilik?: string;
  markup?: number;
  verification: UserVerification[];
}

interface UserSession {
  session_key: string;
  number: string;
  device_model?: string;
  imei?: string;
  safetycheck: number;
  created_at: string;
  last_activity?: string;
}

interface UserVerification {
  id: string;
  type_: string;
  status: string;
  image_url?: string;
}

interface UserReferral {
  id: string;
  referral: string;
  markup: number;
}

interface EnhancedMemberDetail {
  member: Member;
  sessions: UserSession[];
  verification: UserVerification[];
  referrals: UserReferral[];
  is_admin: boolean;
  total_sessions: number;
  active_sessions: number;
}

interface MemberListResponse {
  success: boolean;
  message: string;
  members: Member[];
  total: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

interface MemberDetailResponse {
  success: boolean;
  message: string;
  member?: Member;
  enhanced_detail?: EnhancedMemberDetail;
}


interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

interface ToggleSafetyResponse {
  success: boolean;
  message: string;
}

interface AddToAdminResponse {
  success: boolean;
  message: string;
}

interface CurrentAdminInfo {
  id: string;
  name: string;
  admin_type: string;
  is_super_admin: boolean;
}

interface MemberManagementProps {
  authSeed: string;
  onStatsChange?: (totalMembers: number, loadedMembers: number) => void;
}

export interface MemberManagementRef {
  totalMembers: number;
  loadedMembers: number;
  refresh: () => void;
}

const MemberManagement = forwardRef<MemberManagementRef, MemberManagementProps>(({ authSeed, onStatsChange }, ref) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [totalMembers, setTotalMembers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [enhancedMemberDetail, setEnhancedMemberDetail] = useState<EnhancedMemberDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingMemberKode, setLoadingMemberKode] = useState<string | null>(null);
  const [updatingVerification, setUpdatingVerification] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'sessions' | 'verification' | 'referrals'>('details');
  const [imageOverlay, setImageOverlay] = useState<{ url: string; type: string } | null>(null);
  const [currentAdminInfo, setCurrentAdminInfo] = useState<CurrentAdminInfo | null>(null);
  
  // New loading states for individual actions
  const [deletingSessions, setDeletingSessions] = useState<Set<string>>(new Set());
  const [togglingSafety, setTogglingSafety] = useState<Set<string>>(new Set());
  const [addingToAdmin, setAddingToAdmin] = useState<string | null>(null);

  const limit = 10;

  // Expose stats and refresh function to parent
  useImperativeHandle(ref, () => ({
    totalMembers,
    loadedMembers: members.length,
    refresh: () => fetchMembers(false)
  }));

  // Notify parent when stats change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(totalMembers, members.length);
    }
  }, [totalMembers, members.length, onStatsChange]);

  // Handle escape key to close image overlay
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageOverlay) {
        setImageOverlay(null);
      }
    };

    if (imageOverlay) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [imageOverlay]);

  // Cleanup blob URLs when image overlay is closed
  useEffect(() => {
    return () => {
      if (imageOverlay?.url && imageOverlay.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageOverlay.url);
      }
    };
  }, [imageOverlay]);

  useEffect(() => {
    // Fetch current admin info when component loads
    fetchCurrentAdminInfo();
  }, []);

  useEffect(() => {
    // Reset cursor when filters change to start fresh
    setNextCursor(undefined);
    
    // Add a small delay for search term to prevent too many API calls
    const timeoutId = setTimeout(() => {
      fetchMembers();
    }, searchTerm ? 300 : 0); // 300ms delay only for search term changes
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, levelFilter, verificationFilter]);

  const handleLoadMore = () => {
    fetchMembers(true);
  };

  const fetchMembers = async (isLoadMore = false) => {
    setLoading(true);
    setIsLoadingMore(isLoadMore);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(levelFilter && { level: levelFilter }),
        ...(verificationFilter !== 'all' && { verification: verificationFilter }),
        ...(nextCursor && nextCursor.trim() !== '' && { cursor: nextCursor }),
      });

      // Debug logging
      console.log('Fetching members with params:', {
        searchTerm,
        statusFilter,
        levelFilter,
        verificationFilter,
        nextCursor,
        isLoadMore,
        params: params.toString()
      });
      console.log('Verification filter value:', verificationFilter);

      const apiUrl = await getApiUrl(`/members?${params}`);
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: MemberListResponse = await response.json();

      // Debug logging
      console.log('Members response:', {
        success: data.success,
        message: data.message,
        membersCount: data.members?.length || 0,
        total: data.total,
        hasMore: data.has_more,
        nextCursor: data.next_cursor
      });

      if (data.success) {
        // If this is a "Load More" operation, append to existing members
        // Otherwise, replace members (new search/filter)
        if (isLoadMore) {
          setMembers(prev => [...prev, ...data.members]);
        } else {
          setMembers(data.members);
        }
        setHasMore(data.has_more);
        setNextCursor(data.next_cursor);
        setTotalMembers(data.total);
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMessage('Gagal memuat member');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchCurrentAdminInfo = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
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
      }
    } catch (error) {
      console.error('Failed to fetch current admin info:', error);
    }
  };

  const fetchMemberDetail = async (kode: string) => {
    setLoadingMemberKode(kode);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl(`/members/enhanced-detail?kode=${kode}`);
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: MemberDetailResponse = await response.json();

      if (data.success && data.enhanced_detail) {
        setSelectedMember(data.enhanced_detail.member);
        setEnhancedMemberDetail(data.enhanced_detail);
        setShowDetailModal(true);
        setActiveTab('details');
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch member detail:', error);
      setMessage('Gagal memuat detail member');
    } finally {
      setLoadingMemberKode(null);
    }
  };

  const deleteSession = async (sessionKey: string) => {
    setDeletingSessions(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/delete-session');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ session_key: sessionKey }),
      });

      const data: DeleteSessionResponse = await response.json();

      if (data.success) {
        setMessage('Sesi berhasil dihapus');
        // Update only the sessions data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedSessions = enhancedMemberDetail.sessions.filter(s => s.session_key !== sessionKey);
          const updatedActiveSessions = updatedSessions.filter(s => s.safetycheck === 1).length;
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            sessions: updatedSessions,
            active_sessions: updatedActiveSessions,
            total_sessions: updatedSessions.length
          });
        }
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      setMessage('Gagal menghapus sesi');
    } finally {
      setDeletingSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionKey);
        return newSet;
      });
    }
  };

  const toggleSafetyCheck = async (sessionKey: string, currentSafety: number) => {
    setTogglingSafety(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/toggle-safety');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ 
          session_key: sessionKey,
          safety_status: currentSafety === 1 ? 0 : 1
        }),
      });

      const data: ToggleSafetyResponse = await response.json();

      if (data.success) {
        setMessage('Status keamanan berhasil diperbarui');
        // Update only the specific session data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedSessions = enhancedMemberDetail.sessions.map(s => 
            s.session_key === sessionKey 
              ? { ...s, safetycheck: currentSafety === 1 ? 0 : 1 }
              : s
          );
          const updatedActiveSessions = updatedSessions.filter(s => s.safetycheck === 1).length;
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            sessions: updatedSessions,
            active_sessions: updatedActiveSessions
          });
        }
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to toggle safety status:', error);
      setMessage('Gagal mengubah status keamanan');
    } finally {
      setTogglingSafety(prev => {
        const newSet = new Set(prev);
        newSet.delete(sessionKey);
        return newSet;
      });
    }
  };

  const addToAdmin = async (kode: string) => {
    setAddingToAdmin(kode);
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/add-admin');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ kode }),
      });

      const data: AddToAdminResponse = await response.json();

      if (data.success) {
        setMessage('Pengguna berhasil ditambahkan ke admin');
        // Update only the admin status instead of refreshing everything
        if (enhancedMemberDetail) {
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            is_admin: true
          });
        }
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to add user to admin:', error);
      setMessage('Failed to add user to admin');
    } finally {
      setAddingToAdmin(null);
    }
  };

  const updateVerificationStatus = async (id: string, type: string, status: string) => {
    const updateKey = `${id}_${type}`;
    setUpdatingVerification(updateKey);
    
    try {
      const sessionKey_admin = localStorage.getItem('adminSessionKey');
      if (!sessionKey_admin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl(`/admin/verify?ID=${encodeURIComponent(id)}&Type=${encodeURIComponent(type)}&Status=${encodeURIComponent(status)}`);
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey_admin,
          'Auth-Seed': authSeed,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Status verifikasi berhasil diperbarui ke "${status}"`);
        // Update only the verification data instead of refreshing everything
        if (enhancedMemberDetail) {
          const updatedVerification = enhancedMemberDetail.verification.map(v => 
            v.id === id && v.type_ === type 
              ? { ...v, status }
              : v
          );
          setEnhancedMemberDetail({
            ...enhancedMemberDetail,
            verification: updatedVerification
          });
        }
      } else {
        setMessage(data.message || 'Gagal memperbarui status verifikasi');
      }
    } catch (error) {
      console.error('Failed to update verification status:', error);
      setMessage('Gagal memperbarui status verifikasi');
    } finally {
      setUpdatingVerification(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getVerificationStatusStyle = (status: string) => {
    switch (status) {
      case 'Terverifikasi':
        return 'bg-green-100 text-green-800';
      case 'Dalam Proses':
        return 'bg-blue-100 text-blue-800';
      case 'Perbaiki Verifikasi':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'Terverifikasi':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'Dalam Proses':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'Perbaiki Verifikasi':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };



  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>

          {/* Level Filter */}
          <input
            type="text"
            placeholder="Filter berdasarkan level..."
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {/* Verification Status Filter */}
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Semua Verifikasi</option>
            <option value="none">Tidak Ada Verifikasi</option>
            <option value="Terverifikasi">Terverifikasi</option>
            <option value="Dalam Proses">Dalam Proses</option>
            <option value="Perbaiki Verifikasi">Perbaiki Verifikasi</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setLevelFilter('');
              setVerificationFilter('all');
              setNextCursor(undefined);
            }}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Hapus Filter
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading && !isLoadingMore ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4">
              <Spinner size="lg" color="primary" />
            </div>
            <p className="text-gray-600">Memuat member...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed divide-y divide-gray-200" style={{ minWidth: '1000px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-1/3 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="w-1/8 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="w-1/8 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-1/12 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="w-1/6 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verifikasi
                    </th>
                    <th className="w-1/8 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Daftar
                    </th>
                    <th className="w-1/12 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.kode} className="hover:bg-gray-50">
                      <td className="px-2 py-3">
                        <div className="flex items-center min-w-0">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-3 w-3 text-indigo-600" />
                          </div>
                          <div className="ml-2 min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900 truncate">{member.nama}</div>
                            <div className="text-xs text-gray-500 truncate">{member.kode}</div>
                            {member.alamat && (
                              <div className="flex items-center text-xs text-gray-400 truncate">
                                <MapPin className="h-2 w-2 mr-1 flex-shrink-0" />
                                <span className="truncate">{member.alamat}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {formatCurrency(member.saldo)}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          member.aktif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.aktif ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 truncate">
                        {member.kode_level || '-'}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col space-y-0.5">
                          {member.verification && member.verification.length > 0 ? (
                            member.verification.slice(0, 2).map((verif) => (
                              <span key={verif.id} className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getVerificationStatusStyle(verif.status)}`}>
                                {getVerificationStatusIcon(verif.status)}
                                <span className="truncate">{verif.type_}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                          {member.verification && member.verification.length > 2 && (
                            <span className="text-xs text-gray-400">+{member.verification.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-500">
                        {formatDate(member.tgl_daftar) || '-'}
                      </td>
                      <td className="px-2 py-3 text-xs font-medium">
                        <div className="flex items-center">
                          <button
                            onClick={() => fetchMemberDetail(member.kode)}
                            disabled={loadingMemberKode === member.kode}
                            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed px-1.5 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors w-full flex items-center justify-center text-xs"
                            title="Lihat Detail"
                          >
                            {loadingMemberKode === member.kode ? (
                              <Spinner size="sm" color="primary" />
                            ) : (
                              'Detail'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {hasMore && (
              <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200 sm:px-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 min-w-[100px] justify-center"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" color="secondary" />
                      <span>Memuat...</span>
                    </div>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Member Detail Modal */}
      {showDetailModal && selectedMember && enhancedMemberDetail && createPortal(
        <div 
          className="fixed bg-gray-600 bg-opacity-50 z-[9999]" 
          style={{ 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            width: '100vw', 
            height: '100vh',
            position: 'fixed',
            margin: 0,
            padding: 0
          }}
        >
          <div className="flex items-center justify-center min-h-full p-4">
            <div className="relative mx-auto p-3 border w-[1200px] h-[700px] shadow-lg rounded-md bg-white overflow-hidden">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">Detail Member - {selectedMember.nama}</h3>
                                      <p className="text-sm text-gray-600">Kode: {selectedMember.kode}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {!enhancedMemberDetail.is_admin && currentAdminInfo?.is_super_admin && (
                    <button
                      onClick={() => addToAdmin(selectedMember.kode)}
                      disabled={addingToAdmin === selectedMember.kode}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToAdmin === selectedMember.kode ? (
                        <div className="flex items-center space-x-2">
                          <Spinner size="sm" color="white" />
                          <span>Menambahkan...</span>
                        </div>
                      ) : (
                        'Tambah ke Admin'
                      )}
                    </button>
                  )}
                  {enhancedMemberDetail.is_admin && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                      Pengguna Admin
                    </span>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'details', label: 'Detail' },
                    { id: 'sessions', label: `Sesi (${enhancedMemberDetail.total_sessions})` },
                    { id: 'verification', label: 'Verifikasi' },
                    { id: 'referrals', label: 'Referral' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="h-[500px] overflow-y-auto">
              {activeTab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.nama}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.kode}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Balance</label>
                      <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedMember.saldo)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.alamat || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedMember.aktif
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedMember.aktif ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Level</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.kode_level || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upline</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.kode_upline || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Date</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMember.tgl_daftar)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMember.tgl_aktivitas)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Owner Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.nama_pemilik || '-'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Markup</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMember.markup ? `${selectedMember.markup}%` : '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium">Sesi Aktif: {enhancedMemberDetail.active_sessions} dari {enhancedMemberDetail.total_sessions}</h4>
                  </div>
                  
                  {(() => {
                    const filteredSessions = enhancedMemberDetail.sessions.filter(
                      session => session.imei && session.device_model
                    );
                    return filteredSessions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed divide-y divide-gray-200" style={{ minWidth: '900px' }}>
                          <colgroup>
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '26%' }} />
                            <col style={{ width: '18%' }} />
                            <col style={{ width: '14%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '10%' }} />
                          </colgroup>
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perangkat</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMEI</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keamanan</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dibuat</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSessions.map((session) => (
                            <tr key={session.session_key} className="hover:bg-gray-50">
                              <td className="px-2 py-2 text-xs text-gray-900 truncate whitespace-nowrap align-middle">
                                {session.number}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900 truncate whitespace-nowrap align-middle">
                                {session.device_model || '-'}
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-900 truncate whitespace-nowrap align-middle">
                                {session.imei || '-'}
                              </td>
                              <td className="px-2 py-2 align-middle">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  session.safetycheck === 1
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {session.safetycheck === 1 ? 'Aman' : 'Tidak Aman'}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-xs text-gray-500 whitespace-nowrap align-middle">
                                {formatDate(session.created_at)}
                              </td>
                              <td className="px-2 py-2 text-xs font-medium align-middle">
                                <div className="flex flex-col space-y-1">
                                  <button
                                    onClick={() => toggleSafetyCheck(session.session_key, session.safetycheck)}
                                    disabled={togglingSafety.has(session.session_key)}
                                    className={`text-xs px-1.5 py-0.5 rounded w-full ${
                                      session.safetycheck === 1
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    {togglingSafety.has(session.session_key) ? (
                                      <Spinner size="sm" color="secondary" />
                                    ) : (
                                      <span className="hidden sm:inline">{session.safetycheck === 1 ? 'Tandai Tidak Aman' : 'Tandai perangkat aman'}</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteSession(session.session_key)}
                                    disabled={deletingSessions.has(session.session_key)}
                                    className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                  >
                                    {deletingSessions.has(session.session_key) ? (
                                      <Spinner size="sm" color="secondary" />
                                    ) : (
                                      'Keluar'
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Tidak ada sesi aktif ditemukan.</p>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'verification' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Status Verifikasi</h4>
                  
                  {enhancedMemberDetail.verification.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed divide-y divide-gray-200" style={{ minWidth: '900px' }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                            <th className="w-2/5 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gambar</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {enhancedMemberDetail.verification.map((verif) => (
                            <tr key={verif.id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-sm text-gray-900 truncate">
                                {verif.id}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900 truncate">
                                {verif.type_}
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex flex-col space-y-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationStatusStyle(verif.status)}`}>
                                    {getVerificationStatusIcon(verif.status)}
                                    {verif.status}
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    <button
                                      onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Terverifikasi')}
                                      disabled={verif.status === 'Terverifikasi' || updatingVerification === `${verif.id}_${verif.type_}`}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        verif.status === 'Terverifikasi'
                                          ? 'bg-green-100 text-green-600 cursor-not-allowed'
                                          : updatingVerification === `${verif.id}_${verif.type_}`
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-green-500 text-white hover:bg-green-600'
                                      }`}
                                      title="Set to Terverifikasi"
                                    >
                                      {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                        <Spinner size="sm" color="white" />
                                      ) : (
                                        '✓'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Dalam Proses')}
                                      disabled={verif.status === 'Dalam Proses' || updatingVerification === `${verif.id}_${verif.type_}`}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        verif.status === 'Dalam Proses'
                                          ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                                          : updatingVerification === `${verif.id}_${verif.type_}`
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-blue-500 text-white hover:bg-blue-600'
                                      }`}
                                      title="Set to Dalam Proses"
                                    >
                                      {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                        <Spinner size="sm" color="white" />
                                      ) : (
                                        '⏳'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => updateVerificationStatus(verif.id, verif.type_, 'Perbaiki Verifikasi')}
                                      disabled={verif.status === 'Perbaiki Verifikasi' || updatingVerification === `${verif.id}_${verif.type_}`}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        verif.status === 'Perbaiki Verifikasi'
                                          ? 'bg-red-100 text-red-600 cursor-not-allowed'
                                          : updatingVerification === `${verif.id}_${verif.type_}`
                                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          : 'bg-red-500 text-white hover:bg-red-600'
                                      }`}
                                      title="Set to Perbaiki Verifikasi"
                                    >
                                      {updatingVerification === `${verif.id}_${verif.type_}` ? (
                                        <Spinner size="sm" color="white" />
                                      ) : (
                                        '✗'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                {verif.image_url ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <VerificationImage 
                                      imageUrl={verif.image_url} 
                                      type={verif.type_}
                                      onImageClick={(url, type) => setImageOverlay({ url, type })}
                                    />
                                    <span className="text-xs text-gray-500 text-center">Click to enlarge</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No image</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No verification records found.</p>
                  )}
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Referral Codes</h4>
                  
                  {enhancedMemberDetail.referrals.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed divide-y divide-gray-200" style={{ minWidth: '600px' }}>
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="w-1/3 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="w-1/2 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
                            <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Markup</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {enhancedMemberDetail.referrals.map((referral) => (
                            <tr key={referral.id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 text-sm text-gray-900 truncate">
                                {referral.id}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900 truncate">
                                {referral.referral}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900">
                                {referral.markup}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No referral codes found.</p>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
      )}

      {/* Image Overlay Modal */}
      {imageOverlay && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000] p-4"
          onClick={() => setImageOverlay(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {imageOverlay.type.charAt(0).toUpperCase() + imageOverlay.type.slice(1)} Verification Image
                </h3>
                <button
                  onClick={() => setImageOverlay(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <img
                  src={imageOverlay.url}
                  alt={`${imageOverlay.type} verification`}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                  onError={(e) => {
                    console.error('Image failed to load in overlay:', imageOverlay.url);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center text-gray-500 py-8';
                    errorDiv.textContent = 'Image could not be loaded';
                    target.parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MemberManagement.displayName = 'MemberManagement';

export default MemberManagement;
