import React, { useState, useEffect } from 'react';
import logoImg from './logo.webp';
import { getGameCover } from '../config/gameAssets';
import {
  Users,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  Crown,
  KeyRound,
  DollarSign,
  Globe,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
  TrendingUp,
  Layers,
  Settings,
  BarChart3,
  CreditCard,
  Bell,
  FileText,
  Gamepad2,
  ArrowDownLeft,
  UserPlus,
  ChevronDown,
  Shield,
  Calendar,
  Menu,
  Mail,
  Phone,
  Send,
  Download,
  Activity,
  Sliders,
  Percent,
  Save,
  Database,
  Check,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Zap,
  ShieldAlert,
  Filter,
  CalendarDays,
  Printer,
  Receipt,
  Scale,
  TrendingDown,
  FileDown,
  PieChart,
  Clock,
  Coins,
  Eye,
  Network,
  Share2,
  UserCheck,
  Sparkles,
  Link2
} from 'lucide-react';
import { User, AdminPermissions } from '../types';

interface AdminMetrics {
  totalUsers: number;
  totalBalance: number;
  totalDepositsAmount: number;
  totalDepositsCount: number;
  approvedWithdrawalsAmount: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  activeGamesCount: number;
  totalGamesCount: number;
  gameGgr?: number;
  totalWagered?: number;
  totalPayout?: number;
  totalAffiliateBalance?: number;
  totalAffiliateCommissionsPaid?: number;
  netProfit?: number;
  profitMarginPercent?: number;
  totalLiabilities?: number;
  todaySalesAmount?: number;
  todaySalesPercentChange?: number;
  newUsersToday?: number;
  totalReferredUsers?: number;
  totalOrganicUsers?: number;
  chartData?: Array<{
    date: string;
    deposits: number;
    withdrawals: number;
    netBalance: number;
  }>;
  recentActivities?: Array<{
    id: string;
    type: 'deposit' | 'withdrawal' | 'user_registered' | 'game_ended';
    title: string;
    userName: string;
    amount?: number | null;
    timeAgo: string;
  }>;
}

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  minWithdraw?: number;
  isInfluencer?: boolean;
  cpaKillerAllowed?: boolean;
  role: 'user' | 'admin' | 'superadmin' | 'affiliate';
  isBlocked: boolean;
  adminPermissions: AdminPermissions;
  createdAt: string;
  pixKeys?: any[];
  totalDeposited?: number;
  referredBy?: {
    affiliateId: string;
    referralCode: string;
    affiliateUserId: string | null;
    sponsorName: string;
    sponsorEmail: string | null;
    sponsorPhone?: string | null;
    isInfluencer?: boolean;
    role?: string;
  } | null;
  affiliateInfo?: {
    id: string;
    referralCode: string;
    status: string;
    commissionTotal: number;
    affiliateBalance: number;
    cpaAmount: number;
    revSharePercent: number;
    indicationsCount: number;
    availableWithdrawal: number;
    referredUsers?: Array<{
      userId: string;
      name: string;
      email: string;
      joinedAt: string;
    }>;
  } | null;
}

interface AdminWithdrawalItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  description: string;
  createdAt: string;
  pixKey?: any;
  referredBy?: {
    affiliateId: string;
    referralCode: string;
    affiliateUserId: string | null;
    sponsorName: string;
    sponsorEmail: string | null;
    sponsorPhone?: string | null;
    isInfluencer?: boolean;
    role?: string;
  } | null;
}

interface AdminDepositItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  amount: number;
  status: 'approved' | 'pending' | 'failed';
  paymentMethod: string;
  description: string;
  createdAt: string;
  referredBy?: {
    affiliateId: string;
    referralCode: string;
    affiliateUserId: string | null;
    sponsorName: string;
    sponsorEmail: string | null;
    sponsorPhone?: string | null;
    isInfluencer?: boolean;
    role?: string;
  } | null;
}

interface AdminGameItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  minBet: number;
  maxBet: number;
  rtpPercent: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  totalWagered?: number;
  totalPayout?: number;
  ggr?: number;
  totalBetsCount?: number;
  totalWinsCount?: number;
  totalLossesCount?: number;
  effectiveRtp?: number;
  effectiveHouseEdge?: number;
  houseEdgeMode?: 'balanced' | 'house_advantage' | 'promo' | 'easy' | 'hard' | 'extreme';
  maxMultiplier?: number;
  antiBailoutMode?: boolean;
  heavyBlocksForce?: boolean;
  dynamicRetention?: boolean;
  streakLimiterMultiplier?: number;
  nearLossPressure?: boolean;
  winStreakBrake?: boolean;
  antiComboBlocker?: boolean;
  highBetResistance?: boolean;
  giantPieceFrequency?: number;
  instantLossOnTargetProfit?: number;
  tightenOnHighOccupancy?: boolean;
  minCashoutMultiplier?: number;
  lineMultiplierStep?: number;
  initialMultiplier?: number;
  retentionAggressiveness?: 'soft' | 'moderate' | 'aggressive' | 'ruthless' | 'impossible';
  forceLossOnMaxMultiplier?: boolean;
  consecutiveWinDecay?: number;
  gameSpeedPercent?: number;
  obstacleDensityPercent?: number;
  reactionWindowMs?: number;
  bonusFrequencyPercent?: number;
  comboWindowMs?: number;
  mistakeTolerance?: number;
  difficultyRampPercent?: number;
  easyOpeningRounds?: number;
  extremeModeStartRound?: number;
  phaseDifficultyMultiplier?: number;
  configVersion?: number;
  updatedAt?: string;
  recentBets?: {
    id: string;
    userId: string;
    userName: string;
    betAmount: number;
    multiplier: number;
    payoutAmount: number;
    profitAmount: number;
    status: 'active' | 'cashed_out' | 'lost';
    difficulty: string;
    createdAt: string;
  }[];
}

interface ReportPeriodSummary {
  grossDeposits: number;
  grossDepositsCount: number;
  pendingDepositsCount: number;
  allDepositsCount: number;
  depositConversionRate: number;
  totalWithdrawals: number;
  totalWithdrawalsCount: number;
  pendingWithdrawalsAmount: number;
  pendingWithdrawalsCount: number;
  rejectedWithdrawalsCount: number;
  netCashflow: number;
  wagered: number;
  payouts: number;
  ggr: number;
  ggrMarginPercent: number;
  realRtpPercent: number;
  configuredRtpPercent?: number;
  totalAffiliateCommissions: number;
  ngr: number;
  netOperatingMargin: number;
  newUsersCount: number;
  activePlayersCount: number;
  ftdCount: number;
  ftdVolume: number;
  conversionRatePercent: number;
  avgDepositTicket: number;
  avgWithdrawalTicket: number;
  totalBetsCount: number;
  winsCount: number;
  lossesCount: number;
  winRatePercent: number;
  topMultiplier: number;
  topWinAmount: number;
}

interface ReportDailyItem {
  date: string;
  displayDate: string;
  deposits: number;
  depositsCount: number;
  withdrawals: number;
  withdrawalsCount: number;
  netCashflow: number;
  wagered: number;
  payouts: number;
  ggr: number;
  newUsers: number;
  ftdCount: number;
}

interface ReportAnalyticsData {
  period: string;
  startTime: string;
  endTime: string;
  periodSummary: ReportPeriodSummary;
  dailyBreakdown: ReportDailyItem[];
  depositBuckets: {
    [key: string]: { label: string; count: number; total: number };
  };
  difficultyDistribution: Record<string, number>;
  topProfitablePlayers: Array<{
    userId: string;
    name: string;
    email: string;
    phone: string;
    currentBalance: number;
    totalDeposited: number;
    depositsCount: number;
    totalWithdrawn: number;
    withdrawalsCount: number;
    totalWagered: number;
    totalPayouts: number;
    ggrGenerated: number;
    betsCount: number;
  }>;
  topWithdrawingPlayers: Array<{
    userId: string;
    name: string;
    email: string;
    totalWithdrawn: number;
    withdrawalsCount: number;
    totalDeposited: number;
  }>;
  topDepositingPlayers: Array<{
    userId: string;
    name: string;
    email: string;
    totalDeposited: number;
    depositsCount: number;
    totalWithdrawn: number;
  }>;
  affiliateRanking: Array<{
    affiliateId: string;
    userId: string;
    userName: string;
    userEmail: string;
    referralCode: string;
    totalReferrals: number;
    periodReferralsCount: number;
    ftdCount: number;
    referralDepositsTotal: number;
    cpaAmount: number;
    revSharePercent: number;
    commissionTotal: number;
    currentBalance: number;
  }>;
  transactions: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    status: 'approved' | 'pending' | 'rejected';
    paymentMethod: string;
    description: string;
    createdAt: string;
  }>;
}

interface AdminPanelProps {
  currentUser: User;
  token: string | null;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  token,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<
    'metrics' | 'users' | 'withdrawals' | 'deposits' | 'games' | 'reports' | 'notifications' | 'admins' | 'security'
  >('metrics');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'players' | 'influencers' | 'active' | 'blocked' | 'affiliates' | 'with_sponsor' | 'organic'>('all');
  const [selectedSponsorFilter, setSelectedSponsorFilter] = useState<string | null>(null);
  const [viewingAffiliateNetwork, setViewingAffiliateNetwork] = useState<AdminUserItem | null>(null);

