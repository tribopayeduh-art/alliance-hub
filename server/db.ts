import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
  query,
  where
} from 'firebase/firestore';
import crypto from 'crypto';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

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

export interface UserDB {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  affiliateId?: string;
  referralCode: string;
  balance: number;
  promoBalance?: number;
  minWithdraw?: number;
  isInfluencer?: boolean;
  cpaKillerAllowed?: boolean;
  pixKey?: any;
  pixKeys?: any[];
  createdAt: string;
  acquisitionGame?: string;
  acquisitionDomain?: string;
  role?: 'user' | 'admin' | 'superadmin' | 'affiliate';
  isBlocked?: boolean;
  adminPermissions?: AdminPermissions;
}

export interface AffiliateDB {
  id: string;
  userId: string;
  referralCode: string;
  status: 'active' | 'pending';
  commissionTotal: number;
  affiliateBalance: number;
  cpaAmount?: number;
  revSharePercent?: number;
  cpaKillerActive?: boolean;
  cpaKillerEveryX?: number;
  cpaKillerKillY?: number;
  cpaCounter?: number;
  createdAt: string;
}

export interface ReferralDB {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referralCode: string;
  createdAt: string;
  acquisitionGame?: string;
  acquisitionDomain?: string;
}

export interface TransactionDB {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  paymentMethod: string;
  description: string;
  createdAt: string;
  provider?: 'DOTFY' | string;
  providerWithdrawalId?: string;
  providerStatus?: string;
  fee?: number;
  netAmount?: number;
  processedAt?: string;
  refundedAt?: string;
  gameId?: string;
  chargeCorrelationID?: string;
}

export interface GameDB {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  provider: string;
  status: 'active' | 'maintenance';
  minBet: number;
}

export interface GameConfigDB {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'inactive';
  rtpPercent: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  minBet: number;
  maxBet: number;
  totalWagered: number;
  totalPayout: number;
  ggr: number;
  totalBetsCount: number;
  houseEdgeMode: 'balanced' | 'house_advantage' | 'promo' | 'easy' | 'hard' | 'extreme';
  maxMultiplier: number;
  // Advanced House Edge / Difficulty Modifiers & Retention Control
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
  initialMultiplier?: number; // Base starting multiplier (e.g. 1.0x or 1.10x)
  retentionAggressiveness?: 'soft' | 'moderate' | 'aggressive' | 'ruthless' | 'impossible'; // Retention curve preset
  forceLossOnMaxMultiplier?: boolean; // Force game-ending pressure upon reaching max multiplier
  consecutiveWinDecay?: number; // Decay multiplier boost rate on long win streaks
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
  updatedBy?: string;
  updatedAt?: string;
}

export interface GameBetDB {
  id: string;
  userId: string;
  userName?: string;
  gameId: string;
  betAmount: number;
  multiplier: number;
  payoutAmount: number;
  profitAmount: number;
  status: 'active' | 'cashed_out' | 'lost';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  rtpPercent: number;
  affiliateId?: string;
  sessionId?: string;
  deviceId?: string;
  userAgent?: string;
  ipHash?: string;
  score?: number;
  durationMs?: number;
  eventCount?: number;
  settledAt?: string;
  createdAt: string;
  updatedAt?: string;
  isPromotional?: boolean;
}

export interface GameStatsDB {
  id: string;
  userId: string;
  userName?: string;
  highScore: number;
  gamesPlayed: number;
  linesCleared: number;
  maxCombo: number;
  level: number;
  updatedAt: string;
}

export interface GameSessionDB {
  id: string;
  userId: string;
  score: number;
  lines: number;
  maxCombo: number;
  createdAt: string;
}

export interface AffiliateCommissionDB {
  id: string;
  affiliateId: string;
  referrerUserId: string;
  buyerUserId: string;
  transactionId: string;
  amount: number;
  isKilled?: boolean;
  createdAt: string;
}

export const INITIAL_GAMES: GameDB[] = [
  {
    id: 'block-puzzle',
    name: 'BLOCK PUZZLE',
    category: 'Puzzle',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    provider: 'GameStudio Original',
    status: 'active',
    minBet: 0,
  },
  {
    id: 'zumbla-win',
    name: 'ZUMBLA WIN',
    category: 'Puzzle',
    imageUrl: '/zumbla/banner.webp',
    provider: 'Alliance Originals',
    status: 'active',
    minBet: 1,
  },
];

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = val;
    }
  }
  return clean as T;
}

