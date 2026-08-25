export interface AdminPermissions {
  canManageUsers?: boolean;
  canManageBalances?: boolean;
  canManageCommissions?: boolean;
  canApproveWithdrawals?: boolean;
  canApproveDeposits?: boolean;
  canSendNotifications?: boolean;
  canManageGames?: boolean;
  canManageAdmins?: boolean;
  canViewMetrics?: boolean;
  canExportReports?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  affiliateId?: string;
  referralCode: string;
  balance: number;
  realBalance?: number;
  promoBalance?: number;
  minWithdraw?: number;
  isInfluencer?: boolean;
  cpaKillerAllowed?: boolean;
  role?: 'user' | 'admin' | 'superadmin' | 'affiliate';
  isBlocked?: boolean;
  adminPermissions?: AdminPermissions;
  pixKey?: {
    id?: string;
    type: string;
    key: string;
    name: string;
    status?: string;
  };
  createdAt: string;
}

export interface IndicationItem {
  id: string;
  referredUserId?: string;
  referredName: string;
  referredEmail: string;
  referredBalance?: number;
  totalDeposited?: number;
  isInfluencer?: boolean;
  subReferralsCount?: number;
  subNetworkDeposits?: number;
  subNetworkBalances?: number;
  affiliateBalance?: number;
  ftdCount?: number;
  lastGameId?: string;
  lastGameName?: string;
  createdAt: string;
}

export interface AffiliateInfo {
  id: string;
  userId: string;
  referralCode: string;
  referralLink: string;
  status: 'active' | 'pending';
  indicationsCount: number;
  commissionTotal: number;
  affiliateBalance: number;
  cpaAmount?: number;
  revSharePercent?: number;
  totalNetworkDeposits?: number;
  totalFtds?: number;
  indications?: IndicationItem[];
  commissions?: AffiliateCommissionItem[];
  cpaKillerAllowed?: boolean;
  cpaKillerActive?: boolean;
  cpaKillerEveryX?: number;
  cpaKillerKillY?: number;
  cpaCounter?: number;
  createdAt: string;
}

export interface AffiliateCommissionItem {
  id: string;
  amount: number;
  buyerUserId: string;
  buyerName: string;
  gameId?: string;
  gameName?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referredName: string;
  referredEmail: string;
  referredBalance?: number;
  isInfluencer?: boolean;
  referralCode: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'commission';
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  paymentMethod: string;
  description: string;
  createdAt: string;
}

export interface Game {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  provider: string;
  status: 'active' | 'maintenance';
  minBet?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}