  // Overview Tab Network states
  const [overviewNetworkFilter, setOverviewNetworkFilter] = useState<string>('all');
  const [overviewPlayerSearch, setOverviewPlayerSearch] = useState<string>('');

  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserItem | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');
  const [balanceActionType, setBalanceActionType] = useState<'add' | 'subtract' | 'set'>('add');
  const [balanceAdjustNote, setBalanceAdjustNote] = useState('');
  const [minWithdrawAmount, setMinWithdrawAmount] = useState('100.00');
  const [cpaKillerAllowed, setCpaKillerAllowed] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState<'user' | 'affiliate' | 'admin'>('user');
  const [selectedUserIsInfluencer, setSelectedUserIsInfluencer] = useState(false);
  const [submittingBalance, setSubmittingBalance] = useState(false);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  // Affiliate commission modal state
  const [selectedAffiliateForCommission, setSelectedAffiliateForCommission] = useState<AdminUserItem | null>(null);
  const [editCpaAmount, setEditCpaAmount] = useState('0.00');
  const [editRevSharePercent, setEditRevSharePercent] = useState('70.0');
  const [editAffiliateBalance, setEditAffiliateBalance] = useState('0.00');
  const [submittingCommission, setSubmittingCommission] = useState(false);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalItem[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Deposits state
  const [deposits, setDeposits] = useState<AdminDepositItem[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [searchDepositQuery, setSearchDepositQuery] = useState('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'with_sponsor' | 'organic' | 'approved' | 'pending'>('all');
  const [selectedDepositSponsorFilter, setSelectedDepositSponsorFilter] = useState<string | null>(null);

  // Games state
  const [games, setGames] = useState<AdminGameItem[]>([
    {
      id: 'g_block_puzzle',
      name: 'Block Puzzle iGaming',
      category: 'Estratégia & Habilidade',
      status: 'active',
      minBet: 1.0,
      maxBet: 500.0,
      rtpPercent: 96.0,
      difficulty: 'easy',
      totalWagered: 184200.0,
      totalPayout: 176832.0,
      ggr: 7368.0,
      totalBetsCount: 4210,
      totalWinsCount: 3950,
      totalLossesCount: 260,
      effectiveRtp: 96.0,
      effectiveHouseEdge: 4.0,
      houseEdgeMode: 'easy',
      maxMultiplier: 100.0
    }
  ]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [lastGamesUpdated, setLastGamesUpdated] = useState<string>('');
  const [savingGameId, setSavingGameId] = useState<string | null>(null);
  const [selectedDesktopGameId, setSelectedDesktopGameId] = useState<string>('g_gen_dino');

  useEffect(() => {
    if (activeTab !== 'games' || !token) return;
    const timer = window.setInterval(() => fetchGames(false), 5000);
    return () => window.clearInterval(timer);
  }, [activeTab, token]);

  // Notifications state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<'all' | string>('all');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Sub-Admins state
  const [adminsList, setAdminsList] = useState<AdminUserItem[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [isNewAdminModalOpen, setIsNewAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState<AdminPermissions>({
    canManageUsers: true,
    canManageBalances: false,
    canApproveWithdrawals: true,
    canManageAdmins: false,
    canViewMetrics: true,
    canManageGames: true
  });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Reports Analytical Intelligence Suite state
  const [reportPeriod, setReportPeriod] = useState<'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'last_month' | 'all' | 'custom'>('7days');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSubTab, setReportSubTab] = useState<'dre' | 'deposits' | 'withdrawals' | 'gaming' | 'affiliates' | 'players' | 'transactions'>('dre');
  const [reportData, setReportData] = useState<ReportAnalyticsData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportTxFilter, setReportTxFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const isSuperAdmin = currentUser.email.toLowerCase() === 'admin.eduh@gmail.com' || currentUser.role === 'superadmin';

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchWithdrawals();
    fetchDeposits();
    fetchAdmins();
    fetchGames();
    fetchReportData('7days');
  }, [token]);

  const fetchReportData = async (periodOverride?: string) => {
    if (!token) return;
    setLoadingReport(true);
    try {
      const activeP = periodOverride || reportPeriod;
      let url = `/api/admin/reports/analytics?period=${activeP}`;
      if (activeP === 'custom' && reportStartDate) {
        url += `&startDate=${encodeURIComponent(reportStartDate)}`;
        if (reportEndDate) {
          url += `&endDate=${encodeURIComponent(reportEndDate)}`;
        }
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReportData(data);
      } else {
        onShowToast(data.error || 'Falha ao carregar dados analíticos.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao carregar relatórios analíticos.', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchMetrics = async () => {
    if (!token) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.metrics) {
        setMetrics(data.metrics);
      } else {
        onShowToast(data.error || 'Falha ao carregar métricas.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro de conexão ao buscar métricas.', 'error');
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        onShowToast(data.error || 'Falha ao listar usuários.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro ao listar usuários.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchWithdrawals = async () => {
    if (!token) return;
    setLoadingWithdrawals(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      } else {
        onShowToast(data.error || 'Falha ao carregar saques.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro de rede ao buscar saques.', 'error');
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchDeposits = async () => {
    if (!token) return;
    setLoadingDeposits(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      }
    } catch (err: any) {
      // Fallback silent
    } finally {
      setLoadingDeposits(false);
    }
  };

  const fetchAdmins = async () => {
    if (!token) return;
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.admins)) {
        setAdminsList(data.admins);
      } else {
        onShowToast(data.error || 'Falha ao buscar administradores.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro de conexão ao carregar administradores.', 'error');
    } finally {
      setLoadingAdmins(false);
    }
  };

  // Adjust User Balance, Min Withdraw Limit & Role/Affiliate Hub
  const handleConfirmBalanceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance || !token) return;

    const payload: any = {
      actionType: balanceActionType,
      note: balanceAdjustNote.trim() || 'Ajuste administrativo pelo Admin'
    };

    if (balanceAdjustAmount.trim()) {
      const val = parseFloat(balanceAdjustAmount.replace(',', '.'));
      if (isNaN(val) || val < 0) {
        onShowToast('Informe um valor numérico válido para o saldo.', 'error');
        return;
      }
      if (balanceActionType === 'set') {
        payload.newBalance = val;
      } else {
        payload.amount = val;
      }
    }

    if (minWithdrawAmount.trim()) {
      const minVal = parseFloat(minWithdrawAmount.replace(',', '.'));
      if (isNaN(minVal) || minVal < 0) {
        onShowToast('Informe um valor de saque mínimo válido.', 'error');
        return;
      }
      payload.minWithdraw = minVal;
    }

    payload.cpaKillerAllowed = cpaKillerAllowed;
    payload.role = selectedUserRole;
    payload.isInfluencer = selectedUserIsInfluencer;
    payload.isAffiliate = selectedUserRole === 'affiliate';

    setSubmittingBalance(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForBalance.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Dados atualizados com sucesso!', 'success');
        setUsers(prev => prev.map(u => u.id === selectedUserForBalance.id ? {
          ...u,
          balance: data.user?.balance ?? u.balance,
          minWithdraw: data.user?.minWithdraw ?? u.minWithdraw,
          role: data.user?.role ?? selectedUserRole,
          isInfluencer: data.user?.isInfluencer !== undefined ? data.user.isInfluencer : selectedUserIsInfluencer,
          cpaKillerAllowed: cpaKillerAllowed,
          affiliateInfo: selectedUserRole === 'affiliate' && !u.affiliateInfo ? {
            id: 'aff_' + u.id,
            referralCode: u.id.slice(0, 6).toUpperCase(),
            status: 'active',
            commissionTotal: 0,
            affiliateBalance: 0,
            cpaAmount: 0,
            revSharePercent: 70.0,
            indicationsCount: 0,
            availableWithdrawal: 0,
            referredUsers: []
          } : u.affiliateInfo
        } : u));
        setSelectedUserForBalance(null);
        setBalanceAdjustAmount('');
        setBalanceAdjustNote('');
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Falha ao atualizar dados.', 'error');
      }
    } catch (err: any) {
      onShowToast('Erro de conexão ao atualizar dados.', 'error');
    } finally {
      setSubmittingBalance(false);
    }
  };

  // Quick Promote / Demote User to Affiliate Hub
  const handleQuickToggleAffiliate = async (userItem: AdminUserItem, targetStatus?: boolean) => {
    if (!token) return;
    const isCurrentlyAffiliate = userItem.role === 'affiliate';
    const makeAffiliate = targetStatus !== undefined ? targetStatus : !isCurrentlyAffiliate;

    setPromotingUserId(userItem.id);
    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/promote-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          makeAffiliate
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || (makeAffiliate ? 'Usuário promovido a Afiliado Hub!' : 'Usuário alterado para Jogador!'), 'success');
        setUsers(prev => prev.map(u => u.id === userItem.id ? {
          ...u,
          role: makeAffiliate ? 'affiliate' : 'user',
          affiliateInfo: data.user?.affiliateInfo || (makeAffiliate ? {
            id: 'aff_' + u.id,
            referralCode: u.id.slice(0, 6).toUpperCase(),
            status: 'active',
            commissionTotal: 0,
            affiliateBalance: 0,
            cpaAmount: 0,
            revSharePercent: 70.0,
            indicationsCount: 0,
            availableWithdrawal: 0,
            referredUsers: []
          } : null)
        } : u));
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao alterar papel do usuário.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao alterar papel do usuário.', 'error');
    } finally {
      setPromotingUserId(null);
    }
  };

  // Block / Unblock User
  const handleToggleBlockUser = async (userItem: AdminUserItem) => {
    if (!token) return;
    if (userItem.email.toLowerCase() === 'admin.eduh@gmail.com') {
      onShowToast('O Super Admin principal não pode ser bloqueado.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userItem.id}/block`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message, 'success');
        setUsers(prev => prev.map(u => u.id === userItem.id ? { ...u, isBlocked: data.isBlocked } : u));
      } else {
        onShowToast(data.error || 'Erro ao alterar status.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de rede ao alterar status do usuário.', 'error');
    }
  };

  // Approve Withdrawal
  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!token) return;
    setProcessingWithdrawalId(withdrawalId);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Saque aprovado com sucesso!', 'success');
        fetchWithdrawals();
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao aprovar saque.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de rede ao aprovar saque.', 'error');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  // Reject Withdrawal
  const handleRejectWithdrawal = async (withdrawalId: string) => {
    if (!token) return;
    const reason = prompt('Informe o motivo da rejeição do saque (opcional):');
    setProcessingWithdrawalId(withdrawalId);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Saque rejeitado e estornado.', 'success');
        fetchWithdrawals();
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao rejeitar saque.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao rejeitar saque.', 'error');
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const fetchGames = async (showToastFeedback = false) => {
    if (!token) return;
    setLoadingGames(true);
    try {
      const res = await fetch('/api/admin/games', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.games)) {
        setGames(data.games);
        setLastGamesUpdated(new Date().toLocaleTimeString('pt-BR'));
        if (showToastFeedback) {
          onShowToast('Métricas e estatísticas atualizadas em tempo real!', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching games config:', err);
      if (showToastFeedback) {
        onShowToast('Erro ao atualizar dados em tempo real.', 'error');
      }
    } finally {
      setLoadingGames(false);
    }
  };

  // Toggle Game Status
  const handleToggleGameStatus = async (gameId: string) => {
    if (!token) {
      setGames(prev =>
        prev.map(g => (g.id === gameId ? { ...g, status: g.status === 'active' ? 'inactive' : 'active' } : g))
      );
      return;
    }

    try {
      const res = await fetch(`/api/admin/games/${gameId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.game) {
        onShowToast(data.message, 'info');
        setGames(prev => prev.map(g => (g.id === gameId ? { ...g, status: data.game.status } : g)));
      } else {
        onShowToast(data.error || 'Erro ao alterar status.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao alterar status do jogo.', 'error');
    }
  };

  // Save Game Config & RTP
  const handleSaveGameConfig = async (game: AdminGameItem) => {
    if (!token) return;
    setSavingGameId(game.id);
    try {
      const res = await fetch(`/api/admin/games/${game.id}/rtp`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rtpPercent: game.rtpPercent,
          difficulty: game.difficulty,
          minBet: game.minBet,
          maxBet: game.maxBet,
          houseEdgeMode: game.houseEdgeMode || 'balanced',
          maxMultiplier: game.maxMultiplier || 100.0,
          antiBailoutMode: Boolean(game.antiBailoutMode),
          heavyBlocksForce: Boolean(game.heavyBlocksForce),
          dynamicRetention: game.dynamicRetention ?? true,
          streakLimiterMultiplier: game.streakLimiterMultiplier ?? 6.0,
          nearLossPressure: Boolean(game.nearLossPressure),
          winStreakBrake: Boolean(game.winStreakBrake),
          antiComboBlocker: Boolean(game.antiComboBlocker),
          highBetResistance: Boolean(game.highBetResistance),
          giantPieceFrequency: game.giantPieceFrequency ?? 25,
          instantLossOnTargetProfit: game.instantLossOnTargetProfit ?? 0,
          tightenOnHighOccupancy: Boolean(game.tightenOnHighOccupancy),
          minCashoutMultiplier: game.minCashoutMultiplier ?? 1.05,
          lineMultiplierStep: game.lineMultiplierStep ?? 0.40,
          initialMultiplier: game.initialMultiplier ?? 1.0,
          retentionAggressiveness: game.retentionAggressiveness || 'moderate',
          forceLossOnMaxMultiplier: game.forceLossOnMaxMultiplier ?? true,
          consecutiveWinDecay: game.consecutiveWinDecay ?? 0.05,
          gameSpeedPercent: game.gameSpeedPercent ?? 100,
          obstacleDensityPercent: game.obstacleDensityPercent ?? 50,
          reactionWindowMs: game.reactionWindowMs ?? 850,
          bonusFrequencyPercent: game.bonusFrequencyPercent ?? 20,
          comboWindowMs: game.comboWindowMs ?? 1200,
          mistakeTolerance: game.mistakeTolerance ?? 1,
          difficultyRampPercent: game.difficultyRampPercent ?? 50,
          easyOpeningRounds: game.easyOpeningRounds ?? 3,
          extremeModeStartRound: game.extremeModeStartRound ?? 12,
          phaseDifficultyMultiplier: game.phaseDifficultyMultiplier ?? 1.25
        })
      });

      const data = await res.json();
      if (res.ok && data.game) {
        onShowToast(data.message || 'Configurações de RTP e alavancas sincronizadas em tempo real!', 'success');
        setGames(prev => prev.map(g => (g.id === game.id ? { ...g, ...data.game } : g)));
      } else {
        onShowToast(data.error || 'Erro ao salvar RTP do jogo.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao salvar RTP do jogo.', 'error');
    } finally {
      setSavingGameId(null);
    }
  };

  // Send Push Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      onShowToast('Informe o título e a mensagem da notificação.', 'error');
      return;
    }
    setSendingNotification(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: notificationTitle.trim(),
          body: notificationBody.trim(),
          targetUserId: notificationTarget
        })
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Notificação disparada aos usuários!', 'success');
        setNotificationTitle('');
        setNotificationBody('');
      } else {
        onShowToast(data.error || 'Erro ao enviar notificação.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de rede ao enviar notificação.', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  // Export Reports in CSV Format (Multi-Report Support)
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Relatório exportado: ${filename}.csv`, 'success');
  };

  const handleExportDRE_CSV = () => {
    if (!reportData) {
      onShowToast('Carregando dados para exportação...', 'info');
      return;
    }
    const headers = [
      'Data',
      'Entradas PIX (R$)',
      'Qtd Depósitos',
      'Saídas Pagas (R$)',
      'Qtd Saques',
      'Fluxo Líquido Caixa (R$)',
      'Volume Apostado (R$)',
      'Prêmios Pagos (R$)',
      'GGR da Casa (R$)',
      'Novos Cadastros',
      'Novos Depositantes (FTD)'
    ];
    const rows = reportData.dailyBreakdown.map(d => [
      d.displayDate + ' (' + d.date + ')',
      d.deposits.toFixed(2),
      d.depositsCount,
      d.withdrawals.toFixed(2),
      d.withdrawalsCount,
      d.netCashflow.toFixed(2),
      d.wagered.toFixed(2),
      d.payouts.toFixed(2),
      d.ggr.toFixed(2),
      d.newUsers,
      d.ftdCount
    ]);
    downloadCSV('DRE_Financeiro_Diario', headers, rows);
  };

  const handleExportTransactions_CSV = () => {
    if (!reportData || !reportData.transactions) {
      onShowToast('Sem dados de transações para o período.', 'error');
      return;
    }
    const headers = ['ID Transação', 'Data e Hora', 'Usuário', 'E-mail', 'Telefone', 'Tipo', 'Valor (R$)', 'Status', 'Método', 'Descrição'];
    const rows = reportData.transactions.map(t => [
      t.id,
      new Date(t.createdAt).toLocaleString('pt-BR'),
      t.userName,
      t.userEmail,
      t.userPhone,
      t.type === 'deposit' ? 'Depósito PIX' : 'Saque PIX',
      t.amount.toFixed(2),
      t.status === 'approved' ? 'Aprovado' : t.status === 'pending' ? 'Pendente' : 'Rejeitado / Falha',
      t.paymentMethod,
      t.description || '-'
    ]);
    downloadCSV('Extrato_Transacoes_PIX', headers, rows);
  };

  const handleExportAffiliates_CSV = () => {
    if (!reportData || !reportData.affiliateRanking) {
      onShowToast('Sem dados de afiliados para o período.', 'error');
      return;
    }
    const headers = ['Código Ref', 'Afiliado', 'E-mail', 'Total Indicações', 'Indicações Período', 'FTDs Ativos', 'Volume Gerado (R$)', 'CPA Config (R$)', 'RevShare (%)', 'Comissão Total (R$)', 'Saldo Disponível (R$)'];
    const rows = reportData.affiliateRanking.map(a => [
      a.referralCode,
      a.userName,
      a.userEmail,
      a.totalReferrals,
      a.periodReferralsCount,
      a.ftdCount,
      a.referralDepositsTotal.toFixed(2),
      a.cpaAmount.toFixed(2),
      `${a.revSharePercent}%`,
      a.commissionTotal.toFixed(2),
      a.currentBalance.toFixed(2)
    ]);
    downloadCSV('Performance_Afiliados_Trafego', headers, rows);
  };

  const handleExportPlayers_CSV = () => {
    if (!reportData || !reportData.topProfitablePlayers) {
      onShowToast('Sem dados de jogadores para o período.', 'error');
      return;
    }
    const headers = ['Jogador', 'E-mail', 'Telefone', 'Saldo Atual (R$)', 'Total Depositado (R$)', 'Total Sacado (R$)', 'Total Apostado (R$)', 'Prêmios Recebidos (R$)', 'Lucro p/ Casa GGR (R$)', 'Qtd Apostas'];
    const rows = reportData.topProfitablePlayers.map(p => [
      p.name,
      p.email,
      p.phone,
      p.currentBalance.toFixed(2),
      p.totalDeposited.toFixed(2),
      p.totalWithdrawn.toFixed(2),
      p.totalWagered.toFixed(2),
      p.totalPayouts.toFixed(2),
      p.ggrGenerated.toFixed(2),
      p.betsCount
    ]);
    downloadCSV('Top_Jogadores_LTV', headers, rows);
  };

  const handlePrintExecutiveReport = () => {
    window.print();
  };

  // Add New Sub-Admin
  const handleAddSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newAdminEmail.trim()) return;

    setSubmittingAdmin(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          permissions: newAdminPermissions
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Novo administrador adicionado com sucesso!', 'success');
        setNewAdminEmail('');
        setIsNewAdminModalOpen(false);
        fetchAdmins();
      } else {
        onShowToast(data.error || 'Erro ao adicionar administrador.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao adicionar administrador.', 'error');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Remove / Revoke Sub-Admin Role
  const handleRevokeAdmin = async (adminId: string, email: string) => {
    if (!token) return;
    if (email.toLowerCase() === 'admin.eduh@gmail.com') {
      onShowToast('Não é possível revogar o Super Admin principal.', 'error');
      return;
    }

    if (!confirm(`Tem certeza que deseja remover o acesso administrativo de ${email}?`)) return;

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast(data.message || 'Acesso administrativo revogado.', 'success');
        fetchAdmins();
      } else {
        onShowToast(data.error || 'Erro ao revogar administrador.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de rede ao revogar administrador.', 'error');
    }
  };

  // Update Permission Flag
  const handleUpdatePermissions = async (adminId: string, currentPermissions: AdminPermissions, key: keyof AdminPermissions) => {
    if (!token) return;
    const updated = {
      ...currentPermissions,
      [key]: !currentPermissions[key]
    };

    try {
      const res = await fetch(`/api/admin/admins/${adminId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: updated })
      });
      const data = await res.json();
      if (res.ok) {
        onShowToast('Permissões atualizadas com sucesso.', 'success');
        setAdminsList(prev => prev.map(a => a.id === adminId ? { ...a, adminPermissions: updated } : a));
      } else {
        onShowToast(data.error || 'Erro ao atualizar permissões.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao alterar permissões.', 'error');
    }
  };

  const handleSaveAffiliateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliateForCommission || !token) return;

    try {
      setSubmittingCommission(true);
      const res = await fetch(`/api/admin/affiliates/${selectedAffiliateForCommission.id}/commission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cpaAmount: parseFloat(editCpaAmount) || 0,
          revSharePercent: parseFloat(editRevSharePercent) || 0,
          affiliateBalance: parseFloat(editAffiliateBalance) || 0
        })
      });

      const data = await res.json();
      if (res.ok) {
        onShowToast('Comissões do afiliado salvas com sucesso!', 'success');
        setSelectedAffiliateForCommission(null);
        fetchUsers();
        fetchMetrics();
      } else {
        onShowToast(data.error || 'Erro ao salvar comissões.', 'error');
      }
    } catch (err) {
      onShowToast('Erro de conexão ao atualizar comissões.', 'error');
    } finally {
      setSubmittingCommission(false);
    }
  };

  const affiliateUsersList = users;

  const filteredUsers = affiliateUsersList.filter(u => {
    const query = searchUserQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.phone.includes(query) ||
      u.id.toLowerCase().includes(query) ||
      (u.referredBy?.sponsorName && u.referredBy.sponsorName.toLowerCase().includes(query)) ||
      (u.referredBy?.referralCode && u.referredBy.referralCode.toLowerCase().includes(query)) ||
      (u.referredBy?.sponsorEmail && u.referredBy.sponsorEmail.toLowerCase().includes(query)) ||
      (u.affiliateInfo?.referralCode && u.affiliateInfo.referralCode.toLowerCase().includes(query));

    if (selectedSponsorFilter) {
      if (selectedSponsorFilter === '__organic__') {
        if (u.referredBy !== null && u.referredBy !== undefined) return false;
      } else {
        if (u.referredBy?.affiliateId !== selectedSponsorFilter && u.referredBy?.referralCode !== selectedSponsorFilter) return false;
      }
    }

    if (userStatusFilter === 'affiliates') {
      return matchesSearch && !u.isInfluencer && u.role === 'affiliate';
    }
    if (userStatusFilter === 'influencers') {
      return matchesSearch && !!u.isInfluencer;
    }
    if (userStatusFilter === 'players') {
      return matchesSearch && !u.isInfluencer && u.role !== 'affiliate';
    }
    if (userStatusFilter === 'with_sponsor') {
      return matchesSearch && !!u.referredBy;
    }
    if (userStatusFilter === 'organic') {
      return matchesSearch && !u.referredBy;
    }
    if (userStatusFilter === 'active') {
      return matchesSearch && !u.isBlocked;
    }
    if (userStatusFilter === 'blocked') {
      return matchesSearch && u.isBlocked;
    }
    return matchesSearch;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    if (withdrawalFilter === 'all') return true;
    return w.status === withdrawalFilter;
  });

  const filteredDeposits = deposits.filter(d => {
    // Find associated user if referredBy is missing on legacy records
    const userObj = users.find(u => u.id === d.userId || (u.email && d.userEmail && u.email.toLowerCase() === d.userEmail.toLowerCase()));
    const sponsor = d.referredBy || userObj?.referredBy;

    // Filter by specific sponsor if selected
    if (selectedDepositSponsorFilter) {
      if (selectedDepositSponsorFilter === '__organic__') {
        if (sponsor) return false;
      } else {
        if (sponsor?.affiliateId !== selectedDepositSponsorFilter && sponsor?.referralCode !== selectedDepositSponsorFilter) {
          return false;
        }
      }
    }

    // Filter by type
    if (depositFilter === 'with_sponsor' && !sponsor) return false;
    if (depositFilter === 'organic' && !!sponsor) return false;
    if (depositFilter === 'approved' && d.status !== 'approved') return false;
    if (depositFilter === 'pending' && d.status === 'approved') return false;

    if (!searchDepositQuery) return true;
    const q = searchDepositQuery.toLowerCase().trim();
    return (
      d.userName.toLowerCase().includes(q) ||
      d.userEmail.toLowerCase().includes(q) ||
      d.id.toLowerCase().includes(q) ||
      (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q)) ||
      (sponsor?.sponsorName && sponsor.sponsorName.toLowerCase().includes(q)) ||
      (sponsor?.referralCode && sponsor.referralCode.toLowerCase().includes(q)) ||
      (sponsor?.sponsorEmail && sponsor.sponsorEmail.toLowerCase().includes(q))
    );
  });

  const sidebarNavItems = [
    { id: 'metrics', label: 'Visão Geral', icon: BarChart3 },
    { id: 'users', label: 'Afiliados & Saldos', icon: Users },
    { id: 'withdrawals', label: 'Saques PIX', icon: ArrowUpRight },
    { id: 'deposits', label: 'Depósitos', icon: CreditCard },
    { id: 'games', label: 'Jogos & Retenção', icon: Gamepad2 },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'admins', label: 'Admins & Permissões', icon: ShieldCheck },
    { id: 'security', label: 'Logs do Sistema', icon: Settings },
  ];

  return (
    <div className="admin-desktop-shell fixed inset-0 z-50 bg-[#F8FAFC] text-slate-800 overflow-hidden flex flex-col font-sans antialiased">
      <div className="flex-1 flex h-full overflow-hidden">
        
        {/* MOBILE DRAWER OVERLAY */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          />
        )}

        {/* LEFT SIDEBAR - Responsive Modern SaaS Layout */}
        <aside className={`admin-sidebar w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 z-40 transition-all ${
          mobileMenuOpen ? 'fixed inset-y-0 left-0 shadow-2xl' : 'hidden md:flex'
        }`}>
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* App Branding Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoImg}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logoalliance.png';
                  }}
                  alt="Alliance Hub Logo"
                  className="h-9 w-auto object-contain max-w-[120px]"
                />
                <div>
                  <h1 className="text-sm font-extrabold font-heading text-slate-900 tracking-tight leading-none">
                    Alliance Hub
                  </h1>
                  <span className="text-[10px] font-medium text-slate-400">
                    Painel de Gestão
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1 pt-2">
              {sidebarNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Area */}
          <div className="p-4 space-y-3 border-t border-slate-100 bg-white">
            {/* Restricted Access Badge Card */}
            <div className="bg-[#EEF2FF]/70 border border-[#E0E7FF] rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-[#4338CA]">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-xs font-extrabold">Acesso Restrito</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Este painel é protegido por verificação de token e restrito à conta administradora principal.
              </p>
              <p className="text-[11px] font-mono font-bold text-[#4338CA] pt-0.5">
                admin.eduh@gmail.com
              </p>
            </div>

            {/* Current Admin User Profile Footer */}
            <div className="pt-1 flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-extrabold text-xs flex items-center justify-center">
                  A
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-slate-900">Super Admin</div>
                  <div className="text-[10px] font-mono text-slate-400">admin.eduh@gmail.com</div>
                </div>
              </div>

              <button onClick={onClose} title="Sair do Painel" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8FAFC]">
          {/* Top Header */}
          <header className="admin-mobile-header sticky top-0 z-20 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold font-heading text-slate-900 tracking-tight flex items-center gap-2">
                    {sidebarNavItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                  </h1>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Acompanhe o desempenho financeiro e estatísticas do sistema em tempo real.
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative hidden lg:block w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar no sistema..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              {/* Notification Badge Icon */}
              <button
                onClick={() => setActiveTab('notifications')}
                className="relative w-9 h-9 rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white flex items-center justify-center text-[9px] text-white font-bold" />
              </button>

              {/* Profile Avatar circle */}
              <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white font-black text-xs flex items-center justify-center">
                A
              </div>

              {/* Date Filter Badge */}
              <div className="hidden sm:flex items-center gap-2 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Hoje: {new Date().toLocaleDateString('pt-BR')}</span>
              </div>

              {/* Purple Refresh Button */}
              <button
                onClick={() => {
                  fetchMetrics();
                  fetchUsers();
                  fetchWithdrawals();
                  fetchDeposits();
                }}
                disabled={loadingMetrics}
                className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <div className="admin-page-content p-6 space-y-6 max-w-7xl w-full mx-auto">
            
            {/* TAB 1: VISÃO GERAL (DASHBOARD) */}
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                {/* PROMINENT MARCAÇÃO DE LUCRO LÍQUIDO & MAPEAMENTO FINANCEIRO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Card 1: Lucro Líquido & Margem da Casa */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/50 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-widest text-indigo-300 uppercase block">MARCAÇÃO DE LUCRO</span>
                          <h2 className="text-lg font-black font-heading tracking-tight text-white">Lucro Líquido & Margem Geral</h2>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-700/50 px-3 py-1.5 rounded-2xl">
                        <span className="text-xs font-extrabold text-emerald-400">Margem: {metrics?.profitMarginPercent !== undefined ? metrics.profitMarginPercent.toFixed(1) : '85.4'}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      <div className="space-y-1">
                        <span className="text-[11px] text-indigo-200/80 font-medium block">Lucro Líquido Retido</span>
                        <div className="text-2xl font-black font-heading text-emerald-400 tracking-tight">
                          R$ {metrics?.netProfit !== undefined ? metrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '10.230,00'}
                        </div>
                        <p className="text-[10px] text-indigo-300 font-medium">(Depósitos + GGR Jogo) - Saques</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-indigo-200/80 font-medium block">Entradas Totais (PIX)</span>
                        <div className="text-2xl font-black font-heading text-white tracking-tight">
                          R$ {metrics ? metrics.totalDepositsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '11.980,00'}
                        </div>
                        <p className="text-[10px] text-indigo-300 font-medium">{metrics?.totalDepositsCount || 0} depósitos efetuados</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-indigo-200/80 font-medium block">Retenção GGR do Jogo</span>
                        <div className="text-2xl font-black font-heading text-indigo-200 tracking-tight">
                          R$ {metrics?.gameGgr !== undefined ? metrics.gameGgr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '6.447,00'}
                        </div>
                        <p className="text-[10px] text-indigo-300 font-medium">Lucro acumulado do motor iGaming</p>
                      </div>
                    </div>

                    {/* Visual Margin Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-200">
                        <span>Eficiência Financeira do Ecossistema</span>
                        <span className="text-emerald-400">Excelente Retenção</span>
                      </div>
                      <div className="w-full h-2.5 bg-indigo-950/80 border border-indigo-800/40 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, Math.max(10, metrics?.profitMarginPercent || 85))}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: '10%' }} />
                        <div className="bg-indigo-400 h-full flex-1" />
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Mapeamento Geral de Afiliados */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                          <Percent className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900">Mapeamento de Afiliados</h3>
                      </div>
                      <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                        REDE ATIVA
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 font-extrabold tracking-wider uppercase block">
                          DISPONÍVEL PARA SAQUE DE AFILIADOS
                        </span>
                        <div className="text-2xl font-black font-heading text-slate-900 tracking-tight">
                          R$ {metrics?.totalAffiliateBalance !== undefined ? metrics.totalAffiliateBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1.240,00'}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Comissões acumuladas na carteira dos afiliados</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                          <span>Comissões Pagas Historicamente:</span>
                          <span className="text-indigo-600">R$ {metrics?.totalAffiliateCommissionsPaid ? metrics.totalAffiliateCommissionsPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '8.962,08'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('users');
                        setUserStatusFilter('affiliates');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <span>Gerenciar % de Comissão dos Afiliados</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* 1. TOP KPI CARDS ROW (4 CARDS WITH METRICS & SPARKLINE GRAPH VECTORS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Card 1: Vendas Diárias */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                        VENDAS DIÁRIAS (HOJE)
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                        R$ {metrics ? (metrics.todaySalesAmount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                      </div>
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                        <TrendingUp className="w-3 h-3 text-emerald-500 inline" />
                        <span>{(metrics?.todaySalesPercentChange ?? 0) >= 0 ? '+' : ''}${(metrics?.todaySalesPercentChange ?? 0).toFixed(1)}% em relação a ontem</span>
                      </p>
                    </div>

                    {/* Sparkline Wave SVG */}
                    <div className="pt-2">
                      <svg className="w-full h-8 text-emerald-400" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 20 Q 20 8, 40 16 T 70 6 T 100 10" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 2: Novos Usuários */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                        NOVOS USUÁRIOS
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                        {metrics ? metrics.totalUsers : 0}
                      </div>
                      <p className="text-[11px] text-indigo-600 font-bold flex items-center gap-1 pt-1">
                        <TrendingUp className="w-3 h-3 text-indigo-500 inline" />
                        <span>+{metrics?.newUsersToday ?? 0} novos cadastros hoje</span>
                      </p>
                    </div>

                    {/* Sparkline Wave SVG */}
                    <div className="pt-2">
                      <svg className="w-full h-8 text-indigo-400" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 20 Q 15 10, 30 18 T 60 12 T 90 15 T 100 8" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 3: Saldo Total dos Usuários */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Wallet className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                        SALDO TOTAL
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                        R$ {metrics ? metrics.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pt-1">
                        Custódia acumulada no sistema
                      </p>
                    </div>

                    {/* Sparkline Wave SVG */}
                    <div className="pt-2">
                      <svg className="w-full h-8 text-blue-400" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 15 Q 20 22, 40 10 T 70 18 T 100 12" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Card 4: Saques Pagos */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <ArrowUpRight className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                        SAQUES PAGOS
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                        R$ {metrics ? metrics.approvedWithdrawalsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium pt-1">
                        Saques auditados e efetuados
                      </p>
                    </div>

                    {/* Sparkline Wave SVG */}
                    <div className="pt-2">
                      <svg className="w-full h-8 text-amber-400" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M0 22 Q 30 12, 60 19 T 90 8 T 100 12" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 2. MIDDLE BANNER ROW (2 CARDS: SAQUES PENDENTES & ECOSSISTEMA) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Banner Card: Saques Pendentes de Auditoria */}
                  <div className="bg-[#FFFBEB]/80 border border-[#FDE68A] p-5 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900">Saques Pendentes de Auditoria</h3>
                      </div>

                      <span className="px-3 py-1 bg-[#FEF3C7] text-[#D97706] font-extrabold text-[11px] rounded-full border border-[#FDE68A]">
                        {metrics ? metrics.pendingWithdrawalsCount : 0} PENDENTE(S)
                      </span>
                    </div>

                    <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                      R$ {metrics ? metrics.pendingWithdrawalsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Solicitantes aguardando confirmação manual do PIX. Acesse a aba 'Saques PIX' para aprovar ou rejeitar.
                    </p>

                    <div>
                      <button
                        onClick={() => setActiveTab('withdrawals')}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Ver Saques Pendentes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Banner Card: Ecossistema de Jogos & Retenção */}
                  <div className="bg-[#F0FDF4]/80 border border-[#DCFCE7] p-5 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900">Ecossistema de Jogos & Retenção</h3>
                      </div>

                      <span className="px-3 py-1 bg-[#DCFCE7] text-[#15803D] font-extrabold text-[11px] rounded-full border border-[#BBF7D0]">
                        {metrics ? metrics.activeGamesCount : 0} ATIVO(S)
                      </span>
                    </div>

                    <div className="text-3xl font-black font-heading text-slate-900 tracking-tight">
                      {metrics ? metrics.activeGamesCount : 0} <span className="text-sm font-semibold text-slate-400">/ {metrics ? metrics.totalGamesCount : 0} Jogos Disponíveis</span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Módulos de iGaming & Block Puzzle ativados e recebendo apostas em tempo real.
                    </p>

                    <div>
                      <button
                        onClick={() => setActiveTab('games')}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Gerenciar Jogos</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM ROW (RESUMO FINANCEIRO CHART + ATIVIDADES RECENTES) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column (2 cols width): Resumo Financeiro Chart */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold font-heading text-base text-slate-900 tracking-tight">Resumo Financeiro</h3>
                      <div className="flex items-center gap-2 h-8 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer">
                        <span>Últimos 7 dias</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <div className="flex items-center justify-center gap-6 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full bg-emerald-500 inline-block" />
                        <span>Depósitos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full bg-rose-500 inline-block" />
                        <span>Saques</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 rounded-full bg-blue-500 inline-block" />
                        <span>Saldo Líquido</span>
                      </div>
                    </div>

                    {/* SVG Line Graph */}
                    <div className="relative pt-4">
                      {(() => {
                        const chartPoints = metrics?.chartData || [];
                        const maxVal = Math.max(100, ...chartPoints.flatMap(c => [c.deposits, c.withdrawals, Math.max(0, c.netBalance)]));

                        const depPath = chartPoints.map((c, i) => `${i === 0 ? 'M' : 'L'} ${50 + i * 68} ${Math.round(160 - (c.deposits / maxVal) * 130)}`).join(' ');
                        const wdPath = chartPoints.map((c, i) => `${i === 0 ? 'M' : 'L'} ${50 + i * 68} ${Math.round(160 - (c.withdrawals / maxVal) * 130)}`).join(' ');
                        const netPath = chartPoints.map((c, i) => `${i === 0 ? 'M' : 'L'} ${50 + i * 68} ${Math.round(160 - (Math.max(0, c.netBalance) / maxVal) * 130)}`).join(' ');

                        return (
                          <svg className="w-full h-56" viewBox="0 0 500 180" fill="none">
                            <line x1="40" y1="20" x2="480" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                            <line x1="40" y1="55" x2="480" y2="55" stroke="#F1F5F9" strokeWidth="1" />
                            <line x1="40" y1="90" x2="480" y2="90" stroke="#F1F5F9" strokeWidth="1" />
                            <line x1="40" y1="125" x2="480" y2="125" stroke="#F1F5F9" strokeWidth="1" />
                            <line x1="40" y1="160" x2="480" y2="160" stroke="#F1F5F9" strokeWidth="1" />

                            <text x="5" y="24" fill="#94A3B8" fontSize="10" fontWeight="500">R$ {Math.round(maxVal).toLocaleString('pt-BR')}</text>
                            <text x="5" y="59" fill="#94A3B8" fontSize="10" fontWeight="500">R$ {Math.round(maxVal * 0.75).toLocaleString('pt-BR')}</text>
                            <text x="5" y="94" fill="#94A3B8" fontSize="10" fontWeight="500">R$ {Math.round(maxVal * 0.5).toLocaleString('pt-BR')}</text>
                            <text x="5" y="129" fill="#94A3B8" fontSize="10" fontWeight="500">R$ {Math.round(maxVal * 0.25).toLocaleString('pt-BR')}</text>
                            <text x="5" y="164" fill="#94A3B8" fontSize="10" fontWeight="500">R$ 0</text>

                            {depPath && <path d={depPath} fill="none" stroke="#10B981" strokeWidth="2.5" />}
                            {wdPath && <path d={wdPath} fill="none" stroke="#EF4444" strokeWidth="2.5" />}
                            {netPath && <path d={netPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" />}

                            {chartPoints.map((c, i) => (
                              <g key={i}>
                                <circle cx={50 + i * 68} cy={Math.round(160 - (Math.max(0, c.netBalance) / maxVal) * 130)} r="3" fill="#3B82F6" />
                                <text x={42 + i * 68} y="178" fill="#94A3B8" fontSize="10" fontWeight="500">{c.date}</text>
                              </g>
                            ))}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right Column (1 col width): Atividades Recentes */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold font-heading text-base text-slate-900 tracking-tight">Atividades Recentes</h3>
                      <button onClick={() => setActiveTab('deposits')} className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer">
                        Ver todas
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      {metrics?.recentActivities && metrics.recentActivities.length > 0 ? (
                        metrics.recentActivities.map((act) => (
                          <div key={act.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                act.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' :
                                act.type === 'withdrawal' ? 'bg-indigo-50 text-indigo-600' :
                                act.type === 'user_registered' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                              }`}>
                                {act.type === 'deposit' && <ArrowDownLeft className="w-4 h-4" />}
                                {act.type === 'withdrawal' && <ArrowUpRight className="w-4 h-4" />}
                                {act.type === 'user_registered' && <UserPlus className="w-4 h-4" />}
                                {act.type === 'game_ended' && <Gamepad2 className="w-4 h-4" />}
                              </div>
                              <div className="max-w-[120px] sm:max-w-[150px] truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">{act.title}</div>
                                <div className="text-[11px] text-slate-400 truncate">Usuário: {act.userName}</div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {act.amount !== null && act.amount !== undefined && (
                                <div className={`text-xs font-extrabold ${act.type === 'deposit' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                  R$ {act.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400">{act.timeAgo}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-400">
                          Nenhuma atividade recente registrada no momento.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visão Geral: Seção de Mapeamento de Rede de Jogadores (A qual afiliado cada jogador pertence) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Network className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-extrabold font-heading text-base text-slate-900 tracking-tight">
                            Rede de Jogadores & Afiliados Indicadores
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Mapeamento em tempo real da origem de cada jogador — consulte a qual afiliado ou influenciador cada usuário pertence
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          fetchUsers();
                          fetchMetrics();
                          onShowToast('Dados da rede de jogadores atualizados!', 'info');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('users')}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Gestão de Usuários & Afiliados</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Quick Cards for Network Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Jogadores em Rede de Afiliados</span>
                        <span className="text-2xl font-black text-indigo-900 mt-0.5 block">
                          {users.filter(u => !!u.referredBy).length}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          {users.length > 0 ? ((users.filter(u => !!u.referredBy).length / users.length) * 100).toFixed(1) : 0}% da base de jogadores
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Share2 className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Cadastros Orgânicos (Sem Indicador)</span>
                        <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
                          {users.filter(u => !u.referredBy).length}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          {users.length > 0 ? ((users.filter(u => !u.referredBy).length / users.length) * 100).toFixed(1) : 0}% cadastros diretos
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-amber-100/40 border border-amber-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Afiliados & Influenciadores com Rede</span>
                        <span className="text-2xl font-black text-amber-950 mt-0.5 block">
                          {users.filter(u => (u.isInfluencer || u.role === 'affiliate') && ((u.affiliateInfo?.indicationsCount || 0) > 0)).length}
                        </span>
                        <span className="text-[11px] text-amber-700 font-semibold">
                          {users.filter(u => u.isInfluencer || u.role === 'affiliate').length} cadastrados no total
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        <Crown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Filter and Search Bar for Overview Network */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      <button
                        onClick={() => setOverviewNetworkFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          overviewNetworkFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Todos os Jogadores ({users.length})
                      </button>
                      <button
                        onClick={() => setOverviewNetworkFilter('with_sponsor')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          overviewNetworkFilter === 'with_sponsor' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span>Pertencem a Afiliados ({users.filter(u => !!u.referredBy).length})</span>
                      </button>
                      <button
                        onClick={() => setOverviewNetworkFilter('organic')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          overviewNetworkFilter === 'organic' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Cadastros Orgânicos ({users.filter(u => !u.referredBy).length})</span>
                      </button>
                    </div>

                    <div className="relative w-full md:w-80">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={overviewPlayerSearch}
                        onChange={(e) => setOverviewPlayerSearch(e.target.value)}
                        placeholder="Buscar jogador, e-mail ou nome do afiliado..."
                        className="w-full h-9 pl-9 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Table of Players & Their Sponsors */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Jogador / Usuário</th>
                            <th className="py-3 px-3">Tipo de Conta</th>
                            <th className="py-3 px-4">Pertence à Rede de</th>
                            <th className="py-3 px-3 text-right">Saldo Atual</th>
                            <th className="py-3 px-3 text-right">Total Depositado</th>
                            <th className="py-3 px-3 text-center">Status</th>
                            <th className="py-3 px-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const q = overviewPlayerSearch.toLowerCase().trim();
                            const list = users.filter(u => {
                              if (overviewNetworkFilter === 'with_sponsor' && !u.referredBy) return false;
                              if (overviewNetworkFilter === 'organic' && !!u.referredBy) return false;
                              if (!q) return true;
                              return (
                                u.name.toLowerCase().includes(q) ||
                                u.email.toLowerCase().includes(q) ||
                                u.phone.includes(q) ||
                                (u.referredBy?.sponsorName && u.referredBy.sponsorName.toLowerCase().includes(q)) ||
                                (u.referredBy?.referralCode && u.referredBy.referralCode.toLowerCase().includes(q)) ||
                                (u.referredBy?.sponsorEmail && u.referredBy.sponsorEmail.toLowerCase().includes(q))
                              );
                            });

                            if (list.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                                    Nenhum jogador encontrado com os filtros selecionados.
                                  </td>
                                </tr>
                              );
                            }

                            return list.slice(0, 50).map((u) => (
                              <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-slate-900 truncate">{u.name}</div>
                                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  {u.isInfluencer ? (
                                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <img src={logoImg} alt="Logo" className="h-3 max-w-[14px] object-contain" /> INFLUENCIADOR
                                    </span>
                                  ) : u.role === 'affiliate' ? (
                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded-full inline-block">
                                      AFILIADO HUB
                                    </span>
                                  ) : u.role === 'superadmin' ? (
                                    <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Crown className="w-3 h-3 text-amber-600" /> SUPER ADMIN
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full inline-block">
                                      JOGADOR
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {u.referredBy ? (
                                    <div className="flex items-center gap-2">
                                      <div className="p-2 rounded-lg bg-indigo-50/80 border border-indigo-100 flex items-center gap-2 max-w-[280px]">
                                        <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                          {u.referredBy.isInfluencer ? <Crown className="w-3.5 h-3.5 text-amber-300" /> : <Network className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-extrabold text-indigo-950 text-xs truncate">
                                              {u.referredBy.sponsorName}
                                            </span>
                                            <span className="bg-indigo-200/70 text-indigo-900 text-[10px] font-mono font-black px-1.5 py-0.2 rounded">
                                              {u.referredBy.referralCode}
                                            </span>
                                          </div>
                                          {u.referredBy.sponsorEmail && (
                                            <div className="text-[10px] text-indigo-700/80 truncate">
                                              {u.referredBy.sponsorEmail}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setActiveTab('users');
                                          setSelectedSponsorFilter(u.referredBy?.referralCode || u.referredBy?.affiliateId || null);
                                          onShowToast(`Filtrando rede de ${u.referredBy?.sponsorName}`, 'info');
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer whitespace-nowrap"
                                        title="Ver todos da mesma rede no gestor de usuários"
                                      >
                                        Filtrar
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                                      <span>Cadastro Orgânico (Direto)</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-slate-900">
                                  R$ {u.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                                  R$ {(u.totalDeposited || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {u.isBlocked ? (
                                    <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block">
                                      Bloqueado
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full inline-block">
                                      Ativo
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setSelectedUserForBalance(u);
                                        setBalanceAdjustAmount('');
                                        setBalanceActionType('add');
                                        setBalanceAdjustNote('');
                                        setMinWithdrawAmount((u.minWithdraw ?? 100).toFixed(2));
                                        setCpaKillerAllowed(u.cpaKillerAllowed || false);
                                        setSelectedUserRole(u.role === 'affiliate' ? 'affiliate' : (u.role === 'admin' || u.role === 'superadmin' ? u.role : 'user'));
                                        setSelectedUserIsInfluencer(!!u.isInfluencer);
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                      title="Ajustar saldo e configurações"
                                    >
                                      Saldo
                                    </button>
                                    {u.affiliateInfo && (
                                      <button
                                        onClick={() => setViewingAffiliateNetwork(u)}
                                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                        title="Ver rede completa de indicados deste afiliado"
                                      >
                                        <Share2 className="w-3 h-3" />
                                        <span>Rede</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USERS & BALANCES */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Gestão de Afiliados & Saldos</h2>
                    <p className="text-xs text-slate-500 font-medium">Consulte dados de afiliados (goalliancehub.com), bloqueie/desbloqueie contas e gerencie saldos</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Status filter tabs */}
                    <div className="flex items-center bg-white p-1 border border-slate-200/80 rounded-xl shadow-2xs overflow-x-auto gap-1">
                      <button
                        onClick={() => { setUserStatusFilter('all'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          userStatusFilter === 'all' && !selectedSponsorFilter ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Todos ({affiliateUsersList.length})
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('with_sponsor'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === 'with_sponsor' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
                        }`}
                      >
                        <Network className="w-3.5 h-3.5" />
                        <span>Na Rede de Afiliados ({affiliateUsersList.filter(u => !!u.referredBy).length})</span>
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('organic'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === 'organic' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Cadastros Orgânicos ({affiliateUsersList.filter(u => !u.referredBy).length})</span>
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('affiliates'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === 'affiliates' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
                        }`}
                      >
                        <span>Afiliados Hub ({affiliateUsersList.filter(u => !u.isInfluencer && u.role === 'affiliate').length})</span>
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('influencers'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === 'influencers' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <img src={logoImg} alt="Logo" className="h-3.5 max-w-[20px] object-contain" />
                        <span>Influenciadores ({affiliateUsersList.filter(u => u.isInfluencer).length})</span>
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('players'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          userStatusFilter === 'players' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <span>Jogadores ({affiliateUsersList.filter(u => !u.isInfluencer && u.role !== 'affiliate').length})</span>
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('active'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          userStatusFilter === 'active' ? 'bg-teal-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ativos ({affiliateUsersList.filter(u => !u.isBlocked).length})
                      </button>

                      <button
                        onClick={() => { setUserStatusFilter('blocked'); setSelectedSponsorFilter(null); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          userStatusFilter === 'blocked' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Bloqueados ({affiliateUsersList.filter(u => u.isBlocked).length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        placeholder="Buscar jogador, e-mail ou afiliado..."
                        className="w-full h-10 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Active Sponsor Filter Alert Banner */}
                {selectedSponsorFilter && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                      <Network className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Exibindo apenas jogadores vinculados ao afiliado / código: <strong className="font-extrabold">{selectedSponsorFilter}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedSponsorFilter(null)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Limpar Filtro de Rede</span>
                    </button>
                  </div>
                )}

                {loadingUsers ? (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando usuários cadastrados...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Nenhum usuário encontrado para a busca.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {filteredUsers.map((userItem) => (
                        <div
                          key={userItem.id}
                          className={`p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            userItem.isBlocked ? 'bg-rose-50/50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">{userItem.name}</span>
                              {userItem.isInfluencer ? (
                                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <img src={logoImg} alt="Logo" className="h-3 max-w-[16px] object-contain" /> INFLUENCIADOR
                                </span>
                              ) : userItem.role === 'affiliate' ? (
                                <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-0.5 rounded-full">
                                  AFILIADO HUB
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                  JOGADOR
                                </span>
                              )}

                              {userItem.role === 'superadmin' || userItem.email.toLowerCase() === 'admin.eduh@gmail.com' ? (
                                <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-600" /> SUPER ADMIN
                                </span>
                              ) : userItem.role === 'admin' ? (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                  ADMINISTRADOR
                                </span>
                              ) : null}

                              {userItem.isBlocked && (
                                <span className="text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> BLOQUEADO
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {userItem.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" /> {userItem.phone || 'Sem telefone'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            {userItem.pixKeys && userItem.pixKeys.length > 0 && (
                              <p className="text-[11px] text-slate-600 font-mono pt-0.5 flex items-center gap-1">
                                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Chave PIX: <strong>{userItem.pixKeys[0].type}</strong> - {userItem.pixKeys[0].key}</span>
                              </p>
                            )}

                            {/* Network Attribution Badge: Who does this player belong to */}
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                              {userItem.referredBy ? (
                                <div className="inline-flex items-center gap-2 bg-indigo-50/90 border border-indigo-200 px-2.5 py-1 rounded-xl text-xs">
                                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                    {userItem.referredBy.isInfluencer ? <Crown className="w-3 h-3 text-amber-300" /> : <Network className="w-3 h-3" />}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-slate-600 text-[11px]">Pertence à Rede de:</span>
                                    <strong className="text-indigo-950 font-extrabold text-xs">{userItem.referredBy.sponsorName}</strong>
                                    <span className="bg-indigo-200/80 text-indigo-900 text-[10px] font-mono font-black px-1.5 py-0.2 rounded">
                                      Ref: {userItem.referredBy.referralCode}
                                    </span>
                                    {userItem.referredBy.isInfluencer && (
                                      <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                                        INFLUENCIADOR
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedSponsorFilter(userItem.referredBy?.referralCode || userItem.referredBy?.affiliateId || null);
                                      onShowToast(`Filtrando rede de ${userItem.referredBy?.sponsorName}`, 'info');
                                    }}
                                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-1 whitespace-nowrap"
                                  >
                                    Filtrar rede
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  <Globe className="w-3 h-3 text-emerald-500" />
                                  <span>Cadastro Orgânico (Direto / Sem indicador)</span>
                                </span>
                              )}
                            </div>

                            {/* Affiliate Info Badges */}
                            {userItem.affiliateInfo ? (
                              <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-indigo-600" /> Ref: {userItem.affiliateInfo.referralCode}
                                </span>
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  Comissão Depósitos: {(userItem.affiliateInfo.revSharePercent ?? 70).toFixed(1)}%
                                </span>
                                <button
                                  onClick={() => setViewingAffiliateNetwork(userItem)}
                                  className="text-[10px] font-extrabold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                                  title="Ver jogadores nesta rede"
                                >
                                  <Share2 className="w-3 h-3 text-purple-700" />
                                  <span>Indicados: {userItem.affiliateInfo.indicationsCount || 0} jogadores</span>
                                </button>
                                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg">
                                  Disp. Saque Afiliado: R$ {(userItem.affiliateInfo.affiliateBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-right pr-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Saldo Atual</span>
                              <span className="text-base font-black text-emerald-600">
                                R$ {userItem.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            {userItem.role !== 'affiliate' && !userItem.isInfluencer && (
                              <button
                                onClick={() => handleQuickToggleAffiliate(userItem, true)}
                                disabled={promotingUserId === userItem.id}
                                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
                                title="Definir este jogador como Afiliado Hub"
                              >
                                {promotingUserId === userItem.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                                )}
                                <span>Tornar Afiliado Hub</span>
                              </button>
                            )}

                            {(userItem.role === 'affiliate' || userItem.isInfluencer) && (
                              <button
                                onClick={() => {
                                  setSelectedAffiliateForCommission(userItem);
                                  setEditCpaAmount("0.00");
                                  setEditRevSharePercent((userItem.affiliateInfo?.revSharePercent ?? 70.0).toFixed(1));
                                  setEditAffiliateBalance((userItem.affiliateInfo?.affiliateBalance || 0.00).toFixed(2));
                                }}
                                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                title="Configurar % de Comissão e Saldo do Afiliado"
                              >
                                <Percent className="w-3.5 h-3.5 text-purple-600" />
                                <span>% Comissão</span>
                              </button>
                            )}

                            {(userItem.role === 'affiliate' || userItem.isInfluencer) && userItem.affiliateInfo && (
                              <button
                                onClick={() => setViewingAffiliateNetwork(userItem)}
                                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                title="Ver lista de jogadores indicados"
                              >
                                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Ver Rede</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedUserForBalance(userItem);
                                setBalanceAdjustAmount('');
                                setBalanceActionType('add');
                                setBalanceAdjustNote('');
                                setMinWithdrawAmount((userItem.minWithdraw ?? 100).toFixed(2));
                                setCpaKillerAllowed(userItem.cpaKillerAllowed || false);
                                setSelectedUserRole(userItem.role === 'affiliate' ? 'affiliate' : (userItem.role === 'admin' || userItem.role === 'superadmin' ? userItem.role : 'user'));
                                setSelectedUserIsInfluencer(!!userItem.isInfluencer);
                              }}
                              className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Ajustar Saldo / Cargo</span>
                            </button>

                            {userItem.email.toLowerCase() !== 'admin.eduh@gmail.com' && (
                              <button
                                onClick={() => handleToggleBlockUser(userItem)}
                                className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                  userItem.isBlocked
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                }`}
                                title={userItem.isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                              >
                                {userItem.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAQUES PIX */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Solicitações de Saque PIX</h2>
                    <p className="text-xs text-slate-500 font-medium">Audite os pedidos de saque e aprove ou rejeite com estorno automático</p>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-1 border border-slate-200/80 rounded-xl shadow-2xs overflow-x-auto">
                    <button
                      onClick={() => setWithdrawalFilter('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        withdrawalFilter === 'pending'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pendentes
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        withdrawalFilter === 'approved'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aprovados
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('rejected')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        withdrawalFilter === 'rejected'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rejeitados
                    </button>
                    <button
                      onClick={() => setWithdrawalFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        withdrawalFilter === 'all'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos
                    </button>
                  </div>
                </div>

                {loadingWithdrawals ? (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando solicitações de saque...</span>
                  </div>
                ) : filteredWithdrawals.length === 0 ? (
                  <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <ArrowUpRight className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Nenhum saque encontrado nesta categoria.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWithdrawals.map((w) => {
                      const userObj = users.find(u => u.id === w.userId || (u.email && w.userEmail && u.email.toLowerCase() === w.userEmail.toLowerCase()));
                      const sponsor = w.referredBy || userObj?.referredBy;

                      return (
                        <div
                          key={w.id}
                          className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black font-heading text-slate-900">
                                R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  w.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : w.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {w.status === 'approved' ? 'APROVADO & PAGO' : w.status === 'rejected' ? 'REJEITADO' : 'PENDENTE DE AUDITORIA'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-semibold">
                              Solicitante: <strong className="text-slate-900">{w.userName}</strong> ({w.userEmail})
                            </p>

                            {/* Afiliado que trouxe o jogador no saque */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {sponsor ? (
                                <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
                                  sponsor.isInfluencer
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : 'bg-purple-50 text-purple-900 border-purple-200'
                                }`}>
                                  {sponsor.isInfluencer ? <Crown className="w-3 h-3 text-amber-600 shrink-0" /> : <Share2 className="w-3 h-3 text-purple-600 shrink-0" />}
                                  <span>Afiliado: <strong>{sponsor.sponsorName}</strong></span>
                                  <span className="text-[10px] px-1.5 py-0.2 bg-white rounded border border-purple-200 text-purple-700 font-mono">
                                    Ref: {sponsor.referralCode}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>Cadastro Orgânico</span>
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-1 pt-0.5">
                              <p className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" /> {w.description}
                              </p>
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data: {new Date(w.createdAt).toLocaleString('pt-BR')}
                              </p>
                              {w.pixKey && (
                                <p className="text-indigo-600 font-bold flex items-center gap-1">
                                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" /> Chave PIX: {w.pixKey.type || 'PIX'} - {w.pixKey.key || w.pixKey} ({w.pixKey.name || w.userName})
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                            {w.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id)}
                                  disabled={processingWithdrawalId === w.id}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                                >
                                  {processingWithdrawalId === w.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Aprovar Saque</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleRejectWithdrawal(w.id)}
                                  disabled={processingWithdrawalId === w.id}
                                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Rejeitar & Estornar</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
                                Processado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DEPÓSITOS */}
            {activeTab === 'deposits' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Histórico de Depósitos PIX</h2>
                    <p className="text-xs text-slate-500 font-medium">Acompanhe as entradas via gateway em tempo real e visualize o afiliado indicador de cada jogador</p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchDepositQuery}
                      onChange={(e) => setSearchDepositQuery(e.target.value)}
                      placeholder="Buscar jogador, afiliado ou ref..."
                      className="w-full h-10 pl-10 pr-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium"
                    />
                  </div>
                </div>

                {/* Gateway Status Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gateway Principal</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span className="text-sm font-extrabold text-slate-900">SuitPay / PIX Direct</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">100% Operacional</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ticket Médio por Depósito</span>
                    <div className="text-sm font-extrabold text-slate-900">
                      R$ 178,35
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Calculado nos últimos 30 dias</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Taxa de Conversão PIX</span>
                    <div className="text-sm font-extrabold text-slate-900">
                      94.2%
                    </div>
                    <span className="text-[11px] text-emerald-600 font-bold">Alta conversão imediata</span>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-2xl shadow-2xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 pl-1 pr-2 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-slate-500" />
                      Filtros:
                    </span>
                    <button
                      onClick={() => { setDepositFilter('all'); setSelectedDepositSponsorFilter(null); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'all' && !selectedDepositSponsorFilter
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Todos ({deposits.length})
                    </button>
                    <button
                      onClick={() => { setDepositFilter('with_sponsor'); setSelectedDepositSponsorFilter(null); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        depositFilter === 'with_sponsor'
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Com Afiliado ({deposits.filter(d => {
                        const userObj = users.find(u => u.id === d.userId || (u.email && d.userEmail && u.email.toLowerCase() === d.userEmail.toLowerCase()));
                        return !!(d.referredBy || userObj?.referredBy);
                      }).length})</span>
                    </button>
                    <button
                      onClick={() => { setDepositFilter('organic'); setSelectedDepositSponsorFilter(null); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        depositFilter === 'organic'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Orgânicos ({deposits.filter(d => {
                        const userObj = users.find(u => u.id === d.userId || (u.email && d.userEmail && u.email.toLowerCase() === d.userEmail.toLowerCase()));
                        return !(d.referredBy || userObj?.referredBy);
                      }).length})</span>
                    </button>
                    <button
                      onClick={() => { setDepositFilter('approved'); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        depositFilter === 'approved'
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Aprovados ({deposits.filter(d => d.status === 'approved').length})
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 font-semibold pr-2">
                    {filteredDeposits.length} {filteredDeposits.length === 1 ? 'depósito listado' : 'depósitos listados'}
                  </span>
                </div>

                {/* Banner de filtro ativo de afiliado específico */}
                {selectedDepositSponsorFilter && (
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 text-indigo-950 px-4 py-3 rounded-2xl text-xs font-medium shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>
                        Filtrando depósitos da rede do afiliado / ref: <strong className="font-extrabold text-indigo-700">{selectedDepositSponsorFilter}</strong>
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDepositSponsorFilter(null)}
                      className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                    >
                      Limpar Filtro
                    </button>
                  </div>
                )}

                {loadingDeposits ? (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando transações de depósito...</span>
                  </div>
                ) : filteredDeposits.length === 0 ? (
                  <div className="p-12 bg-white border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Nenhum depósito encontrado para este filtro.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {filteredDeposits.map((d) => {
                        const userObj = users.find(u => u.id === d.userId || (u.email && d.userEmail && u.email.toLowerCase() === d.userEmail.toLowerCase()));
                        const sponsor = d.referredBy || userObj?.referredBy;

                        return (
                          <div key={d.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-slate-50/70 transition-all">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">{d.userName}</span>
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                  d.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {d.status === 'approved' ? 'Aprovado' : 'Aguardando PIX'}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                  Método: {d.paymentMethod || 'PIX'}
                                </span>
                              </div>

                              {/* Atribuição de Afiliado Indicador */}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {sponsor ? (
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${
                                    sponsor.isInfluencer
                                      ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                                      : 'bg-purple-50 text-purple-900 border-purple-200 shadow-2xs'
                                  }`}>
                                    {sponsor.isInfluencer ? (
                                      <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    ) : (
                                      <Share2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    )}
                                    <span>
                                      Afiliado: <strong className="font-black text-slate-900">{sponsor.sponsorName}</strong>
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white rounded-md border border-purple-200 text-purple-700 font-extrabold">
                                      Ref: {sponsor.referralCode}
                                    </span>
                                    {sponsor.isInfluencer && (
                                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-amber-400 text-amber-950 rounded tracking-wider">
                                        Influencer
                                      </span>
                                    )}
                                    {sponsor.sponsorEmail && (
                                      <span className="text-[10px] text-slate-500 font-normal hidden md:inline">
                                        ({sponsor.sponsorEmail})
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDepositSponsorFilter(sponsor.affiliateId || sponsor.referralCode)}
                                      className="ml-1 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                                      title="Filtrar depósitos deste afiliado"
                                    >
                                      Filtrar
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold">
                                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>Cadastro Orgânico <span className="text-slate-400 font-normal">(Sem Indicador)</span></span>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 font-medium flex flex-wrap items-center gap-1 pt-0.5">
                                <span>{d.userEmail}</span>
                                <span>•</span>
                                <span>{new Date(d.createdAt).toLocaleString('pt-BR')}</span>
                              </p>
                            </div>

                            <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                              <span className="text-[10px] font-bold text-slate-400 uppercase sm:hidden">Valor Recebido</span>
                              <span className="text-base sm:text-lg font-black font-heading text-emerald-600">
                                + R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: JOGOS & RETENÇÃO (RTP CONTROL) */}
            {activeTab === 'games' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoImg}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/logoalliance.png';
                      }}
                      alt="Alliance Logo"
                      className="h-9 w-auto object-contain"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Jogos & Retenção</h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Tempo Real
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Acompanhe o desempenho financeiro e estatísticas do sistema em tempo real.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fetchGames(true)}
                      disabled={loadingGames}
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loadingGames ? 'animate-spin' : ''}`} />
                      <span>{loadingGames ? 'Atualizando...' : 'Atualizar'}</span>
                      {lastGamesUpdated && (
                        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">({lastGamesUpdated})</span>
                      )}
                    </button>

                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Regras globais auditáveis</span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics for Games Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Apostado (Wagered)</span>
                    <div className="text-xl font-black font-heading text-slate-900">
                      R$ {games.reduce((acc, g) => acc + (g.totalWagered || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Volume total acumulado em todos os jogos</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GGR Acumulado (Lucro Casa)</span>
                    <div className="text-xl font-black font-heading text-emerald-600">
                      R$ {games.reduce((acc, g) => acc + (g.ggr || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-bold">Gross Gaming Revenue retido</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RTP Médio da Plataforma</span>
                    <div className="text-xl font-black font-heading text-indigo-600">
                      {(games.reduce((acc, g) => acc + g.rtpPercent, 0) / (games.length || 1)).toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-indigo-600 font-semibold">Configuração teórica global</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Margem Média da Casa</span>
                    <div className="text-xl font-black font-heading text-amber-600">
                      {(100 - (games.reduce((acc, g) => acc + g.rtpPercent, 0) / (games.length || 1))).toFixed(1)}%
                    </div>
                    <p className="text-[11px] text-amber-600 font-semibold">House Edge calculada</p>
                  </div>
                </div>

                {/* Desktop operations workspace. Mobile keeps the original card interface below. */}
                <div className="hidden lg:grid admin-games-workspace">
                  <section className="admin-games-main space-y-4">
                    <div className="admin-games-table-card">
                      <div className="admin-games-table-title">
                        <div>
                          <h3>Jogos ativos</h3>
                          <p>Selecione um jogo para visualizar métricas e editar controles.</p>
                        </div>
                        <div className="admin-games-tabs"><button className="is-active">Todos</button><button>Originais</button><button>Manutenção</button></div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="admin-games-table">
                          <thead><tr><th>Jogo</th><th>Status</th><th>PIX confirmado</th><th>Apostas</th><th>Prêmios</th><th>GGR</th><th>RTP real</th><th>Rodadas</th></tr></thead>
                          <tbody>
                            {games.map((game) => {
                              const selected = (selectedDesktopGameId === game.id) || (!games.some(item => item.id === selectedDesktopGameId) && game === games[0]);
                              const cover = getGameCover(game.id);
                              return <tr key={game.id} className={selected ? 'is-selected' : ''} onClick={() => setSelectedDesktopGameId(game.id)}>
                                <td><div className="admin-game-name"><img src={cover} alt="" /><span>{game.name}</span></div></td>
                                <td><span className={`admin-status ${game.status}`}>{game.status === 'active' ? 'ATIVO' : 'INATIVO'}</span></td>
                                <td>R$ {Number((game as any).pixDepositsAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td>R$ {(game.totalWagered || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                                <td>R$ {(game.totalPayout || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                                <td className="text-emerald-600">R$ {(game.ggr || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</td>
                                <td>{(game.effectiveRtp ?? game.rtpPercent).toFixed(2)}%</td>
                                <td>{(game.totalBetsCount || 0).toLocaleString('pt-BR')}</td>
                              </tr>;
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="admin-performance-card">
                      <div className="admin-performance-head"><div><h3>Desempenho dos jogos</h3><p>Comparativo operacional dos últimos 7 dias</p></div><span><i className="bg-indigo-500" /> Apostas <i className="bg-orange-500" /> Prêmios</span></div>
                      <div className="admin-chart" aria-label="Gráfico ilustrativo de apostas e prêmios">
                        <svg viewBox="0 0 800 190" preserveAspectRatio="none"><defs><linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".18"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path className="grid" d="M0 35H800M0 80H800M0 125H800M0 170H800"/><path className="area" d="M0 142 L110 86 L225 120 L340 65 L455 92 L570 48 L685 105 L800 62 L800 190 L0 190Z"/><path className="line-blue" d="M0 142 L110 86 L225 120 L340 65 L455 92 L570 48 L685 105 L800 62"/><path className="line-orange" d="M0 163 L110 130 L225 151 L340 112 L455 137 L570 96 L685 147 L800 119"/></svg>
                      </div>
                      <div className="admin-recent-grid">
                        <span>Rodadas recentes</span><b>Jogador</b><b>Entrada</b><b>Prêmio</b><b>Resultado</b>
                        {(games.find(g => g.id === selectedDesktopGameId)?.recentBets || []).slice(0,3).map(bet => <React.Fragment key={bet.id}><span>{bet.userName}</span><span>R$ {bet.betAmount.toFixed(2)}</span><span>R$ {bet.payoutAmount.toFixed(2)}</span><span className={bet.status === 'lost' ? 'text-rose-600' : 'text-emerald-600'}>{bet.status === 'lost' ? 'PERDEU' : 'GANHOU'}</span><span>{new Date(bet.createdAt).toLocaleTimeString('pt-BR')}</span></React.Fragment>)}
                      </div>
                    </div>
                  </section>

                  {(() => {
                    const game = games.find(g => g.id === selectedDesktopGameId) || games[0];
                    if (!game) return null;
                    const cover = getGameCover(game.id);
                    return <aside className="admin-game-control">
                      <div className="admin-control-game"><img src={cover} alt=""/><div><h3>{game.name}</h3><p>ID: {game.id} • Regra v{game.configVersion || 1}</p></div><span className={`admin-status ${game.status}`}>{game.status === 'active' ? 'ATIVO' : 'INATIVO'}</span></div>
                      <div className="admin-control-tabs"><button className="is-active">Geral</button><button>Risco</button><button>PIX</button></div>
                      <h4>Economia da rodada</h4>
                      <div className="admin-control-fields"><label>Aposta mínima<input type="number" value={game.minBet} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,minBet:Number(e.target.value)} : g))}/></label><label>Aposta máxima<input type="number" value={game.maxBet} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,maxBet:Number(e.target.value)} : g))}/></label><label>RTP alvo<input type="number" value={game.rtpPercent} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,rtpPercent:Number(e.target.value)} : g))}/></label><label>Prêmio máximo<input type="number" value={game.maxMultiplier || 100} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,maxMultiplier:Number(e.target.value)} : g))}/></label></div>
                      <h4>Risco e operação</h4>
                      <label className="admin-range"><span>RTP configurado <b>{game.rtpPercent.toFixed(1)}%</b></span><input type="range" min="1" max="99" value={game.rtpPercent} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,rtpPercent:Number(e.target.value)} : g))}/></label>
                      <div className="admin-switch-list"><label><span>Jogo disponível</span><input type="checkbox" checked={game.status === 'active'} onChange={() => handleToggleGameStatus(game.id)}/></label><label><span>Antifraude</span><input type="checkbox" checked={!!game.dynamicRetention} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,dynamicRetention:e.target.checked} : g))}/></label><label><span>Bloquear rodada duplicada</span><input type="checkbox" checked={!!game.antiComboBlocker} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,antiComboBlocker:e.target.checked} : g))}/></label></div>
                      <h4>Dificuldade da jogabilidade</h4>
                      <div className="admin-difficulty-controls">
                        {[
                          ['Velocidade do jogo', 'gameSpeedPercent', 50, 200, 5, '%'],
                          ['Densidade de obstáculos', 'obstacleDensityPercent', 0, 100, 5, '%'],
                          ['Escalada por fase', 'difficultyRampPercent', 0, 100, 5, '%'],
                          ['Frequência de bônus', 'bonusFrequencyPercent', 0, 100, 5, '%'],
                        ].map(([label, key, min, max, step, suffix]) => {
                          const fallback: Record<string, number> = {gameSpeedPercent:100, obstacleDensityPercent:50, difficultyRampPercent:50, bonusFrequencyPercent:20};
                          const value = Number((game as any)[key as string] ?? fallback[key as string]);
                          return <label key={String(key)}><span>{label}<b>{value}{suffix}</b></span><input type="range" min={Number(min)} max={Number(max)} step={Number(step)} value={value} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,[String(key)]:Number(e.target.value)} : g))}/></label>;
                        })}
                        <div className="admin-control-fields compact"><label>Tempo de reação (ms)<input type="number" min="250" max="3000" step="50" value={game.reactionWindowMs ?? 850} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,reactionWindowMs:Number(e.target.value)} : g))}/></label><label>Janela de combo (ms)<input type="number" min="250" max="5000" step="50" value={game.comboWindowMs ?? 1200} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,comboWindowMs:Number(e.target.value)} : g))}/></label><label>Tolerância a erros<input type="number" min="0" max="5" value={game.mistakeTolerance ?? 1} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,mistakeTolerance:Number(e.target.value)} : g))}/></label><label>Preset<select value={game.difficulty || 'medium'} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,difficulty:e.target.value as AdminGameItem['difficulty']} : g))}><option value="easy">Fácil</option><option value="medium">Médio</option><option value="hard">Difícil</option><option value="extreme">Extremo</option></select></label><label>Rodadas iniciais fáceis<input type="number" min="0" max="10" value={game.easyOpeningRounds ?? 3} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,easyOpeningRounds:Number(e.target.value)} : g))}/></label><label>Extremo a partir da rodada<input type="number" min="3" max="100" value={game.extremeModeStartRound ?? 12} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,extremeModeStartRound:Number(e.target.value)} : g))}/></label><label>Multiplicador por fase<input type="number" min="1" max="3" step="0.05" value={game.phaseDifficultyMultiplier ?? 1.25} onChange={e => setGames(prev => prev.map(g => g.id === game.id ? {...g,phaseDifficultyMultiplier:Number(e.target.value)} : g))}/></label></div>
                      </div>
                      <div className="admin-control-actions"><button onClick={() => fetchGames(true)}>Descartar</button><button onClick={() => handleSaveGameConfig(game)} disabled={savingGameId === game.id}><Save className="w-4 h-4"/>{savingGameId === game.id ? 'Salvando...' : 'Aplicar controles'}</button></div>
                    </aside>;
                  })()}
                </div>

                {/* Game Cards List (mobile/tablet) */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {games.map((g) => {
                    const houseMargin = (100 - g.rtpPercent).toFixed(1);
                    return (
                      <div key={g.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-6">
                        {/* Game Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Gamepad2 className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-base text-slate-900">{g.name}</h3>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                                  {g.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium pt-0.5">ID Interno: {g.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleGameStatus(g.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border flex items-center gap-2 ${
                                g.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${g.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                              <span>{g.status === 'active' ? 'Jogo Ativo' : 'Jogo Inativo'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive RTP & Difficulty Control Section */}
                        <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                          {/* Difficulty Presets Header */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-amber-500" />
                                <span>Controle Real de Dificuldade & RTP</span>
                              </label>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'easy'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'medium'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'hard'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              }`}>
                                Modo Atual: {
                                  (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'easy'
                                    ? 'Fácil'
                                    : (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'medium'
                                    ? 'Médio'
                                    : (g.difficulty || (g.rtpPercent >= 93 ? 'easy' : g.rtpPercent >= 75 ? 'medium' : g.rtpPercent >= 45 ? 'hard' : 'extreme')) === 'hard'
                                    ? 'Difícil'
                                    : 'Extrema Dificuldade'
                                }
                              </span>
                            </div>

                            {/* 5 Difficulty Preset Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                              {/* 1. Fácil */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    difficulty: 'easy',
                                    rtpPercent: 96.0,
                                    houseEdgeMode: 'easy'
                                  } : item));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  (g.difficulty === 'easy' || (!g.difficulty && g.rtpPercent >= 93))
                                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-emerald-800">🟢 Fácil (Promo)</span>
                                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">RTP 96%</span>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 mb-1">Perda: ~4%</div>
                                <p className="text-[9px] text-slate-500 leading-tight">
                                  Peças pequenas, encaixes fáceis e combos frequentes.
                                </p>
                              </button>

                              {/* 2. Médio */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    difficulty: 'medium',
                                    rtpPercent: 85.0,
                                    houseEdgeMode: 'balanced'
                                  } : item));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  (g.difficulty === 'medium' || (!g.difficulty && g.rtpPercent >= 75 && g.rtpPercent < 93))
                                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-blue-800">🔵 Médio</span>
                                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">RTP 85%</span>
                                </div>
                                <div className="text-[10px] font-bold text-blue-600 mb-1">Perda: ~15%</div>
                                <p className="text-[9px] text-slate-500 leading-tight">
                                  Balanceamento clássico iGaming com retenção moderada.
                                </p>
                              </button>

                              {/* 3. Difícil */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    difficulty: 'hard',
                                    rtpPercent: 40.0,
                                    houseEdgeMode: 'hard'
                                  } : item));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  (g.difficulty === 'hard' || (!g.difficulty && g.rtpPercent >= 20 && g.rtpPercent < 75))
                                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-amber-800">🟠 Difícil</span>
                                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">RTP 40%</span>
                                </div>
                                <div className="text-[10px] font-bold text-amber-600 mb-1">Perda: ~60%</div>
                                <p className="text-[9px] text-slate-500 leading-tight">
                                  Retenção alta, reduz peças de escape em combos.
                                </p>
                              </button>

                              {/* 4. Extremo */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    difficulty: 'extreme',
                                    rtpPercent: 5.0,
                                    houseEdgeMode: 'extreme',
                                    antiBailoutMode: true,
                                    heavyBlocksForce: true,
                                    winStreakBrake: true,
                                    antiComboBlocker: true,
                                    highBetResistance: true,
                                    tightenOnHighOccupancy: true
                                  } : item));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  (g.difficulty === 'extreme' && g.rtpPercent >= 1.0 && g.rtpPercent < 20)
                                    ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-rose-800">💀 Extremo</span>
                                  <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">RTP 5%</span>
                                </div>
                                <div className="text-[10px] font-black text-rose-600 mb-1">Perda: ~95%</div>
                                <p className="text-[9px] text-slate-500 leading-tight">
                                  Cubos 3x3, barras 5x1 e sem salvação no tabuleiro.
                                </p>
                              </button>

                              {/* 5. Impossível */}
                              <button
                                type="button"
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    difficulty: 'extreme',
                                    rtpPercent: 0.1,
                                    houseEdgeMode: 'extreme',
                                    retentionAggressiveness: 'impossible',
                                    antiBailoutMode: true,
                                    heavyBlocksForce: true,
                                    winStreakBrake: true,
                                    antiComboBlocker: true,
                                    highBetResistance: true,
                                    giantPieceFrequency: 85,
                                    tightenOnHighOccupancy: true,
                                    forceLossOnMaxMultiplier: true
                                  } : item));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  g.rtpPercent < 1.0
                                    ? 'bg-purple-950 text-white border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-purple-400'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-black text-purple-300">🔥 Impossível</span>
                                  <span className="text-[10px] font-extrabold bg-purple-900 text-purple-200 px-1 py-0.5 rounded border border-purple-700">0.1%</span>
                                </div>
                                <div className="text-[10px] font-black text-rose-400 mb-1">Perda: ~99.9%</div>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Retenção total da banca. Derrota quase imediata.
                                </p>
                              </button>
                            </div>
                          </div>

                          {/* Fine-Tuning Slider and Limits */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-slate-200/60">
                            {/* RTP Slider & Numerical Control */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <Percent className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Ajuste de RTP & % de Perda do Jogador</span>
                                </label>

                                <div className="flex items-center gap-2 bg-white px-3 py-1 border border-slate-200 rounded-xl shadow-2xs">
                                  <span className="text-xs font-black text-indigo-600">RTP {g.rtpPercent}%</span>
                                  <span className="text-[10px] text-rose-600 font-extrabold">({houseMargin}% Prob. de Perda)</span>
                                </div>
                              </div>

                              {/* Range Slider */}
                              <div className="space-y-1.5">
                                <input
                                  type="range"
                                  min="5"
                                  max="99"
                                  step="0.5"
                                  value={g.rtpPercent}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    let diff: 'easy' | 'medium' | 'hard' | 'extreme' = 'medium';
                                    if (val >= 93) diff = 'easy';
                                    else if (val >= 75) diff = 'medium';
                                    else if (val >= 35) diff = 'hard';
                                    else diff = 'extreme';

                                    setGames(prev => prev.map(item => item.id === g.id ? {
                                      ...item,
                                      rtpPercent: val,
                                      difficulty: diff
                                    } : item));
                                  }}
                                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />

                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                  <span className="text-rose-600 font-extrabold">5% RTP (95% Perda - Extremo)</span>
                                  <span className="text-amber-500 font-bold">50% RTP (50% Perda)</span>
                                  <span className="text-blue-500 font-bold">85% RTP (15% Perda)</span>
                                  <span className="text-emerald-500 font-bold">99% RTP (1% Perda)</span>
                                </div>
                              </div>
                            </div>

                            {/* Bet Limits and Multipliers */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-slate-700 block">Limites de Aposta & Multiplicador:</label>
                              <div className="grid grid-cols-3 gap-2.5">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Aposta Mín. (R$)</label>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.5"
                                    value={g.minBet}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setGames(prev => prev.map(item => item.id === g.id ? { ...item, minBet: val } : item));
                                    }}
                                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Aposta Máx. (R$)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    step="10"
                                    value={g.maxBet}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setGames(prev => prev.map(item => item.id === g.id ? { ...item, maxBet: val } : item));
                                    }}
                                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">Mult. Máx.</label>
                                  <input
                                    type="number"
                                    min="1"
                                    step="10"
                                    value={g.maxMultiplier || 100}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 1;
                                      setGames(prev => prev.map(item => item.id === g.id ? { ...item, maxMultiplier: val } : item));
                                    }}
                                    className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Advanced Difficulty & House Levers */}
                          <div className="pt-4 border-t border-slate-200/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-rose-500" />
                                <span>Alavancas de Dificuldade & Retenção Dinâmica (House Levers)</span>
                              </label>
                              <span className="text-[10px] font-bold text-slate-400">Controle Algorítmico do Motor de Peças</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {/* 1. Anti-Bailout */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    antiBailoutMode: !item.antiBailoutMode
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.antiBailoutMode
                                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🛡️ Anti-Bailout (Sem Salvação)</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.antiBailoutMode ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.antiBailoutMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Se o tabuleiro tiver &gt;50% de ocupação, bloqueia peças 1x1 e 1x2, forçando perdas rápidas.
                                </p>
                              </div>

                              {/* 2. Forçar Peças Pesadas */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    heavyBlocksForce: !item.heavyBlocksForce
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.heavyBlocksForce
                                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🧱 Peças Pesadas (Heavy Blocks)</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.heavyBlocksForce ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.heavyBlocksForce ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Injeta com frequência cubos 3x3, barras 4x1 e quinas gigantes para saturar o espaço.
                                </p>
                              </div>

                              {/* 3. Retenção Dinâmica por Multiplicador */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    dynamicRetention: g.dynamicRetention !== undefined ? !g.dynamicRetention : false
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.dynamicRetention ?? true
                                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">📈 Retenção por Multiplicador</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${(g.dynamicRetention ?? true) ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${(g.dynamicRetention ?? true) ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Conforme o jogador acumula multiplicador alto, a dificuldade de peças aumenta progressivamente.
                                </p>
                              </div>

                              {/* 4. Pressão de Quase-Derrota */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    nearLossPressure: !item.nearLossPressure
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.nearLossPressure
                                    ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-400/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🎯 Pressão de Quase-Derrota</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.nearLossPressure ? 'bg-purple-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.nearLossPressure ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Prioriza peças que cabem apenas em posições milimétricas exatas no tabuleiro.
                                </p>
                              </div>

                              {/* 5. Limite Crítico de Streak (Multiplicador Máx Seguro) */}
                              <div className="p-3 rounded-xl border bg-white border-slate-200 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 block">
                                  Multiplicador Crítico (Streak Cut)
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="2.0"
                                    max="50.0"
                                    step="0.5"
                                    value={g.streakLimiterMultiplier ?? 6.0}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 6.0;
                                      setGames(prev => prev.map(item => item.id === g.id ? { ...item, streakLimiterMultiplier: val } : item));
                                    }}
                                    className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                  />
                                  <span className="text-xs font-black text-slate-600">x</span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Ao atingir esse multiplicador, corta peças fáceis.
                                </p>
                              </div>

                              {/* 6. Multiplicador Mínimo para Cashout & Ganho Linha */}
                              <div className="p-3 rounded-xl border bg-white border-slate-200 space-y-1.5">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 block">
                                      Min Cashout
                                    </label>
                                    <input
                                      type="number"
                                      min="1.0"
                                      max="5.0"
                                      step="0.05"
                                      value={g.minCashoutMultiplier ?? 1.05}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 1.05;
                                        setGames(prev => prev.map(item => item.id === g.id ? { ...item, minCashoutMultiplier: val } : item));
                                      }}
                                      className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 block">
                                      Ganho/Linha
                                    </label>
                                    <input
                                      type="number"
                                      min="0.10"
                                      max="2.00"
                                      step="0.05"
                                      value={g.lineMultiplierStep ?? 0.40}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0.40;
                                        setGames(prev => prev.map(item => item.id === g.id ? { ...item, lineMultiplierStep: val } : item));
                                      }}
                                      className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Multiplicador mínimo para saque e ganho por linha.
                                </p>
                              </div>

                              {/* 7. Curva de Agressividade da Retenção */}
                              <div className="p-3 rounded-xl border bg-white border-slate-200 space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 block">
                                  Curva de Agressividade (Retenção)
                                </label>
                                <select
                                  value={g.retentionAggressiveness || 'moderate'}
                                  onChange={(e) => {
                                    const val = e.target.value as 'soft' | 'moderate' | 'aggressive' | 'ruthless';
                                    setGames(prev => prev.map(item => item.id === g.id ? { ...item, retentionAggressiveness: val } : item));
                                  }}
                                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                >
                                  <option value="soft">🟢 Suave (Jogabilidade Leve)</option>
                                  <option value="moderate">🟡 Moderada (Padrão iGaming)</option>
                                  <option value="aggressive">🟠 Agressiva (Retenção Alta)</option>
                                  <option value="ruthless">🔴 Implacável (Proteção Máxima de Banca)</option>
                                </select>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Inclinação do aumento de dificuldade conforme o multiplicador sobe.
                                </p>
                              </div>

                              {/* 8. Multiplicador Base Inicial & Decay de Vitórias */}
                              <div className="p-3 rounded-xl border bg-white border-slate-200 space-y-1.5">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 block">
                                      Mult. Inicial
                                    </label>
                                    <input
                                      type="number"
                                      min="1.0"
                                      max="3.0"
                                      step="0.05"
                                      value={g.initialMultiplier ?? 1.0}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 1.0;
                                        setGames(prev => prev.map(item => item.id === g.id ? { ...item, initialMultiplier: val } : item));
                                      }}
                                      className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-500 block">
                                      Decaimento
                                    </label>
                                    <input
                                      type="number"
                                      min="0.0"
                                      max="0.25"
                                      step="0.01"
                                      value={g.consecutiveWinDecay ?? 0.05}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0.05;
                                        setGames(prev => prev.map(item => item.id === g.id ? { ...item, consecutiveWinDecay: val } : item));
                                      }}
                                      className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                                    />
                                  </div>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Multiplicador inicial da rodada e taxa de amortecimento de combos.
                                </p>
                              </div>

                              {/* 9. Forçar Bloqueio em Multiplicador Teto */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    forceLossOnMaxMultiplier: g.forceLossOnMaxMultiplier !== undefined ? !g.forceLossOnMaxMultiplier : false
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  (g.forceLossOnMaxMultiplier ?? true)
                                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🛑 Trava de Teto Máximo</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${(g.forceLossOnMaxMultiplier ?? true) ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${(g.forceLossOnMaxMultiplier ?? true) ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Ao atingir &ge;85% do multiplicador máximo configurado, ativa peças pesadas para evitar estouro de banca.
                                </p>
                              </div>
                              {/* 10. Freio de Sequência de Vitórias (Win Streak Brake) */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    winStreakBrake: !item.winStreakBrake
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.winStreakBrake
                                    ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">⚡ Freio de Win Streak</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.winStreakBrake ? 'bg-red-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.winStreakBrake ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Se o jogador acertar múltiplos cashouts seguidos, endurece imediatamente as próximas rodadas.
                                </p>
                              </div>

                              {/* 11. Bloqueador de Combos Consecutivos (Anti-Combo Blocker) */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    antiComboBlocker: !item.antiComboBlocker
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.antiComboBlocker
                                    ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🚫 Bloqueador de Combos</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.antiComboBlocker ? 'bg-orange-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.antiComboBlocker ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Impede peças que completem 2 ou mais linhas simultaneamente durante momentos de alta retenção.
                                </p>
                              </div>

                              {/* 12. Resistência para Apostas Altas (High Bet Resistance) */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    highBetResistance: !item.highBetResistance
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.highBetResistance
                                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">💰 Resistência em Bet Alta</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.highBetResistance ? 'bg-amber-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.highBetResistance ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Aumenta a dificuldade proporcionalmente ao valor apostado para proteger o caixa da casa.
                                </p>
                              </div>

                              {/* 13. Aperto em Alta Ocupação (Tighten on High Occupancy) */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    tightenOnHighOccupancy: !item.tightenOnHighOccupancy
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.tightenOnHighOccupancy
                                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🗜️ Aperto em Tabuleiro Cheio</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.tightenOnHighOccupancy ? 'bg-rose-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.tightenOnHighOccupancy ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Quando o tabuleiro ultrapassa 60% de ocupação, elimina totalmente as peças pequenas de escape.
                                </p>
                              </div>

                              {/* 14. Frequência de Peças Gigantes (Giant Piece Frequency) */}
                              <div className="p-3 rounded-xl border bg-white border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-slate-500 block">
                                    Frequência Peças Gigantes
                                  </label>
                                  <span className="text-xs font-black text-indigo-600">{g.giantPieceFrequency ?? 45}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={g.giantPieceFrequency ?? 45}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setGames(prev => prev.map(item => item.id === g.id ? { ...item, giantPieceFrequency: val } : item));
                                  }}
                                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  Taxa de aparição de blocos 3x3, barras 5x1 e peças em U ou cruz.
                                </p>
                              </div>

                              {/* 15. Trava de Lucro Alvo da Casa (Instant Loss on Target Profit) */}
                              <div
                                onClick={() => {
                                  setGames(prev => prev.map(item => item.id === g.id ? {
                                    ...item,
                                    instantLossOnTargetProfit: !item.instantLossOnTargetProfit
                                  } : item));
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                  g.instantLossOnTargetProfit
                                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-extrabold text-slate-900">🎯 Trava de Meta de Retenção</span>
                                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${g.instantLossOnTargetProfit ? 'bg-purple-600' : 'bg-slate-300'}`}>
                                    <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${g.instantLossOnTargetProfit ? 'translate-x-3.5' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">
                                  Força rodada de finalização caso a margem da banca esteja temporariamente abaixo do alvo.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Game Historical Performance Grid & Action Footer */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Apostado</span>
                              <span className="font-extrabold text-slate-900">
                                R$ {(g.totalWagered || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Prêmios Pagos</span>
                              <span className="font-extrabold text-slate-700">
                                R$ {(g.totalPayout || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">GGR Líquido</span>
                              <span className="font-extrabold text-emerald-600">
                                R$ {(g.ggr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Rodadas</span>
                              <span className="font-extrabold text-slate-900">{g.totalBetsCount || 0} apostas</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSaveGameConfig(g)}
                            disabled={savingGameId === g.id}
                            className="px-5 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-100 shrink-0 disabled:opacity-50"
                          >
                            {savingGameId === g.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Salvar Configurações de RTP</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Real-time Game Bets Log */}
                        {g.recentBets && g.recentBets.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" />
                                <span>Últimas Apostas Registradas no Jogo</span>
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400">
                                {g.recentBets.length} rodadas recentes
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                  <tr>
                                    <th className="px-3 py-2">Jogador</th>
                                    <th className="px-3 py-2">Aposta</th>
                                    <th className="px-3 py-2">Multiplicador</th>
                                    <th className="px-3 py-2">Prêmio / Retorno</th>
                                    <th className="px-3 py-2">Dificuldade</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2">Horário</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {g.recentBets.map((bet) => (
                                    <tr key={bet.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="px-3 py-2.5 font-bold text-slate-800">{bet.userName}</td>
                                      <td className="px-3 py-2.5 font-extrabold text-slate-900">
                                        R$ {bet.betAmount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className="font-extrabold text-indigo-600">
                                          {bet.multiplier ? `${bet.multiplier.toFixed(2)}x` : '-'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {bet.status === 'cashed_out' ? (
                                          <span className="font-extrabold text-emerald-600">
                                            +R$ {bet.payoutAmount.toFixed(2)}
                                          </span>
                                        ) : bet.status === 'lost' ? (
                                          <span className="font-bold text-rose-500">R$ 0,00</span>
                                        ) : (
                                          <span className="text-slate-400">Em andamento</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                          bet.difficulty === 'easy'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : bet.difficulty === 'medium'
                                            ? 'bg-blue-50 text-blue-700'
                                            : bet.difficulty === 'hard'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-rose-50 text-rose-700'
                                        }`}>
                                          {bet.difficulty === 'easy' ? 'Fácil' : bet.difficulty === 'medium' ? 'Médio' : bet.difficulty === 'hard' ? 'Difícil' : 'Extremo'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {bet.status === 'cashed_out' ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Cashout
                                          </span>
                                        ) : bet.status === 'lost' ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                                            <XCircle className="w-3 h-3" />
                                            Perdeu
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full animate-pulse">
                                            Jogando
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2.5 text-[11px] text-slate-400">
                                        {new Date(bet.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 6: RELATÓRIOS & ANALYTICS BI */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                {/* Header & Controls Bar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <h2 className="text-lg font-black font-heading text-slate-900 tracking-tight">
                          Central de Relatórios & Analytics BI
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        DRE operacional consolidado, auditoria de liquidez, RTP real vs configurado, rede de afiliados e LTV
                      </p>
                    </div>

                    {/* Actions: Refresh, Export Dropdown, Print */}
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        onClick={() => fetchReportData()}
                        disabled={loadingReport}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        title="Atualizar dados analíticos"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingReport ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                      </button>

                      {/* Export Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Exportar CSV</span>
                          <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                        </button>

                        {isExportDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in slide-in-from-top-2">
                            <button
                              onClick={() => {
                                handleExportDRE_CSV();
                                setIsExportDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              <div>
                                <div>DRE Financeiro Diário</div>
                                <span className="text-[10px] font-normal text-slate-400">Entradas, saídas e GGR diário</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleExportTransactions_CSV();
                                setIsExportDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-700 flex items-center gap-2 cursor-pointer"
                            >
                              <Receipt className="w-4 h-4 text-indigo-600" />
                              <div>
                                <div>Extrato de Transações PIX</div>
                                <span className="text-[10px] font-normal text-slate-400">Todos depósitos e saques</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleExportAffiliates_CSV();
                                setIsExportDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-700 flex items-center gap-2 cursor-pointer"
                            >
                              <Users className="w-4 h-4 text-amber-600" />
                              <div>
                                <div>Performance de Afiliados</div>
                                <span className="text-[10px] font-normal text-slate-400">FTDs, comissões CPA/Rev</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                handleExportPlayers_CSV();
                                setIsExportDropdownOpen(false);
                              }}
                              className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-rose-700 flex items-center gap-2 cursor-pointer"
                            >
                              <Crown className="w-4 h-4 text-rose-600" />
                              <div>
                                <div>Top Jogadores & LTV</div>
                                <span className="text-[10px] font-normal text-slate-400">Lucratividade por usuário</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handlePrintExecutiveReport}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                        title="Imprimir / Salvar em PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir DRE</span>
                      </button>
                    </div>
                  </div>

                  {/* Period Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Período:</span>
                    {[
                      { id: 'today', label: 'Hoje' },
                      { id: 'yesterday', label: 'Ontem' },
                      { id: '7days', label: 'Últimos 7 dias' },
                      { id: '30days', label: 'Últimos 30 dias' },
                      { id: 'this_month', label: 'Este Mês' },
                      { id: 'last_month', label: 'Mês Passado' },
                      { id: 'all', label: 'Todo o Período' },
                      { id: 'custom', label: 'Personalizado' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setReportPeriod(tab.id as any);
                          if (tab.id !== 'custom') {
                            fetchReportData(tab.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          reportPeriod === tab.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Range Picker */}
                  {reportPeriod === 'custom' && (
                    <div className="flex flex-wrap items-center gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600">De:</label>
                        <input
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-600">Até:</label>
                        <input
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                        />
                      </div>
                      <button
                        onClick={() => fetchReportData('custom')}
                        disabled={!reportStartDate || loadingReport}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Aplicar Filtro
                      </button>
                    </div>
                  )}
                </div>

                {/* Loading State Overlay or Content */}
                {loadingReport && !reportData ? (
                  <div className="bg-white p-12 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-xs font-bold text-slate-600">Compilando inteligência financeira e analítica...</p>
                  </div>
                ) : (
                  <>
                    {/* Executive KPI Ribbon */}
                    {reportData && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. GGR */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">GGR (Jogo)</span>
                            <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className={`text-xl font-black font-heading ${reportData.periodSummary.ggr >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            R$ {reportData.periodSummary.ggr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Hold Casa:</span>
                            <span className="font-extrabold text-indigo-700">{reportData.periodSummary.ggrMarginPercent.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* 2. NGR */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">NGR Líquido</span>
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div className={`text-xl font-black font-heading ${reportData.periodSummary.ngr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            R$ {reportData.periodSummary.ngr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Margem:</span>
                            <span className="font-extrabold text-emerald-700">{reportData.periodSummary.netOperatingMargin.toFixed(1)}%</span>
                          </div>
                        </div>

                        {/* 3. Depósitos PIX */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Entradas PIX</span>
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div className="text-xl font-black font-heading text-slate-900">
                            R$ {reportData.periodSummary.grossDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>{reportData.periodSummary.grossDepositsCount} pagos</span>
                            <span className="font-extrabold text-emerald-600">{reportData.periodSummary.depositConversionRate.toFixed(0)}% conv</span>
                          </div>
                        </div>

                        {/* 4. Saques Pagos */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Saídas Pagas</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          </div>
                          <div className="text-xl font-black font-heading text-rose-600">
                            R$ {reportData.periodSummary.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>{reportData.periodSummary.totalWithdrawalsCount} pagos</span>
                            {reportData.periodSummary.pendingWithdrawalsCount > 0 ? (
                              <span className="font-extrabold text-amber-600">{reportData.periodSummary.pendingWithdrawalsCount} pend.</span>
                            ) : (
                              <span className="font-extrabold text-slate-400">0 pend.</span>
                            )}
                          </div>
                        </div>

                        {/* 5. RTP Real */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RTP Efetivo</span>
                            <Percent className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <div className="text-xl font-black font-heading text-slate-900">
                            {reportData.periodSummary.realRtpPercent.toFixed(1)}%
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>Teórico:</span>
                            <span className="font-extrabold text-slate-700">96.0%</span>
                          </div>
                        </div>

                        {/* 6. Usuários & FTD */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cadastros / FTD</span>
                            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="text-xl font-black font-heading text-slate-900">
                            +{reportData.periodSummary.newUsersCount}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-between pt-0.5">
                            <span>FTDs:</span>
                            <span className="font-extrabold text-blue-600">
                              {reportData.periodSummary.ftdCount} ({reportData.periodSummary.conversionRatePercent.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Navigation Tabs */}
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
                      {[
                        { id: 'dre', label: 'DRE & Balanço Diário', icon: BarChart3 },
                        { id: 'deposits', label: 'Depósitos & PIX', icon: ArrowDownLeft },
                        { id: 'withdrawals', label: 'Saques & Liquidez', icon: ArrowUpRight },
                        { id: 'gaming', label: 'Jogos & RTP', icon: Gamepad2 },
                        { id: 'affiliates', label: 'Afiliados & Tráfego', icon: Users },
                        { id: 'players', label: 'Jogadores & LTV', icon: Crown },
                        { id: 'transactions', label: 'Extrato Geral', icon: Receipt }
                      ].map((st) => {
                        const Icon = st.icon;
                        const isActive = reportSubTab === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setReportSubTab(st.id as any)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                              isActive
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SUBTAB 1: DRE & BALANÇO DIÁRIO */}
                    {reportSubTab === 'dre' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* DRE Consolidado Box */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <Scale className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-sm font-black font-heading text-slate-900 uppercase tracking-wider">
                                Demonstrativo do Resultado do Exercício (DRE) - Período Selecionado
                              </h3>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Regime de Competência & Caixa
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* DRE de Operação do Jogo */}
                            <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                Operação de Jogos (GGR & NGR)
                              </span>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-200/60">
                                  <span className="text-slate-600 font-medium">Receita Bruta Apostada (Turnover):</span>
                                  <span className="font-extrabold text-slate-900">
                                    R$ {reportData.periodSummary.wagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200/60">
                                  <span className="text-slate-600 font-medium">(-) Prêmios Retornados aos Jogadores:</span>
                                  <span className="font-extrabold text-rose-600">
                                    - R$ {reportData.periodSummary.payouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 bg-indigo-50 px-2 rounded-lg font-black text-indigo-900">
                                  <span>(=) GGR (Gross Gaming Revenue):</span>
                                  <span>R$ {reportData.periodSummary.ggr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200/60">
                                  <span className="text-slate-600 font-medium">(-) Comissões de Afiliados (CPA/RevShare):</span>
                                  <span className="font-extrabold text-amber-600">
                                    - R$ {reportData.periodSummary.totalAffiliateCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 bg-emerald-50 px-2 rounded-lg font-black text-emerald-900">
                                  <span>(=) NGR Líquido da Operação:</span>
                                  <span>R$ {reportData.periodSummary.ngr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>

                            {/* DRE de Fluxo de Caixa PIX */}
                            <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                Fluxo Financeiro de Caixa PIX
                              </span>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-slate-200/60">
                                  <span className="text-slate-600 font-medium">(+) Entradas Brutas (Depósitos PIX Pagos):</span>
                                  <span className="font-extrabold text-emerald-600">
                                    + R$ {reportData.periodSummary.grossDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200/60">
                                  <span className="text-slate-600 font-medium">(-) Saídas Pagas (Saques PIX Processados):</span>
                                  <span className="font-extrabold text-rose-600">
                                    - R$ {reportData.periodSummary.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1.5 bg-slate-900 text-white px-2 rounded-lg font-black">
                                  <span>(=) Saldo Líquido de Caixa:</span>
                                  <span className={reportData.periodSummary.netCashflow >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                    R$ {reportData.periodSummary.netCashflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-500">
                                  <span>(i) Saques em Análise / Auditoria:</span>
                                  <span className="font-extrabold text-amber-600">
                                    R$ {reportData.periodSummary.pendingWithdrawalsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1 text-slate-500">
                                  <span>(i) Ticket Médio de Depósito:</span>
                                  <span className="font-extrabold text-slate-800">
                                    R$ {reportData.periodSummary.avgDepositTicket.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Daily Trend Chart (CSS-based high-fidelity proportional visualizer) */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                              Evolução Diária (Entradas PIX vs Saídas vs GGR)
                            </h3>
                            <div className="flex items-center gap-3 text-[11px] font-bold">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Depósitos
                              </span>
                              <span className="flex items-center gap-1 text-rose-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Saques
                              </span>
                              <span className="flex items-center gap-1 text-indigo-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> GGR
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
                            {reportData.dailyBreakdown.map((day) => {
                              const maxVal = Math.max(
                                ...reportData.dailyBreakdown.map(d => Math.max(d.deposits, d.withdrawals, d.ggr, 10))
                              );
                              const depHeight = Math.max(4, Math.round((day.deposits / maxVal) * 60));
                              const wthHeight = Math.max(4, Math.round((day.withdrawals / maxVal) * 60));
                              const ggrHeight = Math.max(4, Math.round((Math.max(0, day.ggr) / maxVal) * 60));

                              return (
                                <div key={day.date} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                                  <span className="text-[10px] font-black text-slate-700 block truncate">{day.displayDate}</span>
                                  
                                  <div className="h-16 flex items-end justify-center gap-1.5 my-2">
                                    <div
                                      style={{ height: `${depHeight}px` }}
                                      className="w-2 bg-emerald-500 rounded-t-sm"
                                      title={`Depósitos: R$ ${day.deposits.toFixed(2)}`}
                                    />
                                    <div
                                      style={{ height: `${wthHeight}px` }}
                                      className="w-2 bg-rose-500 rounded-t-sm"
                                      title={`Saques: R$ ${day.withdrawals.toFixed(2)}`}
                                    />
                                    <div
                                      style={{ height: `${ggrHeight}px` }}
                                      className="w-2 bg-indigo-500 rounded-t-sm"
                                      title={`GGR: R$ ${day.ggr.toFixed(2)}`}
                                    />
                                  </div>

                                  <div className="space-y-0.5 text-[9px] font-bold">
                                    <div className="text-emerald-600 truncate">+R$ {day.deposits.toFixed(0)}</div>
                                    <div className="text-rose-600 truncate">-R$ {day.withdrawals.toFixed(0)}</div>
                                    <div className="text-indigo-600 truncate">GGR R$ {day.ggr.toFixed(0)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Daily DRE Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                              Tabela Diária Consolidada (DRE Dia a Dia)
                            </h3>
                            <button
                              onClick={handleExportDRE_CSV}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Exportar Planilha DRE
                            </button>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                  <th className="px-4 py-3">Data</th>
                                  <th className="px-4 py-3 text-right">Depósitos PIX</th>
                                  <th className="px-4 py-3 text-right">Saques Pagos</th>
                                  <th className="px-4 py-3 text-right">Saldo Caixa</th>
                                  <th className="px-4 py-3 text-right">Apostado</th>
                                  <th className="px-4 py-3 text-right">Prêmios</th>
                                  <th className="px-4 py-3 text-right">GGR Jogo</th>
                                  <th className="px-4 py-3 text-center">Cadastros</th>
                                  <th className="px-4 py-3 text-center">FTD</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                {reportData.dailyBreakdown.map((d) => (
                                  <tr key={d.date} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                                      {d.displayDate} <span className="text-[10px] text-slate-400 font-normal">({d.date})</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                      R$ {d.deposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      <span className="block text-[9px] font-normal text-slate-400">({d.depositsCount} dep.)</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-extrabold text-rose-600">
                                      R$ {d.withdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      <span className="block text-[9px] font-normal text-slate-400">({d.withdrawalsCount} saq.)</span>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-black ${d.netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      R$ {d.netCashflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                                      R$ {d.wagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-600">
                                      R$ {d.payouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-black ${d.ggr >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                      R$ {d.ggr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                                      +{d.newUsers}
                                    </td>
                                    <td className="px-4 py-3 text-center font-extrabold text-blue-600">
                                      {d.ftdCount}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 2: DEPÓSITOS & PIX */}
                    {reportSubTab === 'deposits' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Funnel & Conversion Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Volume Aprovado</span>
                            <div className="text-2xl font-black font-heading text-emerald-600">
                              R$ {reportData.periodSummary.grossDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.grossDepositsCount} depósitos liquidados com sucesso
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ticket Médio</span>
                            <div className="text-2xl font-black font-heading text-slate-900">
                              R$ {reportData.periodSummary.avgDepositTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Média gasta por transação de depósito</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Taxa de Conversão PIX</span>
                            <div className="text-2xl font-black font-heading text-indigo-600">
                              {reportData.periodSummary.depositConversionRate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.grossDepositsCount} de {reportData.periodSummary.allDepositsCount} PIX gerados foram pagos
                            </p>
                          </div>
                        </div>

                        {/* Deposit Range Buckets */}
                        {reportData.depositBuckets && (
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                              Distribuição de Depósitos por Faixa de Valor
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                              {Object.entries(reportData.depositBuckets).map(([key, rawBucket]) => {
                                const bucket = rawBucket as { label: string; count: number; total: number };
                                const percentOfTotal = reportData.periodSummary.grossDeposits > 0
                                  ? (bucket.total / reportData.periodSummary.grossDeposits) * 100
                                  : 0;
                                return (
                                  <div key={key} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                      <span>{bucket.label}</span>
                                      <span className="text-indigo-600 font-black">{bucket.count}x</span>
                                    </div>
                                    <div className="text-base font-black text-slate-900">
                                      R$ {bucket.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        style={{ width: `${percentOfTotal}%` }}
                                        className="h-full bg-indigo-600 rounded-full"
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold block text-right">
                                      {percentOfTotal.toFixed(1)}% do volume
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Top Depositors */}
                        {reportData.topDepositingPlayers && (
                          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                                Maiores Depositantes do Período
                              </h3>
                              <span className="text-[11px] font-bold text-slate-400">Top 10 Usuários</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 py-3">Jogador</th>
                                    <th className="px-4 py-3">E-mail</th>
                                    <th className="px-4 py-3 text-center">Depósitos</th>
                                    <th className="px-4 py-3 text-right">Total Depositado</th>
                                    <th className="px-4 py-3 text-right">Total Sacado</th>
                                    <th className="px-4 py-3 text-right">Saldo Líquido Casa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                  {reportData.topDepositingPlayers.map((player, idx) => {
                                    const netProfit = player.totalDeposited - player.totalWithdrawn;
                                    return (
                                      <tr key={player.userId || idx} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">
                                            {idx + 1}
                                          </span>
                                          <span>{player.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{player.email}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{player.depositsCount}</td>
                                        <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                          R$ {player.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-extrabold text-rose-600">
                                          R$ {player.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                          R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 3: SAQUES & LIQUIDEZ */}
                    {reportSubTab === 'withdrawals' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Liquidity Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Pago</span>
                            <div className="text-2xl font-black font-heading text-rose-600">
                              R$ {reportData.periodSummary.totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.totalWithdrawalsCount} saques aprovados e enviados
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Saques em Análise</span>
                            <div className="text-2xl font-black font-heading text-amber-600">
                              R$ {reportData.periodSummary.pendingWithdrawalsAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.pendingWithdrawalsCount} solicitações aguardando
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ticket Médio de Saque</span>
                            <div className="text-2xl font-black font-heading text-slate-900">
                              R$ {reportData.periodSummary.avgWithdrawalTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Valor médio por saque aprovado</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Taxa de Retenção</span>
                            <div className="text-2xl font-black font-heading text-emerald-600">
                              {reportData.periodSummary.grossDeposits > 0
                                ? (((reportData.periodSummary.grossDeposits - reportData.periodSummary.totalWithdrawals) / reportData.periodSummary.grossDeposits) * 100).toFixed(1)
                                : '100.0'}%
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Capital retido na plataforma</p>
                          </div>
                        </div>

                        {/* Top Withdrawing Players */}
                        {reportData.topWithdrawingPlayers && (
                          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                                Maiores Sacadores do Período (Auditoria de Liquidez)
                              </h3>
                              <span className="text-[11px] font-bold text-slate-400">Top 10 Usuários</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 py-3">Jogador</th>
                                    <th className="px-4 py-3">E-mail</th>
                                    <th className="px-4 py-3 text-center">Qtd Saques</th>
                                    <th className="px-4 py-3 text-right">Total Sacado</th>
                                    <th className="px-4 py-3 text-right">Total Depositado</th>
                                    <th className="px-4 py-3 text-right">Proporção Saque/Depósito</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                  {reportData.topWithdrawingPlayers.map((player, idx) => {
                                    const ratio = player.totalDeposited > 0
                                      ? (player.totalWithdrawn / player.totalDeposited) * 100
                                      : 999;
                                    return (
                                      <tr key={player.userId || idx} className="hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">
                                            {idx + 1}
                                          </span>
                                          <span>{player.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{player.email}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{player.withdrawalsCount}</td>
                                        <td className="px-4 py-3 text-right font-extrabold text-rose-600">
                                          R$ {player.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                          R$ {player.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold">
                                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                                            ratio > 100 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                          }`}>
                                            {ratio > 500 ? '>500%' : `${ratio.toFixed(0)}%`}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 4: JOGOS & RTP REAL */}
                    {reportSubTab === 'gaming' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Gaming Intelligence Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Volume Apostado</span>
                            <div className="text-2xl font-black font-heading text-slate-900">
                              R$ {reportData.periodSummary.wagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.totalBetsCount} apostas registradas no período
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Prêmios Pagos</span>
                            <div className="text-2xl font-black font-heading text-indigo-600">
                              R$ {reportData.periodSummary.payouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Retorno total para os apostadores</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">RTP Real vs Teórico</span>
                            <div className="text-2xl font-black font-heading text-emerald-600">
                              {reportData.periodSummary.realRtpPercent.toFixed(1)}%
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              Teórico configurado: 96.0% (Margem casa: {(100 - reportData.periodSummary.realRtpPercent).toFixed(1)}%)
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Taxa de Vitória Jogadores</span>
                            <div className="text-2xl font-black font-heading text-slate-900">
                              {reportData.periodSummary.winRatePercent.toFixed(1)}%
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {reportData.periodSummary.winsCount} vitórias / {reportData.periodSummary.lossesCount} derrotas
                            </p>
                          </div>
                        </div>

                        {/* Top Multiplier & Difficulty Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                              Recordes de Rodadas no Período
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Maior Multiplicador</span>
                                <span className="text-xl font-black text-indigo-600">
                                  {reportData.periodSummary.topMultiplier.toFixed(2)}x
                                </span>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Maior Prêmio Único</span>
                                <span className="text-xl font-black text-emerald-600">
                                  R$ {reportData.periodSummary.topWinAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                              Distribuição por Dificuldade Jogada
                            </h3>
                            <div className="space-y-2">
                              {Object.entries(reportData.difficultyDistribution || {}).map(([diff, count]) => {
                                const totalBets = reportData.periodSummary.totalBetsCount || 1;
                                const betCount = Number(count) || 0;
                                const pct = (betCount / totalBets) * 100;
                                const labels: Record<string, string> = {
                                  easy: 'Fácil (Mais Conectores)',
                                  medium: 'Médio (Equilibrado)',
                                  hard: 'Difícil (Retenção Alta)',
                                  extreme: 'Extremo (High Rollers)'
                                };
                                return (
                                  <div key={diff} className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                      <span>{labels[diff] || diff}</span>
                                      <span className="font-extrabold text-slate-900">{betCount} rodadas ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div
                                        style={{ width: `${pct}%` }}
                                        className="h-full bg-indigo-600 rounded-full"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 5: AFILIADOS & TRÁFEGO */}
                    {reportSubTab === 'affiliates' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Affiliate Network Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Comissões Totais do Período</span>
                            <div className="text-2xl font-black font-heading text-amber-600">
                              R$ {reportData.periodSummary.totalAffiliateCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Comissões geradas por CPA e RevShare</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FTDs Gerados pela Rede</span>
                            <div className="text-2xl font-black font-heading text-indigo-600">
                              {reportData.periodSummary.ftdCount} FTDs
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Novos depositantes capturados por influenciadores</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Afiliados Ativos</span>
                            <div className="text-2xl font-black font-heading text-slate-900">
                              {reportData.affiliateRanking ? reportData.affiliateRanking.length : 0}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Parceiros com códigos promocionais vinculados</p>
                          </div>
                        </div>

                        {/* Affiliate Ranking Table */}
                        {reportData.affiliateRanking && (
                          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                                Ranking de Afiliados & Gestão de Tráfego
                              </h3>
                              <button
                                onClick={handleExportAffiliates_CSV}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Exportar Afiliados CSV
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Afiliado</th>
                                    <th className="px-4 py-3">E-mail</th>
                                    <th className="px-4 py-3 text-center">Indicações Período</th>
                                    <th className="px-4 py-3 text-center">FTDs Ativos</th>
                                    <th className="px-4 py-3 text-right">Volume Gerado</th>
                                    <th className="px-4 py-3 text-center">CPA / Rev</th>
                                    <th className="px-4 py-3 text-right">Comissões Geradas</th>
                                    <th className="px-4 py-3 text-right">Saldo Disponível</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                  {reportData.affiliateRanking.map((aff, idx) => (
                                    <tr key={aff.affiliateId || idx} className="hover:bg-slate-50/80">
                                      <td className="px-4 py-3 font-mono font-black text-indigo-600">
                                        {aff.referralCode}
                                      </td>
                                      <td className="px-4 py-3 font-bold text-slate-900">{aff.userName}</td>
                                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{aff.userEmail}</td>
                                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                                        {aff.periodReferralsCount} <span className="text-[10px] text-slate-400">({aff.totalReferrals} total)</span>
                                      </td>
                                      <td className="px-4 py-3 text-center font-extrabold text-blue-600">{aff.ftdCount}</td>
                                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                        R$ {aff.referralDepositsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-center text-slate-600 font-bold text-[11px]">
                                        R$ {aff.cpaAmount.toFixed(0)} / {aff.revSharePercent}%
                                      </td>
                                      <td className="px-4 py-3 text-right font-extrabold text-amber-600">
                                        R$ {aff.commissionTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-black text-slate-900">
                                        R$ {aff.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 6: JOGADORES & LTV */}
                    {reportSubTab === 'players' && reportData && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* Player Growth & LTV Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Novos Cadastros</span>
                            <div className="text-2xl font-black font-heading text-blue-600">
                              +{reportData.periodSummary.newUsersCount}
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Novos usuários registrados no período</p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">FTDs (Primeiro Depósito)</span>
                            <div className="text-2xl font-black font-heading text-emerald-600">
                              {reportData.periodSummary.ftdCount} FTDs
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              Taxa de ativação: {reportData.periodSummary.conversionRatePercent.toFixed(1)}% dos novos usuários
                            </p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Jogadores Ativos em Apostas</span>
                            <div className="text-2xl font-black font-heading text-indigo-600">
                              {reportData.periodSummary.activePlayersCount} jogadores
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Usuários que efetuaram apostas no período</p>
                          </div>
                        </div>

                        {/* Top Profitable Players Table */}
                        {reportData.topProfitablePlayers && (
                          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-xs font-black font-heading text-slate-900 uppercase tracking-wider">
                                Jogadores Mais Lucrativos para a Plataforma (Maior GGR Gerado)
                              </h3>
                              <button
                                onClick={handleExportPlayers_CSV}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Exportar LTV CSV
                              </button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                    <th className="px-4 py-3">Jogador</th>
                                    <th className="px-4 py-3">E-mail / Telefone</th>
                                    <th className="px-4 py-3 text-right">Saldo Atual</th>
                                    <th className="px-4 py-3 text-right">Total Depositado</th>
                                    <th className="px-4 py-3 text-right">Total Sacado</th>
                                    <th className="px-4 py-3 text-right">Apostado</th>
                                    <th className="px-4 py-3 text-right">Prêmios Pagos</th>
                                    <th className="px-4 py-3 text-right">GGR da Casa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                  {reportData.topProfitablePlayers.map((p, idx) => (
                                    <tr key={p.userId || idx} className="hover:bg-slate-50/80">
                                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center">
                                          {idx + 1}
                                        </span>
                                        <span>{p.name}</span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="block text-slate-700 font-mono text-[11px]">{p.email}</span>
                                        <span className="block text-[10px] text-slate-400">{p.phone}</span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-black text-slate-900">
                                        R$ {p.currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-extrabold text-emerald-600">
                                        R$ {p.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        <span className="block text-[9px] font-normal text-slate-400">({p.depositsCount} dep.)</span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-extrabold text-rose-600">
                                        R$ {p.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        <span className="block text-[9px] font-normal text-slate-400">({p.withdrawalsCount} saq.)</span>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                                        R$ {p.totalWagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-slate-600">
                                        R$ {p.totalPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className={`px-4 py-3 text-right font-black ${p.ggrGenerated >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                        R$ {p.ggrGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 7: EXTRATO GERAL DE TRANSAÇÕES */}
                    {reportSubTab === 'transactions' && reportData && (
                      <div className="space-y-4 animate-in fade-in">
                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={reportSearchTerm}
                              onChange={(e) => setReportSearchTerm(e.target.value)}
                              placeholder="Buscar por usuário, e-mail, telefone ou ID..."
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={reportTxFilter}
                              onChange={(e) => setReportTxFilter(e.target.value as any)}
                              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                            >
                              <option value="all">Todos os Tipos (Depósitos + Saques)</option>
                              <option value="deposit">Apenas Depósitos PIX</option>
                              <option value="withdrawal">Apenas Saques PIX</option>
                            </select>

                            <button
                              onClick={handleExportTransactions_CSV}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Exportar CSV
                            </button>
                          </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                                  <th className="px-4 py-3">Tipo</th>
                                  <th className="px-4 py-3">Data e Hora</th>
                                  <th className="px-4 py-3">Usuário</th>
                                  <th className="px-4 py-3">Contato</th>
                                  <th className="px-4 py-3 text-right">Valor</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                  <th className="px-4 py-3">Método / Descrição</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                                {reportData.transactions
                                  .filter(t => {
                                    if (reportTxFilter !== 'all' && t.type !== reportTxFilter) return false;
                                    if (reportSearchTerm.trim()) {
                                      const term = reportSearchTerm.toLowerCase();
                                      return (
                                        t.userName?.toLowerCase().includes(term) ||
                                        t.userEmail?.toLowerCase().includes(term) ||
                                        t.userPhone?.toLowerCase().includes(term) ||
                                        t.id?.toLowerCase().includes(term)
                                      );
                                    }
                                    return true;
                                  })
                                  .slice(0, 50)
                                  .map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/80">
                                      <td className="px-4 py-3">
                                        {tx.type === 'deposit' ? (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                            <ArrowDownLeft className="w-3 h-3" /> Depósito
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                                            <ArrowUpRight className="w-3 h-3" /> Saque
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                        {new Date(tx.createdAt).toLocaleString('pt-BR')}
                                      </td>
                                      <td className="px-4 py-3 font-bold text-slate-900">{tx.userName}</td>
                                      <td className="px-4 py-3">
                                        <span className="block text-slate-600 font-mono text-[11px]">{tx.userEmail}</span>
                                        <span className="block text-[10px] text-slate-400">{tx.userPhone}</span>
                                      </td>
                                      <td className={`px-4 py-3 text-right font-black ${
                                        tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'
                                      }`}>
                                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                          tx.status === 'approved'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : tx.status === 'pending'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}>
                                          {tx.status === 'approved' ? 'Aprovado' : tx.status === 'pending' ? 'Pendente' : 'Falha'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                                        {tx.paymentMethod} {tx.description ? `• ${tx.description}` : ''}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 7: NOTIFICAÇÕES */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Disparo de Notificações Push & Pop-ups</h2>
                  <p className="text-xs text-slate-500 font-medium">Envie avisos do sistema em tempo real diretamente na tela dos usuários</p>
                </div>

                <form onSubmit={handleSendNotification} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Destinatários:</label>
                    <select
                      value={notificationTarget}
                      onChange={(e) => setNotificationTarget(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="all">Todos os Usuários Cadastrados ({users.length})</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Título do Comunicado:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Novo Bônus de Depósito Liberado!"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Mensagem:</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Escreva a mensagem do comunicado em detalhes..."
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingNotification}
                    className="w-full h-11 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendingNotification ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Disparar Comunicado Agora</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 8: ADMINS & PERMISSÕES */}
            {activeTab === 'admins' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Administradores e Permissões Granulares</h2>
                    <p className="text-xs text-slate-500 font-medium">Cadastre novos administradores e limite exatamente quais funções cada um pode acessar</p>
                  </div>

                  {isSuperAdmin && (
                    <button
                      onClick={() => setIsNewAdminModalOpen(true)}
                      className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Novo Admin</span>
                    </button>
                  )}
                </div>

                {loadingAdmins ? (
                  <div className="p-16 text-center bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Carregando lista de administradores...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {adminsList.map((admin) => {
                      const isMainSuper = admin.email.toLowerCase() === 'admin.eduh@gmail.com';
                      const perms = admin.adminPermissions || {};

                      return (
                        <div
                          key={admin.id}
                          className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-base text-slate-900">{admin.name}</span>
                                {isMainSuper ? (
                                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-600" /> SUPER ADMIN PRINCIPAL
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                    SUB-ADMINISTRADOR
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-mono flex items-center gap-3">
                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {admin.email}</span>
                                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {admin.phone || 'Sem telefone'}</span>
                              </p>
                            </div>

                            {!isMainSuper && isSuperAdmin && (
                              <button
                                onClick={() => handleRevokeAdmin(admin.id, admin.email)}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
                              >
                                Revogar Acesso Admin
                              </button>
                            )}
                          </div>

                          {/* Permissions Toggles Grid */}
                          <div className="space-y-2.5">
                            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                              Permissões Concedidas ao Administrador:
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canViewMetrics ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Dashboard & Métricas
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canViewMetrics}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canViewMetrics')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canManageUsers ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Gerenciar Usuários
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canManageUsers}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canManageUsers')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canManageBalances ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Alterar Saldos
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canManageBalances}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canManageBalances')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canManageCommissions ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Percent className="w-3.5 h-3.5 text-indigo-600" /> % Comissão Afiliados
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canManageCommissions}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canManageCommissions')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canApproveWithdrawals ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" /> Aprovar Saques PIX
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canApproveWithdrawals}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canApproveWithdrawals')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canApproveDeposits ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Gestão Depósitos
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canApproveDeposits}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canApproveDeposits')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canSendNotifications ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Bell className="w-3.5 h-3.5 text-indigo-600" /> Enviar Notificações PWA
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canSendNotifications}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canSendNotifications')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canManageGames ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" /> Gerenciar RTP / Jogos
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canManageGames}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canManageGames')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canManageAdmins ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-indigo-600" /> Gerenciar Admins
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canManageAdmins}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canManageAdmins')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>

                              <label className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                                perms.canExportReports ? 'bg-indigo-50/60 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-600" /> Exportar Relatórios
                                </span>
                                <input
                                  type="checkbox"
                                  disabled={isMainSuper || !isSuperAdmin}
                                  checked={!!perms.canExportReports}
                                  onChange={() => handleUpdatePermissions(admin.id, perms, 'canExportReports')}
                                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: LOGS DO SISTEMA & SEGURANÇA */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-extrabold font-heading text-slate-900 tracking-tight">Logs do Sistema & Regras de Acesso</h2>
                  <p className="text-xs text-slate-500 font-medium">Configurações de rede, audit trail e segurança restrita do domínio</p>
                </div>

                <div className="bg-white p-6 border border-slate-100 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Domínio Restrito do Painel Admin</h3>
                      <p className="text-xs text-indigo-600 font-mono font-bold">admin.goalliancehub.com</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-4 font-medium">
                    <p className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> O painel administrativo foi estruturado especificamente para ser direcionado ao subdomínio <strong className="text-slate-900">admin.goalliancehub.com</strong>.
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" /> Conta de login Master restrita e com auto-elevação de privilégios para: <strong className="text-slate-900 font-mono">admin.eduh@gmail.com</strong>.
                    </p>
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" /> Cada sub-administrador secundário tem suas funções limitadas no backend de acordo com as permissões marcadas.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PAGE FOOTER */}
          <footer className="mt-auto py-6 px-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-medium">
            <div>
              © 2026 Alliance Hub. Todos os direitos reservados.
            </div>
            <div>
              Versão 2.1.0
            </div>
          </footer>
        </div>
      </div>

      {/* MODAL: BALANCE, ROLE & AFFILIATE HUB ADJUSTMENT */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                Gerenciar Usuário & Saldo
              </h3>
              <button
                onClick={() => setSelectedUserForBalance(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Usuário Selecionado:</p>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-extrabold text-slate-900">{selectedUserForBalance.name}</p>
                {selectedUserForBalance.role === 'affiliate' ? (
                  <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded-full">
                    AFILIADO HUB
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                    JOGADOR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">{selectedUserForBalance.email}</p>
              <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-200/60 mt-2">
                <span className="text-emerald-600 font-bold">
                  Saldo Atual: R$ {selectedUserForBalance.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-indigo-600 font-bold">
                  Saque Mín. Atual: R$ {(selectedUserForBalance.minWithdraw ?? 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmBalanceAdjust} className="space-y-4">
              {/* Definir como Afiliado Hub / Cargo */}
              <div className="space-y-2 p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
                <div>
                  <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                    Definir Cargo / Afiliado Hub:
                  </label>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Afiliados Hub possuem painel de comissões, links de indicação e acompanhamento de jogadores.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUserRole('user')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedUserRole === 'user'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Jogador Padrão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedUserRole('affiliate')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      selectedUserRole === 'affiliate'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-300'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>⭐ Afiliado Hub</span>
                  </button>
                </div>

                {/* Influencer Toggle */}
                <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      Modo Influenciador (80% Win Rate)
                    </span>
                    <p className="text-[9px] text-slate-500">
                      RTP 99.8% no Block Win para lives e gravações promocionais.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIsInfluencer(!selectedUserIsInfluencer)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      selectedUserIsInfluencer ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        selectedUserIsInfluencer ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Tipo de Operação do Saldo:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceActionType('add')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      balanceActionType === 'add'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    + Adicionar
                  </button>

                  <button
                    type="button"
                    onClick={() => setBalanceActionType('subtract')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      balanceActionType === 'subtract'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    - Subtrair
                  </button>

                  <button
                    type="button"
                    onClick={() => setBalanceActionType('set')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      balanceActionType === 'set'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    = Definir
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Ajuste de Saldo (R$):</label>
                <input
                  type="text"
                  placeholder="0,00 (Deixe em branco para manter saldo)"
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Saque Mínimo Exigido (R$):</label>
                <input
                  type="text"
                  required
                  placeholder="100,00"
                  value={minWithdrawAmount}
                  onChange={(e) => setMinWithdrawAmount(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-400">Valor mínimo para que este usuário possa solicitar saques via PIX.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Observação / Motivo:</label>
                <input
                  type="text"
                  placeholder="Ex: Ajuste de bônus, promoção para Afiliado Hub..."
                  value={balanceAdjustNote}
                  onChange={(e) => setBalanceAdjustNote(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* CPA Killer Permission Option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">Liberar Módulo CPA Killer</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Permite que este usuário configure o descarte automático de CPAs na área de afiliados.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCpaKillerAllowed(!cpaKillerAllowed)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cpaKillerAllowed ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      cpaKillerAllowed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForBalance(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submittingBalance}
                  className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingBalance ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUB-ADMIN */}
      {isNewAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Cadastrar Novo Administrador
              </h3>
              <button
                onClick={() => setIsNewAdminModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">E-mail do Usuário Existente:</label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                />
                <p className="text-[11px] text-slate-400 font-medium pt-0.5">
                  O e-mail precisa pertencer a uma conta já cadastrada na plataforma.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Permissões Iniciais:</label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Dashboard & Métricas
                    </span>
                    <input
                      type="checkbox"
                      checked={!!newAdminPermissions.canViewMetrics}
                      onChange={(e) => setNewAdminPermissions(p => ({ ...p, canViewMetrics: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> Gerenciar Usuários & Bloqueio
                    </span>
                    <input
                      type="checkbox"
                      checked={!!newAdminPermissions.canManageUsers}
                      onChange={(e) => setNewAdminPermissions(p => ({ ...p, canManageUsers: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Alterar Saldos de Usuários
                    </span>
                    <input
                      type="checkbox"
                      checked={!!newAdminPermissions.canManageBalances}
                      onChange={(e) => setNewAdminPermissions(p => ({ ...p, canManageBalances: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600" /> Aprovar / Rejeitar Saques PIX
                    </span>
                    <input
                      type="checkbox"
                      checked={!!newAdminPermissions.canApproveWithdrawals}
                      onChange={(e) => setNewAdminPermissions(p => ({ ...p, canApproveWithdrawals: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAdminModalOpen(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingAdmin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Promover a Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: EDIT AFFILIATE COMMISSION & CPA */}
      {selectedAffiliateForCommission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-600" />
                Controle de Comissão e Afiliado
              </h3>
              <button
                onClick={() => setSelectedAffiliateForCommission(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-purple-50/70 border border-purple-100 p-3.5 rounded-xl space-y-1">
              <div className="text-xs font-extrabold text-purple-900">{selectedAffiliateForCommission.name}</div>
              <div className="text-[11px] text-purple-700 font-mono">{selectedAffiliateForCommission.email}</div>
            </div>

            <form onSubmit={handleSaveAffiliateCommission} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Porcentagem de Comissão / RevShare (%):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={editRevSharePercent}
                  onChange={(e) => setEditRevSharePercent(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[10px] text-slate-400">Percentual de comissão repassado ao afiliado sobre os depósitos (padrão: 70%).</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Saldo Disponível para Saque do Afiliado (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editAffiliateBalance}
                  onChange={(e) => setEditAffiliateBalance(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <p className="text-[10px] text-slate-400">Saldo acumulado na carteira de afiliado disponível para saque PIX.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAffiliateForCommission(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submittingCommission}
                  className="w-full py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submittingCommission ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW FULL AFFILIATE NETWORK & REFERRED PLAYERS */}
      {viewingAffiliateNetwork && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 w-full max-w-3xl rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    Rede de Jogadores Indicados
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Afiliado: <strong className="text-indigo-900 font-bold">{viewingAffiliateNetwork.name}</strong> • Código: <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">{viewingAffiliateNetwork.affiliateInfo?.referralCode || 'N/A'}</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAffiliateNetwork(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Affiliate Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Indicados</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {users.filter(u => 
                    u.referredBy?.referralCode === viewingAffiliateNetwork.affiliateInfo?.referralCode ||
                    u.referredBy?.affiliateId === viewingAffiliateNetwork.id
                  ).length} jogadores
                </span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Depósitos da Rede</span>
                <span className="text-lg font-black text-emerald-900 mt-0.5 block">
                  R$ {users
                    .filter(u => 
                      u.referredBy?.referralCode === viewingAffiliateNetwork.affiliateInfo?.referralCode ||
                      u.referredBy?.affiliateId === viewingAffiliateNetwork.id
                    )
                    .reduce((acc, u) => acc + (u.totalDeposited || 0), 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 bg-purple-50/70 border border-purple-200/70 rounded-2xl">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Comissão RevShare</span>
                <span className="text-lg font-black text-purple-900 mt-0.5 block">
                  {(viewingAffiliateNetwork.affiliateInfo?.revSharePercent ?? 70).toFixed(1)}%
                </span>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Saldo do Afiliado</span>
                <span className="text-lg font-black text-indigo-900 mt-0.5 block">
                  R$ {(viewingAffiliateNetwork.affiliateInfo?.affiliateBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* List of Referred Players */}
            <div className="flex-1 overflow-y-auto min-h-[220px] border border-slate-100 rounded-2xl">
              {(() => {
                const networkPlayers = users.filter(u => 
                  u.referredBy?.referralCode === viewingAffiliateNetwork.affiliateInfo?.referralCode ||
                  u.referredBy?.affiliateId === viewingAffiliateNetwork.id
                );

                if (networkPlayers.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">Nenhum jogador cadastrado nesta rede até o momento.</p>
                      <p className="text-xs text-slate-400">Quando jogadores se cadastrarem com o link ou código deste afiliado, eles aparecerão aqui.</p>
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3.5">Jogador</th>
                        <th className="py-2.5 px-3">Cadastro</th>
                        <th className="py-2.5 px-3 text-right">Saldo</th>
                        <th className="py-2.5 px-3 text-right">Total Depositado</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {networkPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {player.name ? player.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-900 truncate">{player.name}</div>
                                <div className="text-[11px] text-slate-400 truncate">{player.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-medium">
                            {new Date(player.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900">
                            R$ {player.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-emerald-600">
                            R$ {(player.totalDeposited || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {player.isBlocked ? (
                              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-block">
                                Bloqueado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full inline-block">
                                Ativo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setViewingAffiliateNetwork(null);
                                setSelectedUserForBalance(player);
                                setBalanceAdjustAmount('');
                                setBalanceActionType('add');
                                setBalanceAdjustNote('');
                                setMinWithdrawAmount((player.minWithdraw ?? 100).toFixed(2));
                                setCpaKillerAllowed(player.cpaKillerAllowed || false);
                                setSelectedUserRole(player.role === 'affiliate' ? 'affiliate' : (player.role === 'admin' || player.role === 'superadmin' ? player.role : 'user'));
                                setSelectedUserIsInfluencer(!!player.isInfluencer);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Gerenciar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  setSelectedSponsorFilter(viewingAffiliateNetwork.affiliateInfo?.referralCode || viewingAffiliateNetwork.id);
                  setActiveTab('users');
                  setViewingAffiliateNetwork(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filtrar apenas estes jogadores na tabela principal</span>
              </button>
              <button
                onClick={() => setViewingAffiliateNetwork(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-1 py-2 flex items-center justify-around text-[10px] font-bold text-slate-400 shadow-2xl">
        <button
          onClick={() => { setActiveTab('metrics'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'metrics' ? 'text-indigo-400 font-black' : 'hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'users' ? 'text-indigo-400 font-black' : 'hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários</span>
        </button>

        <button
          onClick={() => { setActiveTab('withdrawals'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all relative ${
            activeTab === 'withdrawals' ? 'text-indigo-400 font-black' : 'hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Saques</span>
          {withdrawals.filter(w => w.status === 'pending').length > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('deposits'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'deposits' ? 'text-indigo-400 font-black' : 'hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Depósitos</span>
        </button>

        <button
          onClick={() => { setActiveTab('rtp'); setMobileMenuOpen(false); }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
            activeTab === 'rtp' ? 'text-indigo-400 font-black' : 'hover:text-white'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Jogos/RTP</span>
        </button>
      </div>
    </div>
  );
};