export class FirestoreDB {
  public hashPassword(pwd: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(pwd, salt, 64, { N: 16384, r: 8, p: 1 });
    return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
  }

  public generateReferralCode(): string {
    return 'REF' + crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  async getUserByEmail(email: string): Promise<UserDB | null> {
    try {
      const q = query(collection(firestoreDb, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserDB;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user by email from Firestore', e);
      throw e;
    }
  }

  async getUserById(id: string): Promise<UserDB | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', id));
      if (snap.exists()) {
        return snap.data() as UserDB;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user by id from Firestore', e);
      throw e;
    }
  }

  async getUserByReferralCode(code: string): Promise<UserDB | null> {
    try {
      const q = query(collection(firestoreDb, 'users'), where('referralCode', '==', code.toUpperCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as UserDB;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user by referralCode from Firestore', e);
    }
    return null;
  }

  async createUser(user: UserDB): Promise<void> {
    await setDoc(doc(firestoreDb, 'users', user.id), sanitizeForFirestore(user));
  }

  async updateUserBalance(id: string, newBalance: number): Promise<void> {
    await updateDoc(doc(firestoreDb, 'users', id), { balance: newBalance });
  }

  async updateUserFields(id: string, fields: Partial<UserDB & { isInfluencer?: boolean }>): Promise<void> {
    await updateDoc(doc(firestoreDb, 'users', id), sanitizeForFirestore(fields));
  }

  async createAffiliate(aff: AffiliateDB): Promise<void> {
    await setDoc(doc(firestoreDb, 'affiliates', aff.id), sanitizeForFirestore(aff));
  }

  async getAffiliateByUserId(userId: string): Promise<AffiliateDB | null> {
    try {
      const q = query(collection(firestoreDb, 'affiliates'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as AffiliateDB;
      }
    } catch (e) {
      console.error('Error fetching affiliate by userId from Firestore', e);
    }
    return null;
  }

  async getAffiliateById(id: string): Promise<AffiliateDB | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'affiliates', id));
      if (snap.exists()) {
        return snap.data() as AffiliateDB;
      }
    } catch (e) {
      console.error('Error fetching affiliate by id from Firestore', e);
    }
    return null;
  }

  async getAffiliateByCode(code: string): Promise<AffiliateDB | null> {
    try {
      const q = query(collection(firestoreDb, 'affiliates'), where('referralCode', '==', code.toUpperCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as AffiliateDB;
      }
    } catch (e) {
      console.error('Error fetching affiliate by code from Firestore', e);
    }
    return null;
  }

  async updateAffiliateCommissions(id: string, commissionTotal: number, affiliateBalance: number): Promise<void> {
    await updateDoc(doc(firestoreDb, 'affiliates', id), {
      commissionTotal,
      affiliateBalance,
    });
  }

  async updateAffiliateFields(id: string, fields: Partial<AffiliateDB>): Promise<void> {
    await updateDoc(doc(firestoreDb, 'affiliates', id), sanitizeForFirestore(fields));
  }

  async getAllAffiliates(): Promise<AffiliateDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'affiliates'));
      return snap.docs.map((d) => d.data() as AffiliateDB);
    } catch (e) {
      console.error('Error fetching all affiliates from Firestore', e);
      return [];
    }
  }

  async updateAffiliateRates(id: string, data: { cpaAmount?: number; revSharePercent?: number; affiliateBalance?: number }): Promise<void> {
    await updateDoc(doc(firestoreDb, 'affiliates', id), sanitizeForFirestore(data));
  }

  async createReferral(ref: ReferralDB): Promise<void> {
    await setDoc(doc(firestoreDb, 'referrals', ref.id), sanitizeForFirestore(ref));
  }

  async getReferralsByAffiliateId(affiliateId: string): Promise<ReferralDB[]> {
    try {
      const q = query(collection(firestoreDb, 'referrals'), where('affiliateId', '==', affiliateId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as ReferralDB);
    } catch (e) {
      console.error('Error fetching referrals from Firestore', e);
      return [];
    }
  }

  async getAllReferrals(): Promise<ReferralDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'referrals'));
      return snap.docs.map((d) => d.data() as ReferralDB);
    } catch (e) {
      console.error('Error fetching all referrals from Firestore', e);
      return [];
    }
  }

  async createTransaction(tx: TransactionDB): Promise<void> {
    await setDoc(doc(firestoreDb, 'transactions', tx.id), sanitizeForFirestore(tx));
  }

  async getUserTransactions(userId: string): Promise<TransactionDB[]> {
    try {
      const q = query(collection(firestoreDb, 'transactions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const txs = snap.docs.map((d) => d.data() as TransactionDB);
      return txs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error('Error fetching user transactions from Firestore', e);
      return [];
    }
  }

  async getGames(): Promise<GameDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'games'));
      if (snap.empty) {
        // Seed initial games
        for (const g of INITIAL_GAMES) {
          await setDoc(doc(firestoreDb, 'games', g.id), sanitizeForFirestore(g));
        }
        return INITIAL_GAMES;
      }
      return snap.docs.map((d) => d.data() as GameDB);
    } catch (e) {
      console.error('Error fetching games from Firestore', e);
      return INITIAL_GAMES;
    }
  }

  async getGameStats(userId: string): Promise<GameStatsDB | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'gameStats', userId));
      if (snap.exists()) {
        return snap.data() as GameStatsDB;
      }
      return null;
    } catch (e) {
      console.error('Error fetching game stats:', e);
      return null;
    }
  }

  async recordGameSession(userId: string, userName: string, score: number, lines: number, maxCombo: number): Promise<GameStatsDB> {
    const session: GameSessionDB = {
      id: 'sess_' + crypto.randomBytes(8).toString('hex'),
      userId,
      score,
      lines,
      maxCombo,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(firestoreDb, 'gameSessions', session.id), sanitizeForFirestore(session));

    let existingStats = await this.getGameStats(userId);
    const newHighScore = existingStats ? Math.max(existingStats.highScore, score) : score;
    const newGamesPlayed = (existingStats?.gamesPlayed || 0) + 1;
    const newLinesCleared = (existingStats?.linesCleared || 0) + lines;
    const newMaxCombo = existingStats ? Math.max(existingStats.maxCombo, maxCombo) : maxCombo;
    const newLevel = Math.floor(newHighScore / 1000) + 1;

    const updatedStats: GameStatsDB = {
      id: userId,
      userId,
      userName: userName || 'Jogador',
      highScore: newHighScore,
      gamesPlayed: newGamesPlayed,
      linesCleared: newLinesCleared,
      maxCombo: newMaxCombo,
      level: newLevel,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(firestoreDb, 'gameStats', userId), sanitizeForFirestore(updatedStats));
    return updatedStats;
  }

  async getRanking(): Promise<GameStatsDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'gameStats'));
      const list = snap.docs.map((d) => d.data() as GameStatsDB);
      return list.sort((a, b) => b.highScore - a.highScore);
    } catch (e) {
      console.error('Error fetching ranking:', e);
      return [];
    }
  }

  async checkCommissionExistsByTransactionId(transactionId: string): Promise<boolean> {
    try {
      const q = query(collection(firestoreDb, 'affiliateCommissions'), where('transactionId', '==', transactionId));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (e) {
      console.error('Error checking commission existence:', e);
      return false;
    }
  }

  async createAffiliateCommission(comm: AffiliateCommissionDB): Promise<void> {
    await setDoc(doc(firestoreDb, 'affiliateCommissions', comm.id), sanitizeForFirestore(comm));
  }

  async getCommissionsByAffiliateId(affiliateId: string): Promise<AffiliateCommissionDB[]> {
    try {
      const q = query(collection(firestoreDb, 'affiliateCommissions'), where('affiliateId', '==', affiliateId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as AffiliateCommissionDB);
    } catch (e) {
      console.error('Error fetching affiliate commissions:', e);
      return [];
    }
  }

  async getAllCommissions(): Promise<AffiliateCommissionDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'affiliateCommissions'));
      return snap.docs.map((d) => d.data() as AffiliateCommissionDB);
    } catch (e) {
      console.error('Error fetching all affiliate commissions:', e);
      return [];
    }
  }

  async getAllUsers(): Promise<UserDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'users'));
      return snap.docs.map((d) => d.data() as UserDB);
    } catch (e) {
      console.error('Error fetching all users:', e);
      return [];
    }
  }

  async getAllTransactions(): Promise<TransactionDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'transactions'));
      const list = snap.docs.map((d) => d.data() as TransactionDB);
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error('Error fetching all transactions:', e);
      return [];
    }
  }

  async getTransactionById(id: string): Promise<TransactionDB | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'transactions', id));
      if (snap.exists()) {
        return snap.data() as TransactionDB;
      }
      return null;
    } catch (e) {
      console.error('Error fetching transaction by id:', e);
      return null;
    }
  }

  async updateTransactionStatus(id: string, status: 'approved' | 'rejected' | 'pending'): Promise<void> {
    await updateDoc(doc(firestoreDb, 'transactions', id), { status });
  }

  async updateTransaction(id: string, data: Partial<TransactionDB>): Promise<void> {
    await updateDoc(doc(firestoreDb, 'transactions', id), sanitizeForFirestore(data));
  }

  async getAdmins(): Promise<UserDB[]> {
    try {
      const allUsers = await this.getAllUsers();
      return allUsers.filter(u => u.role === 'admin' || u.role === 'superadmin' || u.email.toLowerCase() === 'admin.eduh@gmail.com');
    } catch (e) {
      console.error('Error fetching admins:', e);
      return [];
    }
  }

  async updateUserRoleAndPermissions(
    userId: string,
    role: 'user' | 'admin' | 'superadmin',
    adminPermissions?: AdminPermissions,
    isBlocked?: boolean
  ): Promise<void> {
    const updateData: any = { role };
    if (adminPermissions !== undefined) {
      updateData.adminPermissions = adminPermissions;
    }
    if (isBlocked !== undefined) {
      updateData.isBlocked = isBlocked;
    }
    await updateDoc(doc(firestoreDb, 'users', userId), sanitizeForFirestore(updateData));
  }

  // --- GAME CONFIG & REAL-TIME ANALYTICS PERSISTENCE ---

  async getGameConfig(gameId: string = 'g_block_puzzle'): Promise<GameConfigDB> {
    const defaultCfg: GameConfigDB = {
      id: gameId,
      name: 'Block Puzzle iGaming',
      category: 'Estratégia & Habilidade',
      status: 'active',
      rtpPercent: 96.0,
      difficulty: 'easy',
      minBet: 1.0,
      maxBet: 500.0,
      totalWagered: 0,
      totalPayout: 0,
      ggr: 0,
      totalBetsCount: 0,
      houseEdgeMode: 'easy',
      maxMultiplier: 100.0,
      antiBailoutMode: false,
      heavyBlocksForce: false,
      dynamicRetention: true,
      streakLimiterMultiplier: 6.0,
      nearLossPressure: false,
      winStreakBrake: true,
      antiComboBlocker: false,
      highBetResistance: true,
      giantPieceFrequency: 25,
      instantLossOnTargetProfit: 0,
      tightenOnHighOccupancy: true,
      minCashoutMultiplier: 1.05,
      lineMultiplierStep: 0.40,
      initialMultiplier: 1.0,
      retentionAggressiveness: 'moderate',
      forceLossOnMaxMultiplier: true,
      consecutiveWinDecay: 0.05,
      gameSpeedPercent: 100,
      obstacleDensityPercent: 50,
      reactionWindowMs: 850,
      bonusFrequencyPercent: 20,
      comboWindowMs: 1200,
      mistakeTolerance: 1,
      difficultyRampPercent: 50,
      easyOpeningRounds: 3,
      extremeModeStartRound: 12,
      phaseDifficultyMultiplier: 1.25,
      configVersion: 1,
      updatedAt: new Date().toISOString(),
    };

    try {
      const snap = await getDoc(doc(firestoreDb, 'gameConfigs', gameId));
      if (snap.exists()) {
        const data = snap.data() as GameConfigDB;
        return {
          ...defaultCfg,
          ...data,
        };
      } else {
        // Save initial config
        await setDoc(doc(firestoreDb, 'gameConfigs', gameId), sanitizeForFirestore(defaultCfg));
        return defaultCfg;
      }
    } catch (e) {
      console.error('Error fetching game config from Firestore:', e);
      return defaultCfg;
    }
  }

  async saveGameConfig(config: GameConfigDB): Promise<void> {
    try {
      config.updatedAt = new Date().toISOString();
      await setDoc(doc(firestoreDb, 'gameConfigs', config.id), sanitizeForFirestore(config));
    } catch (e) {
      console.error('Error saving game config to Firestore:', e);
    }
  }

  async recordGameBet(bet: GameBetDB): Promise<void> {
    try {
      await setDoc(doc(firestoreDb, 'gameBets', bet.id), sanitizeForFirestore(bet));
    } catch (e) {
      console.error('Error recording game bet to Firestore:', e);
    }
  }

  async getGameBet(id: string): Promise<GameBetDB | null> {
    try {
      const snap = await getDoc(doc(firestoreDb, 'gameBets', id));
      return snap.exists() ? (snap.data() as GameBetDB) : null;
    } catch (e) {
      console.error('Error fetching game bet from Firestore:', e);
      return null;
    }
  }

  async startZumblaBet(userId: string, betAmount: number, tracking: { sessionId?: string; deviceId?: string; userAgent?: string; ipHash?: string } = {}): Promise<{ betId: string; balance: number; rtpPercent: number }> {
    const betId = 'bet_zumbla_' + crypto.randomBytes(10).toString('hex');
    const userRef = doc(firestoreDb, 'users', userId);
    const betRef = doc(firestoreDb, 'gameBets', betId);
    const configRef = doc(firestoreDb, 'gameConfigs', 'g_zumbla');

    return runTransaction(firestoreDb, async (transaction) => {
      const [userSnap, configSnap] = await Promise.all([transaction.get(userRef), transaction.get(configRef)]);
      if (!userSnap.exists()) throw new Error('Usuário não encontrado.');
      const user = userSnap.data() as UserDB;
      const isPromotional = Boolean(user.isInfluencer);
      const balance = isPromotional ? Number(user.promoBalance ?? 1000) : Number(user.balance || 0);
      if (balance < betAmount) throw new Error('Saldo insuficiente para iniciar o Zumbla.');
      const config = configSnap.exists() ? (configSnap.data() as GameConfigDB) : null;
      if (config?.status === 'inactive') throw new Error('O Zumbla está temporariamente indisponível.');

      const newBalance = Number((balance - betAmount).toFixed(2));
      const bet: GameBetDB = {
        id: betId,
        userId,
        userName: user.name || user.email,
        gameId: 'g_zumbla',
        betAmount,
        multiplier: 0,
        payoutAmount: 0,
        profitAmount: 0,
        status: 'active',
        difficulty: config?.difficulty || 'medium',
        rtpPercent: isPromotional ? 90 : (config?.rtpPercent || 96),
        isPromotional,
        affiliateId: user.affiliateId,
        sessionId: tracking.sessionId,
        deviceId: tracking.deviceId,
        userAgent: tracking.userAgent,
        ipHash: tracking.ipHash,
        eventCount: 0,
        createdAt: new Date().toISOString(),
      };
      const totalWagered = Number(((config?.totalWagered || 0) + betAmount).toFixed(2));
      const totalPayout = Number(config?.totalPayout || 0);

      transaction.update(userRef, isPromotional ? { promoBalance: newBalance } : { balance: newBalance });
      transaction.set(betRef, sanitizeForFirestore(bet));
      if (!isPromotional) transaction.set(configRef, sanitizeForFirestore({
        id: 'g_zumbla', name: 'Zumbla Win', category: 'Puzzle', status: 'active',
        rtpPercent: config?.rtpPercent || 96, difficulty: config?.difficulty || 'medium',
        minBet: 1, maxBet: 20, maxMultiplier: 5, houseEdgeMode: config?.houseEdgeMode || 'balanced',
        totalWagered, totalPayout, ggr: Number((totalWagered - totalPayout).toFixed(2)),
        totalBetsCount: (config?.totalBetsCount || 0) + 1, updatedAt: new Date().toISOString(),
      }), { merge: true });
      return { betId, balance: newBalance, rtpPercent: bet.rtpPercent };
    });
  }

  async settleZumblaBet(userId: string, betId: string, outcome: 'win' | 'loss', score: number): Promise<{ outcome: 'win' | 'loss'; balance: number; betAmount: number; payout: number; multiplier: number }> {
    const userRef = doc(firestoreDb, 'users', userId);
    const betRef = doc(firestoreDb, 'gameBets', betId);
    const configRef = doc(firestoreDb, 'gameConfigs', 'g_zumbla');
    const txRef = doc(firestoreDb, 'transactions', 'tx_zumbla_' + crypto.randomBytes(10).toString('hex'));

    return runTransaction(firestoreDb, async (transaction) => {
      const [userSnap, betSnap, configSnap] = await Promise.all([
        transaction.get(userRef), transaction.get(betRef), transaction.get(configRef),
      ]);
      if (!userSnap.exists() || !betSnap.exists()) throw new Error('Rodada não encontrada.');
      const user = userSnap.data() as UserDB;
      const bet = betSnap.data() as GameBetDB;
      if (bet.userId !== userId || bet.gameId !== 'g_zumbla') throw new Error('Rodada inválida.');
      if (bet.status !== 'active') throw new Error('Esta rodada já foi finalizada.');
      const safeScore = Math.max(0, Math.min(10_000_000, Math.floor(score || 0)));
      const resolvedOutcome: 'win' | 'loss' = bet.isPromotional ? (crypto.randomInt(100) < 90 ? 'win' : 'loss') : outcome;
      const multiplier = resolvedOutcome === 'win' ? (safeScore >= 3200 ? 5 : safeScore >= 2200 ? 3 : safeScore >= 1200 ? 2.5 : 2) : 0;
      const payout = Number((bet.betAmount * multiplier).toFixed(2));
      const sourceBalance = bet.isPromotional ? Number(user.promoBalance ?? 1000) : Number(user.balance || 0);
      const balance = Number((sourceBalance + payout).toFixed(2));
      const config = configSnap.exists() ? (configSnap.data() as GameConfigDB) : null;
      const totalWagered = Number(config?.totalWagered || bet.betAmount);
      const totalPayout = Number(((config?.totalPayout || 0) + payout).toFixed(2));

      transaction.update(userRef, bet.isPromotional ? { promoBalance: balance } : { balance });
      transaction.update(betRef, sanitizeForFirestore({
        status: resolvedOutcome === 'win' ? 'cashed_out' : 'lost', multiplier, payoutAmount: payout,
        profitAmount: Number((payout - bet.betAmount).toFixed(2)), score: safeScore,
        settledAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }));
      if (!bet.isPromotional) transaction.set(configRef, {
        totalPayout, ggr: Number((totalWagered - totalPayout).toFixed(2)), updatedAt: new Date().toISOString(),
      }, { merge: true });
      if (!bet.isPromotional) transaction.set(txRef, sanitizeForFirestore({
        id: txRef.id, userId, type: 'deposit', amount: payout, status: 'approved',
        paymentMethod: 'ZumblaWin', description: resolvedOutcome === 'win'
          ? `Prêmio Zumbla Win (${multiplier}x)` : `Rodada Zumbla encerrada sem prêmio`,
        createdAt: new Date().toISOString(),
      }));
      return { outcome: resolvedOutcome, balance, betAmount: bet.betAmount, payout, multiplier };
    });
  }

  async startGenDinoBet(
    userId: string,
    betAmount: number,
    tracking: { sessionId?: string; deviceId?: string; userAgent?: string; ipHash?: string } = {}
  ): Promise<{ betId: string; balance: number; coinValue: number }> {
    const betId = 'bet_gen_dino_' + crypto.randomBytes(10).toString('hex');
    const userRef = doc(firestoreDb, 'users', userId);
    const betRef = doc(firestoreDb, 'gameBets', betId);
    const configRef = doc(firestoreDb, 'gameConfigs', 'g_gen_dino');

    return runTransaction(firestoreDb, async (transaction) => {
      const [userSnap, configSnap] = await Promise.all([transaction.get(userRef), transaction.get(configRef)]);
      if (!userSnap.exists()) throw new Error('Usuário não encontrado.');
      const user = userSnap.data() as UserDB;
      const config = configSnap.exists() ? (configSnap.data() as GameConfigDB) : null;
      if (config?.status === 'inactive') throw new Error('O GEN DINO está temporariamente indisponível.');
      const isPromotional = Boolean(user.isInfluencer);
      const sourceBalance = isPromotional ? Number(user.promoBalance ?? 1000) : Number(user.balance || 0);
      if (sourceBalance < betAmount) throw new Error('Saldo insuficiente para iniciar o GEN DINO.');

      const newBalance = Number((sourceBalance - betAmount).toFixed(2));
      const now = new Date().toISOString();
      const bet: GameBetDB = {
        id: betId,
        userId,
        userName: user.name || user.email,
        gameId: 'g_gen_dino',
        betAmount,
        multiplier: 0,
        payoutAmount: 0,
        profitAmount: 0,
        status: 'active',
        difficulty: config?.difficulty || 'medium',
        rtpPercent: isPromotional ? 90 : (config?.rtpPercent || 96),
        isPromotional,
        affiliateId: user.affiliateId,
        sessionId: tracking.sessionId,
        deviceId: tracking.deviceId,
        userAgent: tracking.userAgent,
        ipHash: tracking.ipHash,
        eventCount: 0,
        createdAt: now,
      };
      const totalWagered = Number(((config?.totalWagered || 0) + betAmount).toFixed(2));
      const totalPayout = Number(config?.totalPayout || 0);

      transaction.update(userRef, isPromotional ? { promoBalance: newBalance } : { balance: newBalance });
      transaction.set(betRef, sanitizeForFirestore(bet));
      if (!isPromotional) transaction.set(configRef, sanitizeForFirestore({
        id: 'g_gen_dino', name: 'GEN DINO', category: 'Arcade', status: 'active',
        rtpPercent: config?.rtpPercent || 96, difficulty: config?.difficulty || 'medium',
        minBet: 1, maxBet: 100, maxMultiplier: 100, houseEdgeMode: config?.houseEdgeMode || 'balanced',
        totalWagered, totalPayout, ggr: Number((totalWagered - totalPayout).toFixed(2)),
        totalBetsCount: (config?.totalBetsCount || 0) + 1, updatedAt: now,
      }), { merge: true });

      return { betId, balance: newBalance, coinValue: 1 };
    });
  }

  async settleGenDinoBet(
    userId: string,
    betId: string,
    outcome: 'cashout' | 'loss',
    coins: number,
    score: number
  ): Promise<{ outcome: 'cashout' | 'loss'; balance: number; betAmount: number; payout: number; coins: number }> {
    const userRef = doc(firestoreDb, 'users', userId);
    const betRef = doc(firestoreDb, 'gameBets', betId);
    const configRef = doc(firestoreDb, 'gameConfigs', 'g_gen_dino');
    const txRef = doc(firestoreDb, 'transactions', 'tx_gen_dino_' + crypto.randomBytes(10).toString('hex'));

    return runTransaction(firestoreDb, async (transaction) => {
      const [userSnap, betSnap, configSnap] = await Promise.all([
        transaction.get(userRef), transaction.get(betRef), transaction.get(configRef),
      ]);
      if (!userSnap.exists() || !betSnap.exists()) throw new Error('Rodada não encontrada.');
      const user = userSnap.data() as UserDB;
      const bet = betSnap.data() as GameBetDB;
      if (bet.userId !== userId || bet.gameId !== 'g_gen_dino') throw new Error('Rodada inválida.');
      if (bet.status !== 'active') throw new Error('Esta rodada já foi finalizada.');

      const elapsedMs = Math.max(0, Date.now() - Date.parse(bet.createdAt));
      const timeValidatedMaximum = Math.min(250, Math.floor(elapsedMs / 450) + 2);
      const resolvedOutcome: 'cashout' | 'loss' = bet.isPromotional ? (crypto.randomInt(100) < 90 ? 'cashout' : 'loss') : outcome;
      const safeCoins = resolvedOutcome === 'cashout'
        ? Math.max(0, Math.min(timeValidatedMaximum, Math.floor(Number(coins || 0))))
        : 0;
      const payout = bet.isPromotional && resolvedOutcome === 'cashout'
        ? Number(Math.max(bet.betAmount * 2, safeCoins).toFixed(2))
        : Number(safeCoins.toFixed(2));
      const sourceBalance = bet.isPromotional ? Number(user.promoBalance ?? 1000) : Number(user.balance || 0);
      const balance = Number((sourceBalance + payout).toFixed(2));
      const safeScore = Math.max(0, Math.min(10_000_000, Math.floor(Number(score || 0))));
      const config = configSnap.exists() ? (configSnap.data() as GameConfigDB) : null;
      const totalWagered = Number(config?.totalWagered || bet.betAmount);
      const totalPayout = Number(((config?.totalPayout || 0) + payout).toFixed(2));
      const now = new Date().toISOString();

      transaction.update(userRef, bet.isPromotional ? { promoBalance: balance } : { balance });
      transaction.update(betRef, sanitizeForFirestore({
        status: resolvedOutcome === 'cashout' ? 'cashed_out' : 'lost',
        multiplier: bet.betAmount > 0 ? Number((payout / bet.betAmount).toFixed(2)) : 0,
        payoutAmount: payout,
        profitAmount: Number((payout - bet.betAmount).toFixed(2)),
        score: safeScore,
        durationMs: elapsedMs,
        eventCount: safeCoins,
        settledAt: now,
        updatedAt: now,
      }));
      if (!bet.isPromotional) transaction.set(configRef, {
        totalPayout,
        ggr: Number((totalWagered - totalPayout).toFixed(2)),
        updatedAt: now,
      }, { merge: true });
      if (!bet.isPromotional) transaction.set(txRef, sanitizeForFirestore({
        id: txRef.id,
        userId,
        type: 'deposit',
        amount: payout,
        status: 'approved',
        paymentMethod: 'GenDino',
        description: resolvedOutcome === 'cashout'
          ? `Prêmio GEN DINO (${safeCoins} moeda${safeCoins === 1 ? '' : 's'})`
          : 'Rodada GEN DINO encerrada sem prêmio',
        createdAt: now,
      }));

      return { outcome: resolvedOutcome, balance, betAmount: bet.betAmount, payout, coins: safeCoins };
    });
  }

  async recordZumblaEvent(userId: string, betId: string, event: { type: string; score: number; elapsedMs: number; sequence: number }): Promise<void> {
    const bet = await this.getGameBet(betId);
    if (!bet || bet.userId !== userId || bet.gameId !== 'g_zumbla') throw new Error('Rodada inválida.');
    const eventId = `${betId}_${String(event.sequence).padStart(6, '0')}`;
    await setDoc(doc(firestoreDb, 'gameEvents', eventId), sanitizeForFirestore({
      id: eventId, betId, userId, gameId: 'g_zumbla', type: event.type,
      score: event.score, elapsedMs: event.elapsedMs, sequence: event.sequence,
      createdAt: new Date().toISOString(),
    }));
    await updateDoc(doc(firestoreDb, 'gameBets', betId), sanitizeForFirestore({
      score: event.score, durationMs: event.elapsedMs,
      eventCount: Math.max(Number(bet.eventCount || 0), event.sequence), updatedAt: new Date().toISOString(),
    }));
  }

  async updateGameBet(id: string, fields: Partial<GameBetDB>): Promise<void> {
    try {
      const updateData = {
        ...fields,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(firestoreDb, 'gameBets', id), sanitizeForFirestore(updateData));
    } catch (e) {
      console.error('Error updating game bet in Firestore:', e);
    }
  }

  async getAllGameBets(limitCount: number = 100): Promise<GameBetDB[]> {
    try {
      const snap = await getDocs(collection(firestoreDb, 'gameBets'));
      const list = snap.docs.map((d) => d.data() as GameBetDB);
      return list
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limitCount);
    } catch (e) {
      console.error('Error fetching game bets from Firestore:', e);
      return [];
    }
  }

  async getGameLiveMetrics(gameId: string = 'g_block_puzzle'): Promise<{
    config: GameConfigDB;
    totalWagered: number;
    totalPayout: number;
    ggr: number;
    totalBetsCount: number;
    totalWinsCount: number;
    totalLossesCount: number;
    effectiveRtp: number;
    effectiveHouseEdge: number;
    recentBets: GameBetDB[];
  }> {
    const config = await this.getGameConfig(gameId);
    const allBets = (await this.getAllGameBets(200)).filter((bet) => bet.gameId === gameId && !bet.isPromotional);

    let wagered = 0;
    let payout = 0;
    let winsCount = 0;
    let lossesCount = 0;

    for (const b of allBets) {
      const bAmount = typeof b.betAmount === 'number' ? b.betAmount : 0;
      const pAmount = typeof b.payoutAmount === 'number' ? b.payoutAmount : 0;
      wagered += bAmount;
      payout += pAmount;

      if (b.status === 'cashed_out' && pAmount > 0) {
        winsCount++;
      } else if (b.status === 'lost') {
        lossesCount++;
      }
    }

    // Combine with persistent accumulators if present
    const totalWagered = parseFloat((Math.max(wagered, config.totalWagered || 0)).toFixed(2));
    const totalPayout = parseFloat((Math.max(payout, config.totalPayout || 0)).toFixed(2));
    const ggr = parseFloat((totalWagered - totalPayout).toFixed(2));
    const totalBetsCount = Math.max(allBets.length, config.totalBetsCount || 0);

    const effectiveRtp = totalWagered > 0 ? parseFloat(((totalPayout / totalWagered) * 100).toFixed(1)) : config.rtpPercent;
    const effectiveHouseEdge = parseFloat((100 - effectiveRtp).toFixed(1));

    return {
      config,
      totalWagered,
      totalPayout,
      ggr,
      totalBetsCount,
      totalWinsCount: winsCount,
      totalLossesCount: lossesCount,
      effectiveRtp,
      effectiveHouseEdge,
      recentBets: allBets.slice(0, 25),
    };
  }
}

export const dbService = new FirestoreDB();
