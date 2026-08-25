import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import webpush from 'web-push';
import { createServer as createViteServer } from 'vite';
import { dbService, UserDB, AffiliateDB, ReferralDB, TransactionDB, GameBetDB, GameConfigDB } from './server/db.js';
import {
  securityHeadersMiddleware,
  generalRateLimiterMiddleware,
  authRateLimiterMiddleware,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  isIdentifierBlocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  verifyHmacSignature,
  logSecurityEvent,
  sanitizeString,
  isValidEmail,
  isPositiveNumber
} from './server/security.js';

// VAPID Keys setup for iOS / Web Push Notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BExySgr_kuwjUHgn-Tyqyxwc81atqVnbdbzpz4i1vT2bbW9MRPYbY7vI2hVQGZBzrp9MTUbLIMFFVyTPLu9d1OQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'WjwvsN2mq2CSEtxMk6wx-6uDgchsFBVO0ngc92g5gc8';

try {
  webpush.setVapidDetails(
    'mailto:suporte@paygateway.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (e) {
  console.error('[WebPush] Error configuring VAPID:', e);
}

interface PushSubItem {
  subscription: webpush.PushSubscription;
  userId?: string;
  createdAt: string;
}

const pushSubscriptions = new Map<string, PushSubItem>();

async function sendPushNotification(targetUserId: string | null, payload: { title: string; body: string; url?: string }) {
  const payloadStr = JSON.stringify(payload);
  const promises: Promise<any>[] = [];

  for (const [endpoint, data] of pushSubscriptions.entries()) {
    if (!targetUserId || targetUserId === 'all' || data.userId === targetUserId) {
      promises.push(
        webpush.sendNotification(data.subscription, payloadStr)
          .catch((err: any) => {
            console.warn(`[WebPush] Push error for ${endpoint.substring(0, 35)}...:`, err.statusCode || err.message);
            if (err.statusCode === 410 || err.statusCode === 404) {
              pushSubscriptions.delete(endpoint);
            }
          })
      );
    }
  }

  await Promise.all(promises);
}

// Simple in-memory session token store mapping token -> userId
const sessions = new Map<string, string>();

interface AuthRequest extends Request {
  userId?: string;
  user?: UserDB;
}

async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado. Token de sessão ausente.' });
    }

    const token = authHeader.split(' ')[1];
    let session = getSession(token);
    let userId = session?.userId || sessions.get(token);

    if (!userId && token.startsWith('tok_usr_')) {
      const parts = token.split('_');
      if (parts.length >= 3) {
        const candidateId = `${parts[1]}_${parts[2]}`;
        const foundUser = await dbService.getUserById(candidateId);
        if (foundUser) {
          userId = foundUser.id;
          sessions.set(token, userId);
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Sessão expirada ou inválida. Por favor faça login novamente.' });
    }

    const user = await dbService.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    req.userId = userId;
    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ error: 'Erro de autenticação no servidor.' });
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ verify: (req, _res, buffer) => { (req as any).rawBody = buffer.toString('utf8'); } }));
  app.use(securityHeadersMiddleware);
  app.use(generalRateLimiterMiddleware);
  app.use('/api/auth', authRateLimiterMiddleware);

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', firebase: true, time: new Date().toISOString() });
  });

  // WEB PUSH ROUTES FOR IOS / ANDROID PWA NOTIFICATIONS (Background / Closed App)
  app.get('/api/push/vapid-public-key', (_req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  app.post('/api/push/subscribe', (req: AuthRequest, res) => {
    try {
      const { subscription, userId } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Subscription inválida' });
      }

      // Identify user from auth token if present
      const authHeader = req.headers.authorization;
      let targetUserId = userId || 'guest';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const sessionUserId = sessions.get(token);
        if (sessionUserId) {
          targetUserId = sessionUserId;
        }
      }

      pushSubscriptions.set(subscription.endpoint, {
        subscription,
        userId: targetUserId,
        createdAt: new Date().toISOString()
      });

      console.log(`[WebPush] Inscrição Push registrada com sucesso para userId: ${targetUserId} (Total ativas: ${pushSubscriptions.size})`);
      res.json({ success: true, message: 'Inscrição Push salva com sucesso' });
    } catch (err: any) {
      console.error('[WebPush] Error saving push subscription:', err);
      res.status(500).json({ error: 'Erro ao salvar inscrição Push' });
    }
  });

  app.post('/api/push/send-test', async (req: AuthRequest, res) => {
    try {
      const { delayMs, title, body } = req.body;
      
      const authHeader = req.headers.authorization;
      let targetUserId = 'all';
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const sessionUserId = sessions.get(token);
        if (sessionUserId) targetUserId = sessionUserId;
      }

      const trigger = async () => {
        await sendPushNotification(targetUserId, {
          title: title || 'Você vendeu! 💰',
          body: body || 'Sua comissão de R$ 37,50 foi creditada no seu saldo!',
          url: '/'
        });
      };

      if (delayMs && delayMs > 0) {
        setTimeout(trigger, delayMs);
      } else {
        await trigger();
      }

      res.json({ success: true, message: 'Push de teste disparado com sucesso!' });
    } catch (err: any) {
      console.error('[WebPush] Error sending test push:', err);
      res.status(500).json({ error: 'Erro ao disparar teste push' });
    }
  });

  // AUTH: REGISTER
  app.post('/api/auth/register', async (req, res) => {
    try {
      const name = sanitizeString(req.body.name, 100);
      const email = sanitizeString(req.body.email, 150).toLowerCase();
      const phone = sanitizeString(req.body.phone, 30);
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const refCode = sanitizeString(req.body.refCode, 50);
      const requestedGame = sanitizeString(req.body.acquisitionGame, 40);
      const acquisitionGame = ['g_block_puzzle', 'g_zumbla', 'g_gen_dino'].includes(requestedGame) ? requestedGame : undefined;
      const acquisitionDomain = sanitizeString(req.body.acquisitionDomain || req.headers.host, 120).toLowerCase();

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Formato de e-mail inválido.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
      }

      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        logSecurityEvent('REGISTER_FAILED_DUPLICATE_EMAIL', { email, ip: req.ip });
        return res.status(400).json({ error: 'E-mail já cadastrado no sistema.' });
      }

      const userId = 'usr_' + crypto.randomBytes(12).toString('hex');
      const passwordHash = dbService.hashPassword(password);
      const userReferralCode = dbService.generateReferralCode();
      const createdAt = new Date().toISOString();

      // Check if referred by an affiliate (by affiliate table or user referralCode or user ID)
      let referringAffiliateId: string | undefined = undefined;
      let matchedRefCode: string | undefined = undefined;

      if (refCode) {
        const cleanRef = refCode.trim().toUpperCase();
        matchedRefCode = cleanRef;
        let affiliate = await dbService.getAffiliateByCode(cleanRef);
        if (affiliate) {
          referringAffiliateId = affiliate.id;
        } else {
          // Check if it's a user's referral code
          const sponsorUser = await dbService.getUserByReferralCode(cleanRef);
          if (sponsorUser) {
            let sponsorAff = await dbService.getAffiliateByUserId(sponsorUser.id);
            if (!sponsorAff) {
              const newAffId = 'aff_' + crypto.randomBytes(8).toString('hex');
              sponsorAff = {
                id: newAffId,
                userId: sponsorUser.id,
                referralCode: sponsorUser.referralCode || cleanRef,
                status: 'active',
                commissionTotal: 0,
                affiliateBalance: 0,
                cpaAmount: 0,
                revSharePercent: 70.0,
                createdAt: new Date().toISOString()
              };
              await dbService.createAffiliate(sponsorAff);
            }
            referringAffiliateId = sponsorAff.id;
          }
        }
      }

      // Check if registration happened on goalliancehub domain (or isAffiliate flag sent)
      const host = (req.headers.host || req.hostname || '').toLowerCase();
      const origin = (req.headers.origin || req.headers.referer || '').toLowerCase();
      const isAffiliatePortal = host.includes('goalliancehub') || origin.includes('goalliancehub') || req.body?.isAffiliate === true;

      // Create User
      const newUser: UserDB = {
        id: userId,
        name,
        email,
        phone,
        passwordHash,
        ...(referringAffiliateId ? { affiliateId: referringAffiliateId } : {}),
        referralCode: userReferralCode,
        balance: 0.0,
        createdAt,
        role: isAffiliatePortal ? 'affiliate' : 'user',
        ...(acquisitionGame ? { acquisitionGame } : {}),
        ...(acquisitionDomain ? { acquisitionDomain } : {}),
      };

      await dbService.createUser(newUser);

      // If registered through goalliancehub.com, automatically create the active affiliate profile
      if (isAffiliatePortal) {
        const affRecord: import('./server/db.js').AffiliateDB = {
          id: 'aff_' + crypto.randomBytes(12).toString('hex'),
          userId: newUser.id,
          referralCode: userReferralCode,
          status: 'active',
          commissionTotal: 0,
          affiliateBalance: 0,
          cpaAmount: 0,
          revSharePercent: 70.0,
          createdAt,
        };
        await dbService.createAffiliate(affRecord);
      }

      // If referred by someone, record referral
      if (referringAffiliateId) {
        const newReferral: ReferralDB = {
          id: 'ref_' + crypto.randomBytes(12).toString('hex'),
          affiliateId: referringAffiliateId,
          referredUserId: userId,
          referralCode: matchedRefCode || (refCode ? refCode.trim().toUpperCase() : userReferralCode),
          createdAt,
          ...(acquisitionGame ? { acquisitionGame } : {}),
          ...(acquisitionDomain ? { acquisitionDomain } : {}),
        };
        await dbService.createReferral(newReferral);
      }

      // Generate Secure Session Token
      const token = createSession(userId, req);
      sessions.set(token, userId);

      logSecurityEvent('USER_REGISTERED', { userId, email, ip: req.ip });

      const userObj = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        affiliateId: newUser.affiliateId || null,
        referralCode: newUser.referralCode,
        balance: newUser.balance,
        createdAt: newUser.createdAt,
      };

      res.json({ user: userObj, token });
    } catch (err: any) {
      console.error('Register error:', err);
      const detail = err?.message || 'Erro ao cadastrar usuário.';
      res.status(500).json({ error: `Erro no cadastro: ${detail}` });
    }
  });

  // AUTH: LOGIN
  app.post('/api/auth/login', async (req, res) => {
    try {
      const email = sanitizeString(req.body.email, 150).toLowerCase();
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      // Check brute-force lockouts
      const lockStatus = isIdentifierBlocked(email);
      if (lockStatus.blocked) {
        logSecurityEvent('LOGIN_ATTEMPT_BLOCKED', { email, ip: req.ip });
        return res.status(429).json({
          error: `Conta temporariamente bloqueada por muitas tentativas incorretas. Tente novamente em ${lockStatus.blockTimeSec} segundos.`
        });
      }

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        const failedResult = recordFailedLogin(email);
        logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', { email, ip: req.ip });
        return res.status(400).json({
          error: failedResult.blocked
            ? 'Conta temporariamente bloqueada devido a múltiplas tentativas incorretas.'
            : 'Credenciais inválidas ou usuário não encontrado.'
        });
      }

      const authCheck = verifyPassword(password, user.passwordHash);
      if (!authCheck.valid) {
        const failedResult = recordFailedLogin(email);
        logSecurityEvent('LOGIN_FAILED_WRONG_PASSWORD', { email, userId: user.id, ip: req.ip });
        return res.status(400).json({
          error: failedResult.blocked
            ? 'Conta temporariamente bloqueada devido a múltiplas tentativas incorretas.'
            : 'Senha incorreta. Verifique suas credenciais.'
        });
      }

      recordSuccessfulLogin(email);

      // Rehash password if legacy format
      if (authCheck.needsRehash) {
        const newHash = dbService.hashPassword(password);
        await dbService.updateUserFields(user.id, { passwordHash: newHash });
        logSecurityEvent('PASSWORD_REHASHED_UPGRADED', { userId: user.id });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: 'Sua conta foi bloqueada por um administrador.' });
      }

      const isSuperAdminEmail = user.email.toLowerCase() === 'admin.eduh@gmail.com';
      if (isSuperAdminEmail && user.role !== 'superadmin') {
        user.role = 'superadmin';
        await dbService.updateUserRoleAndPermissions(user.id, 'superadmin', {
          canManageUsers: true,
          canManageBalances: true,
          canApproveWithdrawals: true,
          canManageAdmins: true,
          canViewMetrics: true,
          canManageGames: true
        });
      }

      const token = createSession(user.id, req);
      sessions.set(token, user.id);

      logSecurityEvent('USER_LOGIN_SUCCESS', { userId: user.id, email: user.email, ip: req.ip });

      const userObj = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        affiliateId: user.affiliateId || null,
        referralCode: user.referralCode,
        balance: user.isInfluencer ? Number(user.promoBalance ?? 1000) : user.balance,
        realBalance: user.balance,
        promoBalance: user.isInfluencer ? Number(user.promoBalance ?? 1000) : undefined,
        role: user.role || (isSuperAdminEmail ? 'superadmin' : 'user'),
        isBlocked: !!user.isBlocked,
        adminPermissions: user.adminPermissions || (isSuperAdminEmail ? {
          canManageUsers: true,
          canManageBalances: true,
          canApproveWithdrawals: true,
          canManageAdmins: true,
          canViewMetrics: true,
          canManageGames: true
        } : {}),
        createdAt: user.createdAt,
      };

      res.json({ user: userObj, token });
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err?.message || 'Erro ao realizar login.';
      res.status(500).json({ error: `Erro no login: ${detail}` });
    }
  });

  // AUTH: ME
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const isSuperAdminEmail = user.email.toLowerCase() === 'admin.eduh@gmail.com';
    
    if (isSuperAdminEmail && user.role !== 'superadmin') {
      user.role = 'superadmin';
      await dbService.updateUserRoleAndPermissions(user.id, 'superadmin', {
        canManageUsers: true,
        canManageBalances: true,
        canApproveWithdrawals: true,
        canManageAdmins: true,
        canViewMetrics: true,
        canManageGames: true
      });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      affiliateId: user.affiliateId,
      referralCode: user.referralCode,
      balance: user.isInfluencer ? Number(user.promoBalance ?? 1000) : user.balance,
      realBalance: user.balance,
      promoBalance: user.isInfluencer ? Number(user.promoBalance ?? 1000) : undefined,
      minWithdraw: user.minWithdraw ?? 100,
      isInfluencer: !!user.isInfluencer,
      cpaKillerAllowed: !!user.cpaKillerAllowed,
      role: user.role || (isSuperAdminEmail ? 'superadmin' : 'user'),
      isBlocked: !!user.isBlocked,
      adminPermissions: user.adminPermissions || (isSuperAdminEmail ? {
        canManageUsers: true,
        canManageBalances: true,
        canApproveWithdrawals: true,
        canManageAdmins: true,
        canViewMetrics: true,
        canManageGames: true
      } : {}),
      createdAt: user.createdAt,
    });
  });

  // --- ADMIN MIDDLEWARE ---
  async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso restrito ao Painel Administrativo. Token ausente.' });
      }

      const token = authHeader.split(' ')[1];
      let session = getSession(token);
      let userId = session?.userId || sessions.get(token);

      if (!userId) {
        return res.status(401).json({ error: 'Sessão expirada. Por favor faça login novamente.' });
      }

      const user = await dbService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (user.isBlocked) {
        return res.status(403).json({ error: 'Sua conta foi bloqueada por um administrador.' });
      }

      const isSuperAdmin = user.email.toLowerCase() === 'admin.eduh@gmail.com';
      const isAdmin = user.role === 'admin' || user.role === 'superadmin' || isSuperAdmin;

      if (!isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores possuem autorização.' });
      }

      if (isSuperAdmin && user.role !== 'superadmin') {
        user.role = 'superadmin';
        await dbService.updateUserRoleAndPermissions(user.id, 'superadmin', {
          canManageUsers: true,
          canManageBalances: true,
          canApproveWithdrawals: true,
          canManageAdmins: true,
          canViewMetrics: true,
          canManageGames: true
        });
      }

      req.userId = user.id;
      req.user = user;
      next();
    } catch (err: any) {
      console.error('[requireAdmin middleware error]', err);
      res.status(500).json({ error: 'Erro interno na validação de permissões administrativas.' });
    }
  }

  function checkAdminPermission(req: AuthRequest, perm: keyof import('./server/db.js').AdminPermissions): boolean {
    if (!req.user) return false;
    if (req.user.email.toLowerCase() === 'admin.eduh@gmail.com' || req.user.role === 'superadmin') {
      return true;
    }
    return !!(req.user.adminPermissions && req.user.adminPermissions[perm]);
  }

  // --- ADMIN ENDPOINTS ---

  // GET /api/admin/metrics
  app.get('/api/admin/metrics', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canViewMetrics')) {
        return res.status(403).json({ error: 'Sem permissão para visualizar métricas do sistema.' });
      }

      const allUsers = await dbService.getAllUsers();
      const allTx = await dbService.getAllTransactions();
      const allAffiliates = await dbService.getAllAffiliates();
      const influencerIds = new Set(allUsers.filter(u => u.isInfluencer).map(u => u.id));
      const operationalUsers = allUsers.filter(u => !u.isInfluencer);
      const operationalTx = allTx.filter(t => !influencerIds.has(t.userId));
      const operationalAffiliates = allAffiliates.filter(a => !influencerIds.has(a.userId));

      const totalUsers = operationalUsers.length;
      const totalBalance = operationalUsers.reduce((acc, u) => acc + (u.balance || 0), 0);
      
      const deposits = operationalTx.filter(t => t.type === 'deposit' && t.status === 'approved');
      const totalDepositsAmount = deposits.reduce((acc, t) => acc + t.amount, 0);

      const withdrawals = operationalTx.filter(t => t.type === 'withdrawal');
      const approvedWithdrawalsAmount = withdrawals.filter(t => t.status === 'approved').reduce((acc, t) => acc + t.amount, 0);
      const pendingWithdrawals = withdrawals.filter(t => t.status === 'pending');
      const pendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, t) => acc + t.amount, 0);

      const games = await dbService.getGames();
      const gameMetrics = await Promise.all([
        dbService.getGameLiveMetrics('g_block_puzzle').catch(() => ({ totalWagered: 0, totalPayout: 0, ggr: 0 })),
        dbService.getGameLiveMetrics('g_zumbla').catch(() => ({ totalWagered: 0, totalPayout: 0, ggr: 0 })),
      ]);
      const gameGgr = gameMetrics.reduce((sum, item) => sum + (item.ggr || 0), 0);
      const totalWagered = gameMetrics.reduce((sum, item) => sum + (item.totalWagered || 0), 0);
      const totalPayout = gameMetrics.reduce((sum, item) => sum + (item.totalPayout || 0), 0);

      const totalAffiliateBalance = operationalAffiliates.reduce((acc, a) => acc + (a.affiliateBalance || 0), 0);
      const totalAffiliateCommissionsPaid = operationalAffiliates.reduce((acc, a) => acc + (a.commissionTotal || 0), 0);

      // Calculation of net profit & platform profit margin
      const netProfit = (totalDepositsAmount + gameGgr) - approvedWithdrawalsAmount;
      const grossInflow = totalDepositsAmount + gameGgr;
      const profitMarginPercent = grossInflow > 0 ? (netProfit / grossInflow) * 100 : 0;
      const totalLiabilities = totalBalance + totalAffiliateBalance;

      // Dates calculation for today and yesterday
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfYesterday = startOfToday - (24 * 60 * 60 * 1000);

      const parseTs = (val: any): number => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const parsed = new Date(val).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };

      const todayDeposits = deposits.filter(t => parseTs(t.createdAt) >= startOfToday);
      const todaySalesAmount = todayDeposits.reduce((acc, t) => acc + t.amount, 0);

      const yesterdayDeposits = deposits.filter(t => parseTs(t.createdAt) >= startOfYesterday && parseTs(t.createdAt) < startOfToday);
      const yesterdaySalesAmount = yesterdayDeposits.reduce((acc, t) => acc + t.amount, 0);

      let todaySalesPercentChange = 0;
      if (yesterdaySalesAmount > 0) {
        todaySalesPercentChange = ((todaySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100;
      } else if (todaySalesAmount > 0) {
        todaySalesPercentChange = 100;
      }

      const newUsersToday = allUsers.filter(u => parseTs(u.createdAt) >= startOfToday).length;

      // Build 7-day chart data real calculations
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfToday - (i * 24 * 60 * 60 * 1000));
        const dayStart = d.getTime();
        const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;
        const dayLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        const dayDeposits = deposits
          .filter(t => parseTs(t.createdAt) >= dayStart && parseTs(t.createdAt) <= dayEnd)
          .reduce((acc, t) => acc + t.amount, 0);

        const dayWithdrawals = withdrawals
          .filter(t => t.status === 'approved' && parseTs(t.createdAt) >= dayStart && parseTs(t.createdAt) <= dayEnd)
          .reduce((acc, t) => acc + t.amount, 0);

        chartData.push({
          date: dayLabel,
          deposits: dayDeposits,
          withdrawals: dayWithdrawals,
          netBalance: dayDeposits - dayWithdrawals
        });
      }

      // Build recent activities list from real database events
      const activities: Array<{
        id: string;
        type: 'deposit' | 'withdrawal' | 'user_registered' | 'game_ended';
        title: string;
        userName: string;
        amount: number | null;
        createdAt: number;
      }> = [];

      for (const t of allTx.slice(-15)) {
        const userObj = allUsers.find(u => u.id === t.userId);
        const uName = userObj ? (userObj.name || userObj.email) : 'Usuário';
        
        let title = 'Movimentação';
        if (t.type === 'deposit') {
          title = t.status === 'approved' ? 'Depósito aprovado' : 'Depósito em processamento';
        } else if (t.type === 'withdrawal') {
          title = t.status === 'approved' ? 'Saque PIX processado' : 'Saque PIX solicitado';
        }

        activities.push({
          id: t.id,
          type: t.type === 'deposit' ? 'deposit' : 'withdrawal',
          title,
          userName: uName,
          amount: t.amount,
          createdAt: parseTs(t.createdAt)
        });
      }

      for (const u of allUsers.slice(-10)) {
        activities.push({
          id: `u_${u.id}`,
          type: 'user_registered',
          title: 'Novo usuário cadastrado',
          userName: u.name || u.email,
          amount: null,
          createdAt: parseTs(u.createdAt) || Date.now()
        });
      }

      activities.sort((a, b) => b.createdAt - a.createdAt);

      const formatTimeAgo = (timeMs: number) => {
        const diffSec = Math.floor((Date.now() - timeMs) / 1000);
        if (diffSec < 60) return 'Agora mesmo';
        if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
        if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)} h`;
        const d = new Date(timeMs);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };

      const recentActivities = activities.slice(0, 6).map(act => ({
        id: act.id,
        type: act.type,
        title: act.title,
        userName: act.userName,
        amount: act.amount,
        timeAgo: formatTimeAgo(act.createdAt)
      }));

      const totalReferredUsers = allUsers.filter(u => !!u.affiliateId).length;
      const totalOrganicUsers = allUsers.length - totalReferredUsers;

      res.json({
        metrics: {
          totalUsers,
          totalBalance,
          totalDepositsAmount,
          totalDepositsCount: deposits.length,
          approvedWithdrawalsAmount,
          pendingWithdrawalsCount: pendingWithdrawals.length,
          pendingWithdrawalsAmount,
          activeGamesCount: games.filter(g => g.status === 'active').length,
          totalGamesCount: games.length,
          gameGgr,
          totalWagered,
          totalPayout,
          totalAffiliateBalance,
          totalAffiliateCommissionsPaid,
          netProfit,
          profitMarginPercent,
          totalLiabilities,
          todaySalesAmount,
          todaySalesPercentChange,
          newUsersToday,
          totalReferredUsers,
          totalOrganicUsers,
          chartData,
          recentActivities
        }
      });
    } catch (err: any) {
      console.error('Error fetching admin metrics:', err);
      res.status(500).json({ error: 'Erro ao carregar métricas.' });
    }
  });

  // GET /api/admin/users
  app.get('/api/admin/users', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageUsers') && !checkAdminPermission(req, 'canManageBalances')) {
        return res.status(403).json({ error: 'Sem permissão para listar usuários.' });
      }

      const allUsers = await dbService.getAllUsers();
      const allAffiliates = await dbService.getAllAffiliates();
      const allReferrals = await dbService.getAllReferrals();
      const allTransactions = await dbService.getAllTransactions();

      const userMap = new Map(allUsers.map(u => [u.id, u]));
      const affiliateByUserId = new Map(allAffiliates.map(a => [a.userId, a]));
      const affiliateById = new Map(allAffiliates.map(a => [a.id, a]));
      const affiliateByCode = new Map(allAffiliates.map(a => [a.referralCode.toUpperCase(), a]));

      // Map referrals by referredUserId
      const referralByReferredUserId = new Map<string, typeof allReferrals[0]>();
      const referralsByAffiliateId = new Map<string, typeof allReferrals>();
      for (const ref of allReferrals) {
        referralByReferredUserId.set(ref.referredUserId, ref);
        const list = referralsByAffiliateId.get(ref.affiliateId) || [];
        list.push(ref);
        referralsByAffiliateId.set(ref.affiliateId, list);
      }

      // Map deposits sum by userId
      const depositsByUserId = new Map<string, number>();
      for (const tx of allTransactions) {
        if (tx.type === 'deposit' && tx.status === 'approved') {
          const prev = depositsByUserId.get(tx.userId) || 0;
          depositsByUserId.set(tx.userId, prev + tx.amount);
        }
      }

      const mapped = await Promise.all(allUsers.map(async u => {
        const isExplicitAff = (u.role as string) === 'affiliate' || !!(u as any).isInfluencer;
        const aff = affiliateByUserId.get(u.id);
        let affData = null;
        if (isExplicitAff && aff) {
          const refs = referralsByAffiliateId.get(aff.id) || await dbService.getReferralsByAffiliateId(aff.id);
          const referredUsersSummary = refs.map(r => {
            const refU = userMap.get(r.referredUserId);
            return {
              userId: r.referredUserId,
              name: refU ? refU.name : 'Jogador',
              email: refU ? refU.email : 'N/A',
              joinedAt: r.createdAt
            };
          });

          affData = {
            id: aff.id,
            referralCode: aff.referralCode,
            status: aff.status,
            commissionTotal: aff.commissionTotal || 0,
            affiliateBalance: aff.affiliateBalance || 0,
            cpaAmount: aff.cpaAmount ?? 0,
            revSharePercent: aff.revSharePercent ?? 70.0,
            indicationsCount: refs.length,
            availableWithdrawal: aff.affiliateBalance || 0,
            referredUsers: referredUsersSummary
          };
        }

        // Determine which affiliate / network this player belongs to
        const directRef = referralByReferredUserId.get(u.id);
        const parentAffId = u.affiliateId || (directRef ? directRef.affiliateId : null);
        let parentAff = parentAffId ? affiliateById.get(parentAffId) : null;

        if (!parentAff && directRef?.referralCode) {
          parentAff = affiliateByCode.get(directRef.referralCode.toUpperCase()) || null;
        }

        let referredBy = null;
        if (parentAff) {
          const sponsorUser = userMap.get(parentAff.userId);
          referredBy = {
            affiliateId: parentAff.id,
            referralCode: parentAff.referralCode,
            affiliateUserId: parentAff.userId,
            sponsorName: sponsorUser ? sponsorUser.name : `Afiliado ${parentAff.referralCode}`,
            sponsorEmail: sponsorUser ? sponsorUser.email : null,
            sponsorPhone: sponsorUser ? sponsorUser.phone : null,
            isInfluencer: sponsorUser ? !!(sponsorUser as any).isInfluencer : false,
            role: sponsorUser ? sponsorUser.role : 'affiliate'
          };
        }

        const totalDeposited = depositsByUserId.get(u.id) || 0;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          balance: u.balance,
          promoBalance: u.isInfluencer ? Number(u.promoBalance ?? 1000) : undefined,
          minWithdraw: u.minWithdraw ?? 100,
          role: u.role || (u.email.toLowerCase() === 'admin.eduh@gmail.com' ? 'superadmin' : 'user'),
          isInfluencer: (u as any).isInfluencer || false,
          cpaKillerAllowed: !!u.cpaKillerAllowed,
          isBlocked: !!u.isBlocked,
          adminPermissions: u.adminPermissions || {},
          createdAt: u.createdAt,
          pixKeys: u.pixKeys || (u.pixKey ? [u.pixKey] : []),
          affiliateInfo: affData,
          referredBy,
          totalDeposited
        };
      }));

      res.json({ users: mapped });
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
  });

  // GET /api/admin/affiliates (Detailed affiliate mapping)
  app.get('/api/admin/affiliates', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageUsers') && !checkAdminPermission(req, 'canManageCommissions')) {
        return res.status(403).json({ error: 'Sem permissão para visualizar dados de afiliados.' });
      }

      const allAffiliates = await dbService.getAllAffiliates();
      const allUsers = await dbService.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u]));

      const mappedAffiliates = await Promise.all(allAffiliates.map(async aff => {
        const user = userMap.get(aff.userId);
        const referrals = await dbService.getReferralsByAffiliateId(aff.id);

        return {
          id: aff.id,
          userId: aff.userId,
          userName: user ? user.name : 'Afiliado Desconhecido',
          userEmail: user ? user.email : 'N/A',
          userPhone: user ? user.phone : 'N/A',
          referralCode: aff.referralCode,
          status: aff.status,
          commissionTotal: aff.commissionTotal || 0,
          affiliateBalance: aff.affiliateBalance || 0,
          cpaAmount: aff.cpaAmount ?? 0,
          revSharePercent: aff.revSharePercent ?? 70.0,
          indicationsCount: referrals.length,
          availableWithdrawal: aff.affiliateBalance || 0,
          createdAt: aff.createdAt
        };
      }));

      res.json({ affiliates: mappedAffiliates });
    } catch (err: any) {
      console.error('Error fetching admin affiliates:', err);
      res.status(500).json({ error: 'Erro ao listar afiliados.' });
    }
  });

  // PUT /api/admin/affiliates/:userId/commission (Update CPA & RevShare %)
  app.put('/api/admin/affiliates/:userId/commission', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageCommissions') && !checkAdminPermission(req, 'canManageUsers')) {
        return res.status(403).json({ error: 'Sem permissão para alterar comissões de afiliados.' });
      }

      const { userId } = req.params;
      const { cpaAmount, revSharePercent, affiliateBalance } = req.body;

      let affiliate = await dbService.getAffiliateByUserId(userId);
      if (!affiliate) {
        // Auto-create affiliate record if user exists
        const user = await dbService.getUserById(userId);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const refCode = user.referralCode || ('AFF' + crypto.randomBytes(3).toString('hex').toUpperCase());
        const newAff: import('./server/db.js').AffiliateDB = {
          id: 'aff_' + crypto.randomBytes(8).toString('hex'),
          userId: user.id,
          referralCode: refCode,
          status: 'active',
          commissionTotal: 0,
          affiliateBalance: 0,
          cpaAmount: typeof cpaAmount === 'number' ? cpaAmount : 0,
          revSharePercent: typeof revSharePercent === 'number' ? revSharePercent : 70.0,
          createdAt: new Date().toISOString()
        };
        await dbService.createAffiliate(newAff);
        affiliate = newAff;
      } else {
        const updateData: any = {};
        if (typeof cpaAmount === 'number') updateData.cpaAmount = Math.max(0, cpaAmount);
        if (typeof revSharePercent === 'number') updateData.revSharePercent = Math.min(100, Math.max(0, revSharePercent));
        if (typeof affiliateBalance === 'number') updateData.affiliateBalance = Math.max(0, affiliateBalance);

        await dbService.updateAffiliateRates(affiliate.id, updateData);
      }

      logSecurityEvent('ADMIN_AFFILIATE_RATES_UPDATED', {
        adminId: req.user?.id,
        userId,
        cpaAmount,
        revSharePercent,
        affiliateBalance
      });

      res.json({
        success: true,
        message: 'Comissões do afiliado atualizadas com sucesso!',
        cpaAmount: cpaAmount ?? affiliate.cpaAmount,
        revSharePercent: revSharePercent ?? affiliate.revSharePercent
      });
    } catch (err: any) {
      console.error('Error updating affiliate commission:', err);
      res.status(500).json({ error: 'Erro ao atualizar comissão do afiliado.' });
    }
  });

  // POST /api/admin/users/:id/balance
  app.post('/api/admin/users/:id/balance', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageBalances')) {
        return res.status(403).json({ error: 'Sem permissão para alterar saldos de usuários.' });
      }

      const { id } = req.params;
      const { newBalance, actionType, amount, note, minWithdraw, cpaKillerAllowed, role, isAffiliate, isInfluencer } = req.body;

      const targetUser = await dbService.getUserById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const usePromoWallet = Boolean(targetUser.isInfluencer || isInfluencer === true);
      const startingBalance = usePromoWallet ? Number(targetUser.promoBalance ?? 1000) : targetUser.balance;
      let finalBalance = startingBalance;
      if (typeof newBalance === 'number') {
        finalBalance = Math.max(0, newBalance);
      } else if (typeof amount === 'number') {
        if (actionType === 'add') {
          finalBalance = startingBalance + amount;
        } else if (actionType === 'subtract') {
          finalBalance = Math.max(0, startingBalance - amount);
        }
      }

      const userFieldsToUpdate: any = {};
      if (finalBalance !== startingBalance) {
        if (usePromoWallet) userFieldsToUpdate.promoBalance = finalBalance;
        else userFieldsToUpdate.balance = finalBalance;
      }
      if (typeof minWithdraw === 'number' && !isNaN(minWithdraw) && minWithdraw >= 0) {
        userFieldsToUpdate.minWithdraw = minWithdraw;
      }
      if (typeof cpaKillerAllowed === 'boolean') {
        userFieldsToUpdate.cpaKillerAllowed = cpaKillerAllowed;
      }
      if (typeof role === 'string' && (role === 'user' || role === 'affiliate' || role === 'admin' || role === 'superadmin')) {
        userFieldsToUpdate.role = role;
      } else if (typeof isAffiliate === 'boolean') {
        userFieldsToUpdate.role = isAffiliate ? 'affiliate' : 'user';
      }
      if (typeof isInfluencer === 'boolean') {
        userFieldsToUpdate.isInfluencer = isInfluencer;
        if (isInfluencer && targetUser.promoBalance == null) userFieldsToUpdate.promoBalance = 1000;
      }

      if (Object.keys(userFieldsToUpdate).length > 0) {
        await dbService.updateUserFields(id, userFieldsToUpdate);
      }

      // If user was made an affiliate, ensure active affiliate record exists
      if (userFieldsToUpdate.role === 'affiliate' || (userFieldsToUpdate.isInfluencer && targetUser.role !== 'affiliate')) {
        const existingAff = await dbService.getAffiliateByUserId(id);
        if (!existingAff) {
          const refCode = targetUser.referralCode || ('AFF' + crypto.randomBytes(3).toString('hex').toUpperCase());
          const newAff: import('./server/db.js').AffiliateDB = {
            id: 'aff_' + crypto.randomBytes(8).toString('hex'),
            userId: targetUser.id,
            referralCode: refCode,
            status: 'active',
            commissionTotal: 0,
            affiliateBalance: 0,
            cpaAmount: 0,
            revSharePercent: 70.0,
            createdAt: new Date().toISOString()
          };
          await dbService.createAffiliate(newAff);
        }
      }

      const updatedMinWithdraw = typeof userFieldsToUpdate.minWithdraw === 'number' ? userFieldsToUpdate.minWithdraw : (targetUser.minWithdraw ?? 100);
      const updatedRole = userFieldsToUpdate.role || targetUser.role;

      // Create transaction log if balance changed
      if (!usePromoWallet && finalBalance !== startingBalance) {
        const logTx: TransactionDB = {
          id: 'tx_adm_' + crypto.randomBytes(8).toString('hex'),
          userId: id,
          type: actionType === 'subtract' ? 'withdrawal' : 'deposit',
          amount: Math.abs(finalBalance - startingBalance),
          status: 'approved',
          paymentMethod: 'ADMIN_ADJUST',
          description: note || `Ajuste administrativo por ${req.user?.email}`,
          createdAt: new Date().toISOString()
        };
        await dbService.createTransaction(logTx);
      }

      logSecurityEvent('ADMIN_BALANCE_ADJUST', {
        adminId: req.user?.id,
        targetUserId: id,
        oldBalance: startingBalance,
        newBalance: finalBalance,
        wallet: usePromoWallet ? 'promotional' : 'real',
        minWithdraw: updatedMinWithdraw,
        role: updatedRole
      });

      res.json({
        success: true,
        user: {
          id,
          balance: finalBalance,
          minWithdraw: updatedMinWithdraw,
          role: updatedRole,
          isInfluencer: userFieldsToUpdate.isInfluencer !== undefined ? userFieldsToUpdate.isInfluencer : (targetUser as any).isInfluencer
        },
        message: `Dados do usuário atualizados com sucesso!`
      });
    } catch (err: any) {
      console.error('Error updating user balance:', err);
      res.status(500).json({ error: 'Erro ao atualizar saldo do usuário.' });
    }
  });

  // POST /api/admin/users/:id/promote-affiliate
  app.post('/api/admin/users/:id/promote-affiliate', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageUsers')) {
        return res.status(403).json({ error: 'Sem permissão para gerenciar papéis de usuários.' });
      }

      const { id } = req.params;
      const { makeAffiliate, revSharePercent, cpaAmount, isInfluencer } = req.body;

      const targetUser = await dbService.getUserById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const isCurrentAffiliate = targetUser.role === 'affiliate';
      const shouldBeAffiliate = typeof makeAffiliate === 'boolean' ? makeAffiliate : !isCurrentAffiliate;
      const newRole = shouldBeAffiliate ? 'affiliate' : 'user';

      const updateFields: any = { role: newRole };
      if (typeof isInfluencer === 'boolean') {
        updateFields.isInfluencer = isInfluencer;
        if (isInfluencer && targetUser.promoBalance == null) updateFields.promoBalance = 1000;
      }

      await dbService.updateUserFields(id, updateFields);

      let affiliate = await dbService.getAffiliateByUserId(id);
      if (shouldBeAffiliate && !affiliate) {
        const refCode = targetUser.referralCode || ('AFF' + crypto.randomBytes(3).toString('hex').toUpperCase());
        const newAff: import('./server/db.js').AffiliateDB = {
          id: 'aff_' + crypto.randomBytes(8).toString('hex'),
          userId: targetUser.id,
          referralCode: refCode,
          status: 'active',
          commissionTotal: 0,
          affiliateBalance: 0,
          cpaAmount: typeof cpaAmount === 'number' ? cpaAmount : 0,
          revSharePercent: typeof revSharePercent === 'number' ? revSharePercent : 70.0,
          createdAt: new Date().toISOString()
        };
        await dbService.createAffiliate(newAff);
        affiliate = newAff;
      }

      logSecurityEvent('ADMIN_PROMOTE_USER_AFFILIATE', {
        adminId: req.user?.id,
        targetUserId: id,
        newRole,
        isAffiliate: shouldBeAffiliate
      });

      res.json({
        success: true,
        user: {
          id: targetUser.id,
          role: newRole,
          isInfluencer: typeof isInfluencer === 'boolean' ? isInfluencer : (targetUser as any).isInfluencer,
          affiliateInfo: affiliate ? {
            id: affiliate.id,
            referralCode: affiliate.referralCode,
            status: affiliate.status,
            commissionTotal: affiliate.commissionTotal || 0,
            affiliateBalance: affiliate.affiliateBalance || 0,
            cpaAmount: affiliate.cpaAmount ?? 0,
            revSharePercent: affiliate.revSharePercent ?? 70.0,
          } : null
        },
        message: shouldBeAffiliate
          ? 'Usuário definido como Afiliado Hub com sucesso!'
          : 'Usuário alterado para Jogador padrão.'
      });
    } catch (err: any) {
      console.error('Error promoting user to affiliate:', err);
      res.status(500).json({ error: 'Erro ao alterar papel do usuário.' });
    }
  });

  // POST /api/admin/users/:id/block
  app.post('/api/admin/users/:id/block', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageUsers')) {
        return res.status(403).json({ error: 'Sem permissão para bloquear/desbloquear usuários.' });
      }

      const { id } = req.params;
      const targetUser = await dbService.getUserById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      if (targetUser.email.toLowerCase() === 'admin.eduh@gmail.com') {
        return res.status(400).json({ error: 'O Super Admin principal não pode ser bloqueado.' });
      }

      const newBlockStatus = !targetUser.isBlocked;
      await dbService.updateUserFields(id, { isBlocked: newBlockStatus });

      logSecurityEvent('ADMIN_USER_BLOCK_TOGGLE', {
        adminId: req.user?.id,
        targetUserId: id,
        isBlocked: newBlockStatus
      });

      res.json({
        success: true,
        isBlocked: newBlockStatus,
        message: newBlockStatus ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.'
      });
    } catch (err: any) {
      console.error('Error toggling block status:', err);
      res.status(500).json({ error: 'Erro ao alterar status do usuário.' });
    }
  });

  // GET /api/admin/withdrawals
  app.get('/api/admin/withdrawals', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canApproveWithdrawals') && !checkAdminPermission(req, 'canViewMetrics')) {
        return res.status(403).json({ error: 'Sem permissão para visualizar saques.' });
      }

      const allTx = await dbService.getAllTransactions();
      const withdrawals = allTx.filter(t => t.type === 'withdrawal');

      // Enrich with user name, email & affiliate referral data
      const allUsers = await dbService.getAllUsers();
      const allAffiliates = await dbService.getAllAffiliates();
      const allReferrals = await dbService.getAllReferrals();

      const userMap = new Map(allUsers.map(u => [u.id, u]));
      const referralByReferredUserId = new Map(allReferrals.map(r => [r.referredUserId, r]));
      const affiliateById = new Map(allAffiliates.map(a => [a.id, a]));
      const affiliateByCode = new Map(allAffiliates.map(a => [a.referralCode.toUpperCase(), a]));

      const enriched = withdrawals.map(w => {
        const u = userMap.get(w.userId);

        let referredBy = null;
        if (u) {
          const directRef = referralByReferredUserId.get(u.id);
          const parentAffId = u.affiliateId || (directRef ? directRef.affiliateId : null);
          let parentAff = parentAffId ? affiliateById.get(parentAffId) : null;
          if (!parentAff && directRef?.referralCode) {
            parentAff = affiliateByCode.get(directRef.referralCode.toUpperCase()) || null;
          }
          if (parentAff) {
            const sponsorUser = userMap.get(parentAff.userId);
            referredBy = {
              affiliateId: parentAff.id,
              referralCode: parentAff.referralCode,
              affiliateUserId: parentAff.userId,
              sponsorName: sponsorUser ? sponsorUser.name : `Afiliado ${parentAff.referralCode}`,
              sponsorEmail: sponsorUser ? sponsorUser.email : null,
              sponsorPhone: sponsorUser ? sponsorUser.phone : null,
              isInfluencer: sponsorUser ? !!(sponsorUser as any).isInfluencer : false,
              role: sponsorUser ? sponsorUser.role : 'affiliate'
            };
          }
        }

        return {
          ...w,
          userName: u ? u.name : 'Usuário Desconhecido',
          userEmail: u ? u.email : 'N/A',
          userPhone: u ? u.phone : 'N/A',
          pixKey: u ? u.pixKey : null,
          referredBy
        };
      });

      res.json({ withdrawals: enriched });
    } catch (err: any) {
      console.error('Error fetching admin withdrawals:', err);
      res.status(500).json({ error: 'Erro ao carregar saques.' });
    }
  });

  // POST /api/admin/withdrawals/:id/approve
  app.post('/api/admin/withdrawals/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canApproveWithdrawals')) {
        return res.status(403).json({ error: 'Sem permissão para aprovar saques.' });
      }

      const { id } = req.params;
      const tx = await dbService.getTransactionById(id);
      if (!tx) {
        return res.status(404).json({ error: 'Solicitação de saque não encontrada.' });
      }

      if (tx.status === 'approved') {
        return res.status(400).json({ error: 'Este saque já foi aprovado.' });
      }

      await dbService.updateTransactionStatus(id, 'approved');

      logSecurityEvent('ADMIN_WITHDRAWAL_APPROVED', {
        adminId: req.user?.id,
        withdrawalId: id,
        amount: tx.amount,
        targetUserId: tx.userId
      });

      res.json({ success: true, message: 'Saque aprovado com sucesso!' });
    } catch (err: any) {
      console.error('Error approving withdrawal:', err);
      res.status(500).json({ error: 'Erro ao aprovar saque.' });
    }
  });

  // POST /api/admin/withdrawals/:id/reject
  app.post('/api/admin/withdrawals/:id/reject', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canApproveWithdrawals')) {
        return res.status(403).json({ error: 'Sem permissão para rejeitar saques.' });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const tx = await dbService.getTransactionById(id);
      if (!tx) {
        return res.status(404).json({ error: 'Solicitação de saque não encontrada.' });
      }

      if (tx.status === 'rejected') {
        return res.status(400).json({ error: 'Este saque já foi rejeitado anteriormente.' });
      }

      // Refund user balance
      const user = await dbService.getUserById(tx.userId);
      if (user) {
        const refundedBalance = user.balance + tx.amount;
        await dbService.updateUserBalance(user.id, refundedBalance);
      }

      await dbService.updateTransactionStatus(id, 'rejected');

      logSecurityEvent('ADMIN_WITHDRAWAL_REJECTED', {
        adminId: req.user?.id,
        withdrawalId: id,
        amount: tx.amount,
        targetUserId: tx.userId,
        reason: reason || 'Rejeitado pelo administrador'
      });

      res.json({ success: true, message: 'Saque rejeitado e valor estornado ao saldo do usuário.' });
    } catch (err: any) {
      console.error('Error rejecting withdrawal:', err);
      res.status(500).json({ error: 'Erro ao rejeitar saque.' });
    }
  });

  // GET /api/admin/admins (List Sub-Admins)
  app.get('/api/admin/admins', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canManageAdmins')) {
        return res.status(403).json({ error: 'Sem permissão para gerenciar administradores.' });
      }

      const admins = await dbService.getAdmins();
      const mapped = admins.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        role: a.role || (a.email.toLowerCase() === 'admin.eduh@gmail.com' ? 'superadmin' : 'admin'),
        adminPermissions: a.adminPermissions || {
          canManageUsers: true,
          canManageBalances: true,
          canApproveWithdrawals: true,
          canManageAdmins: a.role === 'superadmin' || a.email.toLowerCase() === 'admin.eduh@gmail.com',
          canViewMetrics: true,
          canManageGames: true
        },
        createdAt: a.createdAt
      }));

      res.json({ admins: mapped });
    } catch (err: any) {
      console.error('Error fetching sub-admins:', err);
      res.status(500).json({ error: 'Erro ao carregar lista de administradores.' });
    }
  });

  // POST /api/admin/admins (Create / Promote Sub-Admin)
  app.post('/api/admin/admins', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const isSuperAdmin = req.user?.email.toLowerCase() === 'admin.eduh@gmail.com' || req.user?.role === 'superadmin';
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Apenas o Super Admin pode cadastrar novos administradores.' });
      }

      const { email, permissions } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'O e-mail do novo administrador é obrigatório.' });
      }

      const targetUser = await dbService.getUserByEmail(email.toLowerCase().trim());
      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado. O e-mail deve pertencer a uma conta existente.' });
      }

      const defaultPermissions = {
        canViewMetrics: true,
        canManageUsers: true,
        canManageBalances: false,
        canManageCommissions: true,
        canApproveWithdrawals: true,
        canApproveDeposits: true,
        canSendNotifications: true,
        canManageGames: true,
        canManageAdmins: false,
        canExportReports: true,
        ...(permissions || {})
      };

      await dbService.updateUserRoleAndPermissions(
        targetUser.id,
        targetUser.email.toLowerCase() === 'admin.eduh@gmail.com' ? 'superadmin' : 'admin',
        defaultPermissions
      );

      logSecurityEvent('SUB_ADMIN_PROMOTED', {
        promotedBy: req.user?.id,
        targetUserId: targetUser.id,
        permissions: defaultPermissions
      });

      res.json({
        success: true,
        message: `Usuário ${targetUser.email} promovido a Administrador com sucesso!`,
        admin: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: 'admin',
          adminPermissions: defaultPermissions
        }
      });
    } catch (err: any) {
      console.error('Error promoting admin:', err);
      res.status(500).json({ error: 'Erro ao cadastrar novo administrador.' });
    }
  });

  // PUT /api/admin/admins/:id/permissions (Update permissions)
  app.put('/api/admin/admins/:id/permissions', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const isSuperAdmin = req.user?.email.toLowerCase() === 'admin.eduh@gmail.com' || req.user?.role === 'superadmin';
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Apenas o Super Admin pode alterar permissões de outros administradores.' });
      }

      const { id } = req.params;
      const { permissions } = req.body;

      const targetUser = await dbService.getUserById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Administrador não encontrado.' });
      }

      if (targetUser.email.toLowerCase() === 'admin.eduh@gmail.com') {
        return res.status(400).json({ error: 'As permissões do Super Admin principal não podem ser alteradas.' });
      }

      const updatedPermissions = {
        canViewMetrics: !!permissions?.canViewMetrics,
        canManageUsers: !!permissions?.canManageUsers,
        canManageBalances: !!permissions?.canManageBalances,
        canManageCommissions: !!permissions?.canManageCommissions,
        canApproveWithdrawals: !!permissions?.canApproveWithdrawals,
        canApproveDeposits: !!permissions?.canApproveDeposits,
        canSendNotifications: !!permissions?.canSendNotifications,
        canManageGames: !!permissions?.canManageGames,
        canManageAdmins: !!permissions?.canManageAdmins,
        canExportReports: !!permissions?.canExportReports
      };

      await dbService.updateUserRoleAndPermissions(id, 'admin', updatedPermissions);

      logSecurityEvent('SUB_ADMIN_PERMISSIONS_UPDATED', {
        updatedBy: req.user?.id,
        targetUserId: id,
        permissions: updatedPermissions
      });

      res.json({
        success: true,
        message: 'Permissões atualizadas com sucesso!',
        permissions: updatedPermissions
      });
    } catch (err: any) {
      console.error('Error updating admin permissions:', err);
      res.status(500).json({ error: 'Erro ao atualizar permissões do administrador.' });
    }
  });

  // DELETE /api/admin/admins/:id (Revoke admin role)
  app.delete('/api/admin/admins/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const isSuperAdmin = req.user?.email.toLowerCase() === 'admin.eduh@gmail.com' || req.user?.role === 'superadmin';
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Apenas o Super Admin pode remover administradores.' });
      }

      const { id } = req.params;
      const targetUser = await dbService.getUserById(id);
      if (!targetUser) {
        return res.status(404).json({ error: 'Administrador não encontrado.' });
      }

      if (targetUser.email.toLowerCase() === 'admin.eduh@gmail.com') {
        return res.status(400).json({ error: 'Não é possível revogar o Super Admin principal.' });
      }

      await dbService.updateUserRoleAndPermissions(id, 'user', {});

      logSecurityEvent('SUB_ADMIN_REVOKED', {
        revokedBy: req.user?.id,
        targetUserId: id
      });

      res.json({ success: true, message: 'Função de administrador revogada com sucesso.' });
    } catch (err: any) {
      console.error('Error revoking admin role:', err);
      res.status(500).json({ error: 'Erro ao revogar administrador.' });
    }
  });

  // GET /api/admin/deposits
  app.get('/api/admin/deposits', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const allTx = await dbService.getAllTransactions();
      const deposits = allTx.filter(t => t.type === 'deposit');

      const allUsers = await dbService.getAllUsers();
      const allAffiliates = await dbService.getAllAffiliates();
      const allReferrals = await dbService.getAllReferrals();

      const userMap = new Map(allUsers.map(u => [u.id, u]));
      const referralByReferredUserId = new Map(allReferrals.map(r => [r.referredUserId, r]));
      const affiliateById = new Map(allAffiliates.map(a => [a.id, a]));
      const affiliateByCode = new Map(allAffiliates.map(a => [a.referralCode.toUpperCase(), a]));

      const enriched = deposits.map(d => {
        const u = userMap.get(d.userId);

        let referredBy = null;
        if (u) {
          const directRef = referralByReferredUserId.get(u.id);
          const parentAffId = u.affiliateId || (directRef ? directRef.affiliateId : null);
          let parentAff = parentAffId ? affiliateById.get(parentAffId) : null;
          if (!parentAff && directRef?.referralCode) {
            parentAff = affiliateByCode.get(directRef.referralCode.toUpperCase()) || null;
          }
          if (parentAff) {
            const sponsorUser = userMap.get(parentAff.userId);
            referredBy = {
              affiliateId: parentAff.id,
              referralCode: parentAff.referralCode,
              affiliateUserId: parentAff.userId,
              sponsorName: sponsorUser ? sponsorUser.name : `Afiliado ${parentAff.referralCode}`,
              sponsorEmail: sponsorUser ? sponsorUser.email : null,
              sponsorPhone: sponsorUser ? sponsorUser.phone : null,
              isInfluencer: sponsorUser ? !!(sponsorUser as any).isInfluencer : false,
              role: sponsorUser ? sponsorUser.role : 'affiliate'
            };
          }
        }

        return {
          ...d,
          userName: u ? u.name : 'Usuário Desconhecido',
          userEmail: u ? u.email : 'N/A',
          userPhone: u ? u.phone : 'N/A',
          referredBy
        };
      });

      res.json({ deposits: enriched });
    } catch (err: any) {
      console.error('Error fetching admin deposits:', err);
      res.status(500).json({ error: 'Erro ao listar depósitos.' });
    }
  });

  // POST /api/admin/notifications
  app.post('/api/admin/notifications', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { title, body, targetUserId } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
      }

      await sendPushNotification(targetUserId || 'all', {
        title,
        body,
        url: '/'
      });

      res.json({ success: true, message: 'Notificação enviada aos usuários com sucesso!' });
    } catch (err: any) {
      console.error('Error sending admin push notification:', err);
      res.status(500).json({ error: 'Erro ao enviar notificação.' });
    }
  });

  // GET /api/admin/reports/analytics (Advanced Analytical & Financial Intelligence Reporting Suite)
  app.get('/api/admin/reports/analytics', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      if (!checkAdminPermission(req, 'canViewMetrics') && !checkAdminPermission(req, 'canExportReports')) {
        return res.status(403).json({ error: 'Sem permissão para acessar a área de relatórios.' });
      }

      const { period = '7days', startDate: customStart, endDate: customEnd } = req.query;

      const now = new Date();
      let startTime = 0;
      let endTime = now.getTime();

      if (period === 'today') {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
      } else if (period === 'yesterday') {
        const dStart = new Date(now);
        dStart.setDate(dStart.getDate() - 1);
        dStart.setHours(0, 0, 0, 0);
        startTime = dStart.getTime();
        const dEnd = new Date(now);
        dEnd.setDate(dEnd.getDate() - 1);
        dEnd.setHours(23, 59, 59, 999);
        endTime = dEnd.getTime();
      } else if (period === '7days') {
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
      } else if (period === '30days') {
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
      } else if (period === 'this_month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        startTime = d.getTime();
      } else if (period === 'last_month') {
        const dStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        startTime = dStart.getTime();
        const dEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        endTime = dEnd.getTime();
      } else if (period === 'custom' && customStart) {
        startTime = new Date(String(customStart)).getTime();
        if (customEnd) {
          const d = new Date(String(customEnd));
          d.setHours(23, 59, 59, 999);
          endTime = d.getTime();
        }
      } else if (period === 'all') {
        startTime = 0;
      } else {
        // Default 7 days
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        d.setHours(0, 0, 0, 0);
        startTime = d.getTime();
      }

      // Fetch all dataset from DB
      const [allTx, allUsers, allBets, allCommissions, allAffiliates, gameConfig] = await Promise.all([
        dbService.getAllTransactions(),
        dbService.getAllUsers(),
        dbService.getAllGameBets(1000),
        dbService.getAllCommissions(),
        dbService.getAllAffiliates(),
        dbService.getGameConfig('g_block_puzzle'),
      ]);

      const parseTs = (dateStr: string) => new Date(dateStr).getTime() || 0;

      // Filter data by time window
      const inRange = (dStr: string) => {
        const ts = parseTs(dStr);
        return ts >= startTime && ts <= endTime;
      };

      const influencerIds = new Set(allUsers.filter(u => u.isInfluencer).map(u => u.id));
      const periodTx = allTx.filter((t) => inRange(t.createdAt) && !influencerIds.has(t.userId));
      const periodUsers = allUsers.filter((u) => inRange(u.createdAt) && !u.isInfluencer);
      const periodBets = allBets.filter((b) => inRange(b.createdAt) && !b.isPromotional && !influencerIds.has(b.userId));
      const periodCommissions = allCommissions.filter((c) => inRange(c.createdAt));

      // User maps
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      // 1. Transaction aggregations
      const approvedDeposits = periodTx.filter((t) => t.type === 'deposit' && t.status === 'approved');
      const pendingDeposits = periodTx.filter((t) => t.type === 'deposit' && t.status === 'pending');
      const allDepositsCount = periodTx.filter((t) => t.type === 'deposit').length;

      const approvedWithdrawals = periodTx.filter((t) => t.type === 'withdrawal' && t.status === 'approved');
      const pendingWithdrawals = periodTx.filter((t) => t.type === 'withdrawal' && t.status === 'pending');
      const rejectedWithdrawals = periodTx.filter((t) => t.type === 'withdrawal' && t.status === 'rejected');

      const grossDeposits = approvedDeposits.reduce((acc, t) => acc + (t.amount || 0), 0);
      const grossDepositsCount = approvedDeposits.length;
      const totalWithdrawals = approvedWithdrawals.reduce((acc, t) => acc + (t.amount || 0), 0);
      const totalWithdrawalsCount = approvedWithdrawals.length;
      const pendingWithdrawalsAmount = pendingWithdrawals.reduce((acc, t) => acc + (t.amount || 0), 0);

      const netCashflow = grossDeposits - totalWithdrawals;

      // 2. Gaming aggregations in period
      let wagered = 0;
      let payouts = 0;
      let winsCount = 0;
      let lossesCount = 0;
      let topMultiplier = 1.0;
      let topWinAmount = 0;
      const diffDist: Record<string, number> = { easy: 0, medium: 0, hard: 0, extreme: 0 };

      for (const b of periodBets) {
        const bAmount = b.betAmount || 0;
        const pAmount = b.payoutAmount || 0;
        wagered += bAmount;
        payouts += pAmount;

        if (b.multiplier && b.multiplier > topMultiplier) topMultiplier = b.multiplier;
        if (pAmount > topWinAmount) topWinAmount = pAmount;

        if (b.status === 'cashed_out' && pAmount > 0) winsCount++;
        else if (b.status === 'lost') lossesCount++;

        const d = b.difficulty || 'easy';
        diffDist[d] = (diffDist[d] || 0) + 1;
      }

      // If period is 'all', incorporate game config baseline accumulators if higher
      if (period === 'all') {
        wagered = Math.max(wagered, gameConfig.totalWagered || 0);
        payouts = Math.max(payouts, gameConfig.totalPayout || 0);
      }

      const ggr = parseFloat((wagered - payouts).toFixed(2));
      const ggrMarginPercent = wagered > 0 ? parseFloat(((ggr / wagered) * 100).toFixed(2)) : (100 - (gameConfig.rtpPercent || 96));
      const realRtpPercent = wagered > 0 ? parseFloat(((payouts / wagered) * 100).toFixed(2)) : (gameConfig.rtpPercent || 96);

      // 3. Affiliate commission aggregations
      const totalAffiliateCommissions = periodCommissions.reduce((acc, c) => acc + (c.amount || 0), 0);
      const ngr = parseFloat((ggr - totalAffiliateCommissions).toFixed(2));
      const netOperatingMargin = grossDeposits > 0 ? parseFloat((((grossDeposits - totalWithdrawals - totalAffiliateCommissions) / grossDeposits) * 100).toFixed(2)) : 0;

      // 4. Player & FTD (First Time Deposit) intelligence
      // Calculate FTDs in period: find the first deposit ever for each user and check if it occurred in the period
      const userFirstDepositMap = new Map<string, number>();
      for (const t of allTx) {
        if (t.type === 'deposit' && t.status === 'approved') {
          const ts = parseTs(t.createdAt);
          const currentFirst = userFirstDepositMap.get(t.userId);
          if (!currentFirst || ts < currentFirst) {
            userFirstDepositMap.set(t.userId, ts);
          }
        }
      }

      let ftdCount = 0;
      let ftdVolume = 0;
      for (const [uId, firstTs] of userFirstDepositMap.entries()) {
        if (firstTs >= startTime && firstTs <= endTime) {
          ftdCount++;
          const tx = periodTx.find((t) => t.userId === uId && t.type === 'deposit' && t.status === 'approved');
          if (tx) ftdVolume += tx.amount || 0;
        }
      }

      const newUsersCount = periodUsers.length;
      const conversionRatePercent = newUsersCount > 0 ? parseFloat(((ftdCount / newUsersCount) * 100).toFixed(1)) : 0;
      const avgDepositTicket = grossDepositsCount > 0 ? parseFloat((grossDeposits / grossDepositsCount).toFixed(2)) : 0;
      const avgWithdrawalTicket = totalWithdrawalsCount > 0 ? parseFloat((totalWithdrawals / totalWithdrawalsCount).toFixed(2)) : 0;

      // Distinct active users in period
      const activeUserIds = new Set<string>();
      periodTx.forEach((t) => activeUserIds.add(t.userId));
      periodBets.forEach((b) => activeUserIds.add(b.userId));
      const activePlayersCount = activeUserIds.size;

      // 5. Deposit Buckets Distribution
      const depositBuckets = {
        tier1: { label: 'R$ 1 a R$ 20', count: 0, total: 0 },
        tier2: { label: 'R$ 21 a R$ 50', count: 0, total: 0 },
        tier3: { label: 'R$ 51 a R$ 100', count: 0, total: 0 },
        tier4: { label: 'R$ 101 a R$ 500', count: 0, total: 0 },
        tier5: { label: 'Acima de R$ 500', count: 0, total: 0 },
      };

      for (const d of approvedDeposits) {
        const a = d.amount || 0;
        if (a <= 20) {
          depositBuckets.tier1.count++;
          depositBuckets.tier1.total += a;
        } else if (a <= 50) {
          depositBuckets.tier2.count++;
          depositBuckets.tier2.total += a;
        } else if (a <= 100) {
          depositBuckets.tier3.count++;
          depositBuckets.tier3.total += a;
        } else if (a <= 500) {
          depositBuckets.tier4.count++;
          depositBuckets.tier4.total += a;
        } else {
          depositBuckets.tier5.count++;
          depositBuckets.tier5.total += a;
        }
      }

      // 6. Daily DRE Breakdown (Chronological Series)
      const daysCount = Math.max(1, Math.min(60, Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000))));
      const dailyMap = new Map<string, {
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
      }>();

      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startTime + i * 24 * 60 * 60 * 1000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;
        dailyMap.set(key, {
          date: key,
          displayDate: `${dd}/${mm}`,
          deposits: 0,
          depositsCount: 0,
          withdrawals: 0,
          withdrawalsCount: 0,
          netCashflow: 0,
          wagered: 0,
          payouts: 0,
          ggr: 0,
          newUsers: 0,
          ftdCount: 0,
        });
      }

      // Populate daily series
      for (const t of periodTx) {
        const d = new Date(parseTs(t.createdAt));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const item = dailyMap.get(key);
        if (item) {
          if (t.type === 'deposit' && t.status === 'approved') {
            item.deposits += t.amount || 0;
            item.depositsCount++;
          } else if (t.type === 'withdrawal' && t.status === 'approved') {
            item.withdrawals += t.amount || 0;
            item.withdrawalsCount++;
          }
          item.netCashflow = item.deposits - item.withdrawals;
        }
      }

      for (const b of periodBets) {
        const d = new Date(parseTs(b.createdAt));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const item = dailyMap.get(key);
        if (item) {
          item.wagered += b.betAmount || 0;
          item.payouts += b.payoutAmount || 0;
          item.ggr = item.wagered - item.payouts;
        }
      }

      for (const u of periodUsers) {
        const d = new Date(parseTs(u.createdAt));
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const item = dailyMap.get(key);
        if (item) {
          item.newUsers++;
        }
      }

      for (const [uId, firstTs] of userFirstDepositMap.entries()) {
        if (firstTs >= startTime && firstTs <= endTime) {
          const d = new Date(firstTs);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const item = dailyMap.get(key);
          if (item) {
            item.ftdCount++;
          }
        }
      }

      const dailyBreakdown = Array.from(dailyMap.values()).map((row) => ({
        ...row,
        deposits: parseFloat(row.deposits.toFixed(2)),
        withdrawals: parseFloat(row.withdrawals.toFixed(2)),
        netCashflow: parseFloat(row.netCashflow.toFixed(2)),
        wagered: parseFloat(row.wagered.toFixed(2)),
        payouts: parseFloat(row.payouts.toFixed(2)),
        ggr: parseFloat(row.ggr.toFixed(2)),
      }));

      // 7. Top Players Analytics
      const playerStatsMap = new Map<string, {
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
        createdAt: string;
      }>();

      for (const u of allUsers) {
        playerStatsMap.set(u.id, {
          userId: u.id,
          name: u.name || 'Sem nome',
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          currentBalance: u.balance || 0,
          totalDeposited: 0,
          depositsCount: 0,
          totalWithdrawn: 0,
          withdrawalsCount: 0,
          totalWagered: 0,
          totalPayouts: 0,
          ggrGenerated: 0,
          betsCount: 0,
          createdAt: u.createdAt,
        });
      }

      for (const t of periodTx) {
        const p = playerStatsMap.get(t.userId);
        if (p) {
          if (t.type === 'deposit' && t.status === 'approved') {
            p.totalDeposited += t.amount || 0;
            p.depositsCount++;
          } else if (t.type === 'withdrawal' && t.status === 'approved') {
            p.totalWithdrawn += t.amount || 0;
            p.withdrawalsCount++;
          }
        }
      }

      for (const b of periodBets) {
        const p = playerStatsMap.get(b.userId);
        if (p) {
          p.totalWagered += b.betAmount || 0;
          p.totalPayouts += b.payoutAmount || 0;
          p.betsCount++;
        }
      }

      for (const p of playerStatsMap.values()) {
        p.ggrGenerated = parseFloat((p.totalWagered - p.totalPayouts).toFixed(2));
      }

      const allPlayersArray = Array.from(playerStatsMap.values());
      const topProfitablePlayers = [...allPlayersArray]
        .filter((p) => p.totalWagered > 0 || p.totalDeposited > 0)
        .sort((a, b) => b.ggrGenerated - a.ggrGenerated)
        .slice(0, 15);

      const topWithdrawingPlayers = [...allPlayersArray]
        .filter((p) => p.totalWithdrawn > 0)
        .sort((a, b) => b.totalWithdrawn - a.totalWithdrawn)
        .slice(0, 15);

      const topDepositingPlayers = [...allPlayersArray]
        .filter((p) => p.totalDeposited > 0)
        .sort((a, b) => b.totalDeposited - a.totalDeposited)
        .slice(0, 15);

      // 8. Affiliates Intelligence & Ranking
      const affiliateRanking = await Promise.all(
        allAffiliates.map(async (aff) => {
          const user = userMap.get(aff.userId);
          const referrals = await dbService.getReferralsByAffiliateId(aff.id);
          const periodReferrals = referrals.filter((r) => inRange(r.createdAt));

          const refUserIds = new Set(referrals.map((r) => r.referredUserId));
          const periodRefTx = periodTx.filter((t) => refUserIds.has(t.userId));

          const referralDeposits = periodRefTx
            .filter((t) => t.type === 'deposit' && t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

          let affFtdCount = 0;
          for (const refUserId of refUserIds) {
            const firstTs = userFirstDepositMap.get(refUserId);
            if (firstTs && firstTs >= startTime && firstTs <= endTime) {
              affFtdCount++;
            }
          }

          const commissions = periodCommissions.filter((c) => c.affiliateId === aff.id);
          const totalCommissionsEarned = commissions.reduce((sum, c) => sum + (c.amount || 0), 0);

          return {
            affiliateId: aff.id,
            userId: aff.userId,
            userName: user ? user.name : 'Afiliado Desconhecido',
            userEmail: user ? user.email : 'N/A',
            referralCode: aff.referralCode,
            totalReferrals: referrals.length,
            periodReferralsCount: periodReferrals.length,
            ftdCount: affFtdCount,
            referralDepositsTotal: parseFloat(referralDeposits.toFixed(2)),
            cpaAmount: aff.cpaAmount || 0,
            revSharePercent: aff.revSharePercent || 70,
            commissionTotal: parseFloat((totalCommissionsEarned || aff.commissionTotal || 0).toFixed(2)),
            currentBalance: parseFloat((aff.affiliateBalance || 0).toFixed(2)),
          };
        })
      );

      affiliateRanking.sort((a, b) => b.referralDepositsTotal - a.referralDepositsTotal);

      // 9. Enriched Recent Transactions in Period
      const enrichedTransactions = periodTx.slice(0, 100).map((t) => {
        const u = userMap.get(t.userId);
        return {
          id: t.id,
          userId: t.userId,
          userName: u ? u.name : 'Usuário Desconhecido',
          userEmail: u ? u.email : 'N/A',
          userPhone: u ? u.phone : 'N/A',
          type: t.type,
          amount: t.amount,
          status: t.status,
          paymentMethod: t.paymentMethod,
          description: t.description,
          createdAt: t.createdAt,
        };
      });

      res.json({
        success: true,
        period,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        periodSummary: {
          grossDeposits: parseFloat(grossDeposits.toFixed(2)),
          grossDepositsCount,
          pendingDepositsCount: pendingDeposits.length,
          allDepositsCount,
          depositConversionRate: allDepositsCount > 0 ? parseFloat(((grossDepositsCount / allDepositsCount) * 100).toFixed(1)) : 100,
          totalWithdrawals: parseFloat(totalWithdrawals.toFixed(2)),
          totalWithdrawalsCount,
          pendingWithdrawalsAmount: parseFloat(pendingWithdrawalsAmount.toFixed(2)),
          pendingWithdrawalsCount: pendingWithdrawals.length,
          rejectedWithdrawalsCount: rejectedWithdrawals.length,
          netCashflow: parseFloat(netCashflow.toFixed(2)),
          wagered: parseFloat(wagered.toFixed(2)),
          payouts: parseFloat(payouts.toFixed(2)),
          ggr,
          ggrMarginPercent,
          realRtpPercent,
          configuredRtpPercent: gameConfig.rtpPercent,
          totalAffiliateCommissions: parseFloat(totalAffiliateCommissions.toFixed(2)),
          ngr,
          netOperatingMargin,
          newUsersCount,
          activePlayersCount,
          ftdCount,
          ftdVolume: parseFloat(ftdVolume.toFixed(2)),
          conversionRatePercent,
          avgDepositTicket,
          avgWithdrawalTicket,
          totalBetsCount: periodBets.length,
          winsCount,
          lossesCount,
          winRatePercent: periodBets.length > 0 ? parseFloat(((winsCount / periodBets.length) * 100).toFixed(1)) : 0,
          topMultiplier: parseFloat(topMultiplier.toFixed(2)),
          topWinAmount: parseFloat(topWinAmount.toFixed(2)),
        },
        dailyBreakdown,
        depositBuckets,
        difficultyDistribution: diffDist,
        topProfitablePlayers,
        topWithdrawingPlayers,
        topDepositingPlayers,
        affiliateRanking: affiliateRanking.slice(0, 20),
        transactions: enrichedTransactions,
      });
    } catch (err: any) {
      console.error('Error computing analytical reports:', err);
      res.status(500).json({ error: 'Erro ao processar relatórios analíticos.' });
    }
  });

  // GAMES & RTP MANAGEMENT STORE & ENDPOINTS

  // GET /api/game/config (Player / Public Game Configuration with real RTP and Difficulty)
  app.get('/api/game/config', async (req: Request, res: Response) => {
    try {
      let isInfluencer = false;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const session = getSession(token);
        const userId = session?.userId || sessions.get(token);
        if (userId) {
          const user = await dbService.getUserById(userId);
          if (user && user.isInfluencer) {
            isInfluencer = true;
          }
        }
      }

      const config = await dbService.getGameConfig('g_block_puzzle');
      const rtp = isInfluencer ? 90 : (config.rtpPercent ?? 96.0);
      const diff = isInfluencer ? 'easy' : (config.difficulty || (rtp >= 93 ? 'easy' : rtp >= 75 ? 'medium' : rtp >= 45 ? 'hard' : 'extreme'));
      res.json({
        gameId: config.id,
        name: config.name,
        status: config.status,
        rtpPercent: rtp,
        difficulty: diff,
        isInfluencer: isInfluencer,
        isInfluencerMode: isInfluencer,
        houseEdgeMode: isInfluencer ? 'easy' : (config.houseEdgeMode || 'easy'),
        minBet: config.minBet ?? 1.0,
        maxBet: config.maxBet ?? 500.0,
        maxMultiplier: config.maxMultiplier ?? 100.0,
        antiBailoutMode: isInfluencer ? false : Boolean(config.antiBailoutMode),
        heavyBlocksForce: isInfluencer ? false : Boolean(config.heavyBlocksForce),
        dynamicRetention: isInfluencer ? false : (config.dynamicRetention ?? true),
        streakLimiterMultiplier: isInfluencer ? 100.0 : (config.streakLimiterMultiplier ?? 6.0),
        nearLossPressure: isInfluencer ? false : Boolean(config.nearLossPressure),
        winStreakBrake: isInfluencer ? false : Boolean(config.winStreakBrake),
        antiComboBlocker: isInfluencer ? false : Boolean(config.antiComboBlocker),
        highBetResistance: isInfluencer ? false : Boolean(config.highBetResistance),
        giantPieceFrequency: isInfluencer ? 0 : (config.giantPieceFrequency ?? 25),
        instantLossOnTargetProfit: isInfluencer ? 0 : (config.instantLossOnTargetProfit ?? 0),
        tightenOnHighOccupancy: isInfluencer ? false : Boolean(config.tightenOnHighOccupancy),
        minCashoutMultiplier: config.minCashoutMultiplier ?? 1.05,
        lineMultiplierStep: isInfluencer ? 0.50 : (config.lineMultiplierStep ?? 0.40),
        initialMultiplier: config.initialMultiplier ?? 1.0,
        retentionAggressiveness: isInfluencer ? 'soft' : (config.retentionAggressiveness || 'moderate'),
        forceLossOnMaxMultiplier: isInfluencer ? false : (config.forceLossOnMaxMultiplier ?? true),
        consecutiveWinDecay: isInfluencer ? 0 : (config.consecutiveWinDecay ?? 0.05),
        updatedAt: config.updatedAt,
      });
    } catch (err) {
      console.error('Error fetching game config:', err);
      res.json({
        gameId: 'g_block_puzzle',
        name: 'Block Puzzle iGaming',
        status: 'active',
        rtpPercent: 96.0,
        difficulty: 'easy',
        isInfluencer: false,
        isInfluencerMode: false,
        houseEdgeMode: 'easy',
        minBet: 1.0,
        maxBet: 500.0,
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
      });
    }
  });

  // GET /api/admin/games
  app.get('/api/admin/games', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const liveMetrics = await Promise.all([
        dbService.getGameLiveMetrics('g_block_puzzle'),
        dbService.getGameLiveMetrics('g_zumbla'),
        dbService.getGameLiveMetrics('g_gen_dino'),
      ]);
      const gameDeposits = (await dbService.getAllTransactions()).filter(tx => tx.type === 'deposit' && tx.status === 'approved' && tx.gameId);
      const games = liveMetrics.map((liveData) => {
        const config = liveData.config;
        const deposits = gameDeposits.filter(tx => tx.gameId === config.id);
        return {
          id: config.id,
          name: config.id === 'g_zumbla' ? 'Zumbla Win' : config.id === 'g_gen_dino' ? 'GEN DINO' : config.name,
          category: config.category,
          status: config.status,
          rtpPercent: config.rtpPercent,
          difficulty: config.difficulty,
          minBet: config.minBet,
          maxBet: config.maxBet,
          totalWagered: liveData.totalWagered,
          totalPayout: liveData.totalPayout,
          ggr: liveData.ggr,
          totalBetsCount: liveData.totalBetsCount,
          totalWinsCount: liveData.totalWinsCount,
          totalLossesCount: liveData.totalLossesCount,
          effectiveRtp: liveData.effectiveRtp,
          effectiveHouseEdge: liveData.effectiveHouseEdge,
          houseEdgeMode: config.houseEdgeMode,
          maxMultiplier: config.maxMultiplier,
          antiBailoutMode: Boolean(config.antiBailoutMode),
          heavyBlocksForce: Boolean(config.heavyBlocksForce),
          dynamicRetention: config.dynamicRetention ?? true,
          streakLimiterMultiplier: config.streakLimiterMultiplier ?? 6.0,
          nearLossPressure: Boolean(config.nearLossPressure),
          winStreakBrake: Boolean(config.winStreakBrake),
          antiComboBlocker: Boolean(config.antiComboBlocker),
          highBetResistance: Boolean(config.highBetResistance),
          giantPieceFrequency: config.giantPieceFrequency ?? 25,
          instantLossOnTargetProfit: config.instantLossOnTargetProfit ?? 0,
          tightenOnHighOccupancy: Boolean(config.tightenOnHighOccupancy),
          minCashoutMultiplier: config.minCashoutMultiplier ?? 1.05,
          lineMultiplierStep: config.lineMultiplierStep ?? 0.40,
          initialMultiplier: config.initialMultiplier ?? 1.0,
          retentionAggressiveness: config.retentionAggressiveness || 'moderate',
          forceLossOnMaxMultiplier: config.forceLossOnMaxMultiplier ?? true,
          consecutiveWinDecay: config.consecutiveWinDecay ?? 0.05,
          gameSpeedPercent: config.gameSpeedPercent ?? 100,
          obstacleDensityPercent: config.obstacleDensityPercent ?? 50,
          reactionWindowMs: config.reactionWindowMs ?? 850,
          bonusFrequencyPercent: config.bonusFrequencyPercent ?? 20,
          comboWindowMs: config.comboWindowMs ?? 1200,
          mistakeTolerance: config.mistakeTolerance ?? 1,
          difficultyRampPercent: config.difficultyRampPercent ?? 50,
          easyOpeningRounds: config.easyOpeningRounds ?? 3,
          extremeModeStartRound: config.extremeModeStartRound ?? 12,
          phaseDifficultyMultiplier: config.phaseDifficultyMultiplier ?? 1.25,
          configVersion: config.configVersion ?? 1,
          updatedAt: config.updatedAt,
          updatedBy: config.updatedBy,
          pixDepositsAmount: deposits.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0),
          pixDepositsCount: deposits.length,
          recentBets: liveData.recentBets
        };
      });

      res.json({ games, liveMetrics });
    } catch (err) {
      console.error('Error fetching admin games:', err);
      res.status(500).json({ error: 'Erro ao buscar métricas de jogos.' });
    }
  });

  // PUT /api/admin/games/:id/rtp
  app.put('/api/admin/games/:id/rtp', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        rtpPercent,
        difficulty,
        minBet,
        maxBet,
        houseEdgeMode,
        maxMultiplier,
        antiBailoutMode,
        heavyBlocksForce,
        dynamicRetention,
        streakLimiterMultiplier,
        nearLossPressure,
        winStreakBrake,
        antiComboBlocker,
        highBetResistance,
        giantPieceFrequency,
        instantLossOnTargetProfit,
        tightenOnHighOccupancy,
        minCashoutMultiplier,
        lineMultiplierStep,
        initialMultiplier,
        retentionAggressiveness,
        forceLossOnMaxMultiplier,
        consecutiveWinDecay,
        gameSpeedPercent,
        obstacleDensityPercent,
        reactionWindowMs,
        bonusFrequencyPercent,
        comboWindowMs,
        mistakeTolerance,
        difficultyRampPercent,
        easyOpeningRounds,
        extremeModeStartRound,
        phaseDifficultyMultiplier
      } = req.body;

      const config = await dbService.getGameConfig(id);

      if (typeof rtpPercent === 'number' && rtpPercent >= 0.1 && rtpPercent <= 100) {
        config.rtpPercent = parseFloat(rtpPercent.toFixed(2));
        
        // Sync difficulty automatically if not explicitly provided
        if (!difficulty) {
          if (config.rtpPercent >= 93) config.difficulty = 'easy';
          else if (config.rtpPercent >= 75) config.difficulty = 'medium';
          else if (config.rtpPercent >= 45) config.difficulty = 'hard';
          else config.difficulty = 'extreme';
        }
      }

      if (difficulty && ['easy', 'medium', 'hard', 'extreme'].includes(difficulty)) {
        config.difficulty = difficulty;
        if (typeof rtpPercent !== 'number') {
          if (difficulty === 'easy') config.rtpPercent = 96.0;
          else if (difficulty === 'medium') config.rtpPercent = 85.0;
          else if (difficulty === 'hard') config.rtpPercent = 50.0;
          else if (difficulty === 'extreme') config.rtpPercent = 5.0;
        }
      }

      if (typeof minBet === 'number' && minBet >= 0) {
        config.minBet = minBet;
      }

      if (typeof maxBet === 'number' && maxBet >= config.minBet) {
        config.maxBet = maxBet;
      }

      if (houseEdgeMode) {
        config.houseEdgeMode = houseEdgeMode;
      }

      if (typeof maxMultiplier === 'number' && maxMultiplier > 0) {
        config.maxMultiplier = maxMultiplier;
      }

      if (typeof antiBailoutMode === 'boolean') {
        config.antiBailoutMode = antiBailoutMode;
      }

      if (typeof heavyBlocksForce === 'boolean') {
        config.heavyBlocksForce = heavyBlocksForce;
      }

      if (typeof dynamicRetention === 'boolean') {
        config.dynamicRetention = dynamicRetention;
      }

      if (typeof streakLimiterMultiplier === 'number' && streakLimiterMultiplier >= 1.5) {
        config.streakLimiterMultiplier = streakLimiterMultiplier;
      }

      if (typeof nearLossPressure === 'boolean') {
        config.nearLossPressure = nearLossPressure;
      }

      if (typeof winStreakBrake === 'boolean') {
        config.winStreakBrake = winStreakBrake;
      }

      if (typeof antiComboBlocker === 'boolean') {
        config.antiComboBlocker = antiComboBlocker;
      }

      if (typeof highBetResistance === 'boolean') {
        config.highBetResistance = highBetResistance;
      }

      if (typeof giantPieceFrequency === 'number' && giantPieceFrequency >= 0 && giantPieceFrequency <= 100) {
        config.giantPieceFrequency = giantPieceFrequency;
      }

      if (typeof instantLossOnTargetProfit === 'number' && instantLossOnTargetProfit >= 0) {
        config.instantLossOnTargetProfit = instantLossOnTargetProfit;
      }

      if (typeof tightenOnHighOccupancy === 'boolean') {
        config.tightenOnHighOccupancy = tightenOnHighOccupancy;
      }

      if (typeof minCashoutMultiplier === 'number' && minCashoutMultiplier >= 1.0) {
        config.minCashoutMultiplier = minCashoutMultiplier;
      }

      if (typeof lineMultiplierStep === 'number' && lineMultiplierStep >= 0.05) {
        config.lineMultiplierStep = lineMultiplierStep;
      }

      if (typeof initialMultiplier === 'number' && initialMultiplier >= 1.0 && initialMultiplier <= 5.0) {
        config.initialMultiplier = initialMultiplier;
      }

      if (retentionAggressiveness && ['soft', 'moderate', 'aggressive', 'ruthless', 'impossible'].includes(retentionAggressiveness)) {
        config.retentionAggressiveness = retentionAggressiveness;
      }

      if (typeof forceLossOnMaxMultiplier === 'boolean') {
        config.forceLossOnMaxMultiplier = forceLossOnMaxMultiplier;
      }

      if (typeof consecutiveWinDecay === 'number' && consecutiveWinDecay >= 0 && consecutiveWinDecay <= 0.5) {
        config.consecutiveWinDecay = consecutiveWinDecay;
      }

      if (typeof gameSpeedPercent === 'number' && gameSpeedPercent >= 50 && gameSpeedPercent <= 200) config.gameSpeedPercent = gameSpeedPercent;
      if (typeof obstacleDensityPercent === 'number' && obstacleDensityPercent >= 0 && obstacleDensityPercent <= 100) config.obstacleDensityPercent = obstacleDensityPercent;
      if (typeof reactionWindowMs === 'number' && reactionWindowMs >= 250 && reactionWindowMs <= 3000) config.reactionWindowMs = reactionWindowMs;
      if (typeof bonusFrequencyPercent === 'number' && bonusFrequencyPercent >= 0 && bonusFrequencyPercent <= 100) config.bonusFrequencyPercent = bonusFrequencyPercent;
      if (typeof comboWindowMs === 'number' && comboWindowMs >= 250 && comboWindowMs <= 5000) config.comboWindowMs = comboWindowMs;
      if (typeof mistakeTolerance === 'number' && mistakeTolerance >= 0 && mistakeTolerance <= 5) config.mistakeTolerance = Math.floor(mistakeTolerance);
      if (typeof difficultyRampPercent === 'number' && difficultyRampPercent >= 0 && difficultyRampPercent <= 100) config.difficultyRampPercent = difficultyRampPercent;
      if (typeof easyOpeningRounds === 'number' && easyOpeningRounds >= 0 && easyOpeningRounds <= 10) config.easyOpeningRounds = Math.floor(easyOpeningRounds);
      if (typeof extremeModeStartRound === 'number' && extremeModeStartRound >= 3 && extremeModeStartRound <= 100) config.extremeModeStartRound = Math.floor(extremeModeStartRound);
      if (typeof phaseDifficultyMultiplier === 'number' && phaseDifficultyMultiplier >= 1 && phaseDifficultyMultiplier <= 3) config.phaseDifficultyMultiplier = phaseDifficultyMultiplier;

      config.configVersion = (config.configVersion || 0) + 1;
      config.updatedBy = req.userId;

      await dbService.saveGameConfig(config);

      logSecurityEvent('GAME_RTP_UPDATED', {
        adminId: req.userId,
        gameId: id,
        newRtp: config.rtpPercent,
        difficulty: config.difficulty,
        houseEdgeMode: config.houseEdgeMode,
        antiBailoutMode: config.antiBailoutMode,
        heavyBlocksForce: config.heavyBlocksForce,
        dynamicRetention: config.dynamicRetention,
        streakLimiterMultiplier: config.streakLimiterMultiplier,
        winStreakBrake: config.winStreakBrake,
        antiComboBlocker: config.antiComboBlocker,
        highBetResistance: config.highBetResistance,
        giantPieceFrequency: config.giantPieceFrequency,
        instantLossOnTargetProfit: config.instantLossOnTargetProfit,
        tightenOnHighOccupancy: config.tightenOnHighOccupancy,
        maxMultiplier: config.maxMultiplier,
        lineMultiplierStep: config.lineMultiplierStep,
        retentionAggressiveness: config.retentionAggressiveness,
        forceLossOnMaxMultiplier: config.forceLossOnMaxMultiplier,
        gameSpeedPercent: config.gameSpeedPercent,
        obstacleDensityPercent: config.obstacleDensityPercent,
        reactionWindowMs: config.reactionWindowMs,
        bonusFrequencyPercent: config.bonusFrequencyPercent,
        comboWindowMs: config.comboWindowMs,
        mistakeTolerance: config.mistakeTolerance,
        difficultyRampPercent: config.difficultyRampPercent,
        easyOpeningRounds: config.easyOpeningRounds,
        extremeModeStartRound: config.extremeModeStartRound,
        phaseDifficultyMultiplier: config.phaseDifficultyMultiplier
      });

      res.json({
        success: true,
        message: `Configurações de RTP (${config.rtpPercent}%) e Alavancas de Dificuldade sincronizadas em tempo real!`,
        game: config
      });
    } catch (err) {
      console.error('Error updating game RTP:', err);
      res.status(500).json({ error: 'Erro ao salvar configuração do jogo.' });
    }
  });

  // POST /api/admin/games/:id/toggle
  app.post('/api/admin/games/:id/toggle', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const config = await dbService.getGameConfig(id);

      config.status = config.status === 'active' ? 'inactive' : 'active';
      await dbService.saveGameConfig(config);

      logSecurityEvent('GAME_STATUS_TOGGLED', {
        adminId: req.userId,
        gameId: id,
        newStatus: config.status
      });

      res.json({
        success: true,
        message: `Jogo ${config.name} agora está ${config.status === 'active' ? 'Ativo' : 'Inativo'}.`,
        game: config
      });
    } catch (err) {
      console.error('Error toggling game status:', err);
      res.status(500).json({ error: 'Erro ao alternar status do jogo.' });
    }
  });

  // AUTH: ME

  // AUTH: LOGOUT
  app.post('/api/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      destroySession(token);
      sessions.delete(token);
    }
    logSecurityEvent('USER_LOGOUT', { userId: req.userId, ip: req.ip });
    res.json({ success: true });
  });

  // FINANCE: GET BALANCE & TRANSACTIONS
  app.get('/api/finance/overview', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const userTx = await dbService.getUserTransactions(userId);

      res.json({
        balance: user.balance,
        minWithdraw: user.minWithdraw ?? 100,
        transactions: userTx,
      });
    } catch (err) {
      console.error('Finance overview error:', err);
      res.status(500).json({ error: 'Erro ao carregar dados financeiros.' });
    }
  });

  // FINANCE: DEPOSIT (legacy direct-credit route disabled; use a confirmed PIX charge)
  app.post('/api/finance/deposit', requireAuth, async (req: AuthRequest, res: Response) => {
    return res.status(410).json({ error: 'Rota substituída. Gere a cobrança em POST /api/charges e aguarde a confirmação do pagamento.' });
    /* Direct credit intentionally disabled.
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const { amount } = req.body;
      const numAmount = parseFloat(amount);

      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valor de depósito inválido.' });
      }

      if (numAmount < 5) {
        return res.status(400).json({ error: 'Valor mínimo para depósito é R$ 5,00.' });
      }

      const newBalance = user.balance + numAmount;
      await dbService.updateUserBalance(userId, newBalance);

      // Create Transaction
      const newTx: TransactionDB = {
        id: 'tx_' + crypto.randomBytes(8).toString('hex'),
        userId,
        type: 'deposit',
        amount: numAmount,
        status: 'approved',
        paymentMethod: 'PIX',
        description: 'Depósito via PIX',
        createdAt: new Date().toISOString(),
      };

      await dbService.createTransaction(newTx);

      // Check if user has an affiliate, attribute commission with anti-duplication
      if (user.affiliateId) {
        const commissionAlreadyProcessed = await dbService.checkCommissionExistsByTransactionId(newTx.id);
        if (!commissionAlreadyProcessed) {
          const affiliate = await dbService.getAffiliateById(user.affiliateId);
          if (affiliate) {
            const revShareRate = (affiliate.revSharePercent !== undefined && affiliate.revSharePercent !== null)
              ? affiliate.revSharePercent / 100
              : 0.70;
            const commission = numAmount * revShareRate;
            const updatedTotal = affiliate.commissionTotal + commission;
            const updatedBal = affiliate.affiliateBalance + commission;
            await dbService.updateAffiliateCommissions(affiliate.id, updatedTotal, updatedBal);

            // Record commission history record
            await dbService.createAffiliateCommission({
              id: 'comm_' + crypto.randomBytes(8).toString('hex'),
              affiliateId: affiliate.id,
              referrerUserId: affiliate.userId,
              buyerUserId: userId,
              transactionId: newTx.id,
              amount: commission,
              createdAt: new Date().toISOString(),
            });

            // Notify referrer without mixing with their game balance
            const referrerUser = await dbService.getUserById(affiliate.userId);
            if (referrerUser) {
              sendPushNotification(referrerUser.id, {
                title: 'Você vendeu! 💰',
                body: `Comissão de R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} creditada no seu Painel de Afiliados!`,
                url: '/more'
              }).catch(console.error);
            }
          }
        }
      }

      res.json({
        balance: newBalance,
        transaction: newTx,
        message: 'Depósito realizado com sucesso!',
      });
    } catch (err) {
      console.error('Deposit error:', err);
      res.status(500).json({ error: 'Erro ao processar depósito.' });
    }
    */
  });

  // FINANCE: WITHDRAW (PIX)
  app.post('/api/finance/withdraw', requireAuth, async (req: AuthRequest, res: Response) => {
    return res.status(410).json({ error: 'Rota substituída. Use POST /api/withdrawals com amount e pixKeyId.' });
    /* Legacy flow intentionally disabled: withdrawals must be confirmed by Dotfy webhook.
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const { amount, pixKey } = req.body;
      const numAmount = parseFloat(amount);

      const userMinWithdraw = user.minWithdraw ?? 100;

      if (isNaN(numAmount) || numAmount < userMinWithdraw) {
        return res.status(400).json({ error: `O valor mínimo para saque é de R$ ${userMinWithdraw.toFixed(2).replace('.', ',')}.` });
      }

      if (!pixKey || typeof pixKey !== 'string' || pixKey.trim().length === 0) {
        return res.status(400).json({ error: 'Chave PIX é obrigatória para o saque.' });
      }

      if (user.balance < userMinWithdraw) {
        return res.status(400).json({ error: `Saldo mínimo exigido para realizar saques é de R$ ${userMinWithdraw.toFixed(2).replace('.', ',')}.` });
      }

      if (user.balance < numAmount) {
        return res.status(400).json({ error: 'Saldo insuficiente para realizar este saque.' });
      }

      const newBalance = user.balance - numAmount;
      await dbService.updateUserBalance(userId, newBalance);

      // Create Transaction
      const newTx: TransactionDB = {
        id: 'tx_' + crypto.randomBytes(8).toString('hex'),
        userId,
        type: 'withdrawal',
        amount: numAmount,
        status: 'approved',
        paymentMethod: 'PIX',
        description: `Saque PIX para ${pixKey.trim()}`,
        createdAt: new Date().toISOString(),
      };

      await dbService.createTransaction(newTx);

      res.json({
        balance: newBalance,
        transaction: newTx,
        message: 'Saque processado com sucesso!',
      });
    } catch (err) {
      console.error('Withdraw error:', err);
      res.status(500).json({ error: 'Erro ao processar saque.' });
    }
    */
  });

  // AFFILIATES: GET INFO & INDICATIONS
  app.get('/api/affiliates/info', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;

      let affiliate = await dbService.getAffiliateByUserId(user.id);

      if (!affiliate) {
        // Auto-provision affiliate record with user's referral code or generated code
        const affiliateId = 'aff_' + crypto.randomBytes(12).toString('hex');
        affiliate = {
          id: affiliateId,
          userId: user.id,
          referralCode: user.referralCode || 'REF' + crypto.randomBytes(4).toString('hex').toUpperCase(),
          status: 'active',
          commissionTotal: 0,
          affiliateBalance: 0,
          revSharePercent: 70,
          createdAt: new Date().toISOString(),
        };
        await dbService.createAffiliate(affiliate);
      }

      const referrals = await dbService.getReferralsByAffiliateId(affiliate.id);
      const comms = await dbService.getCommissionsByAffiliateId(affiliate.id);
      const killedTxIds = new Set(comms.filter(c => c.isKilled).map(c => c.transactionId));
      const killedUserIds = new Set(comms.filter(c => c.isKilled).map(c => c.buyerUserId));
      const allGameBets = await dbService.getAllGameBets(1000);

      let rawNetworkDeposits = 0;
      const allIndications = await Promise.all(
        referrals.map(async (ref) => {
          const refUser = await dbService.getUserById(ref.referredUserId);
          let totalDeposited = 0;
          let subReferralsCount = 0;
          let subNetworkDeposits = 0;
          let subNetworkBalances = 0;
          let affiliateBalance = 0;
          let ftdCount = 0;

          if (refUser) {
            const txs = await dbService.getUserTransactions(ref.referredUserId);
            // Filter out transactions that were killed by CPA Killer for this affiliate
            const visibleTxs = txs.filter(t => t.type === 'deposit' && t.status === 'approved' && !killedTxIds.has(t.id));
            totalDeposited = visibleTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            ftdCount = visibleTxs.length > 0 ? 1 : 0;

            // Fetch influencer sub-network if refUser is an affiliate/influencer
            const subAff = await dbService.getAffiliateByUserId(refUser.id);
            if (subAff) {
              affiliateBalance = subAff.affiliateBalance ?? 0;
              const subRefs = await dbService.getReferralsByAffiliateId(subAff.id);
              subReferralsCount = subRefs.length;
              for (const subRef of subRefs) {
                const subUser = await dbService.getUserById(subRef.referredUserId);
                if (subUser) {
                  subNetworkBalances += (subUser.balance ?? 0);
                }
                const subTxs = await dbService.getUserTransactions(subRef.referredUserId);
                // For Master Affiliate viewing an Influencer: show real unfiltered total
                const subDep = subTxs
                  .filter(t => t.type === 'deposit' && t.status === 'approved')
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                subNetworkDeposits += subDep;
                if (subDep > 0) ftdCount += 1;
              }
            }
          }
          rawNetworkDeposits += totalDeposited;

          const isKilledForThisAffiliate = killedUserIds.has(ref.referredUserId) && totalDeposited === 0;
          const latestBet = allGameBets.filter(b => b.userId === ref.referredUserId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
          const lastGameId = latestBet?.gameId || ref.acquisitionGame || refUser?.acquisitionGame || '';
          const lastGameName = lastGameId === 'g_zumbla' ? 'Zumbla Win' : lastGameId === 'g_gen_dino' ? 'GEN DINO' : lastGameId === 'g_block_puzzle' ? 'Block Win' : 'Sem jogo';

          return {
            id: ref.id,
            referredUserId: ref.referredUserId,
            referredName: refUser ? refUser.name : 'Usuário',
            referredEmail: refUser ? refUser.email : '***',
            referredBalance: refUser ? (refUser.balance ?? 0) : 0,
            totalDeposited,
            isInfluencer: refUser ? (refUser as any).isInfluencer || false : false,
            subReferralsCount,
            subNetworkDeposits,
            subNetworkBalances,
            affiliateBalance,
            ftdCount,
            lastGameId,
            lastGameName,
            isKilled: isKilledForThisAffiliate,
            createdAt: ref.createdAt,
          };
        })
      );

      // If CPA Killer is active on this affiliate, filter out killed indications from their view
      const indicationsList = allIndications.filter(ind => !ind.isKilled);
      const totalNetworkDeposits = indicationsList.reduce((sum, ind) => sum + ind.totalDeposited + ind.subNetworkDeposits, 0);
      const totalFtds = indicationsList.reduce((sum, ind) => sum + ind.ftdCount, 0);
      const commissionHistory = await Promise.all(
        comms
          .filter((commission) => !commission.isKilled)
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 200)
          .map(async (commission) => {
            const buyer = await dbService.getUserById(commission.buyerUserId);
            const latestBet = allGameBets
              .filter((bet) => bet.userId === commission.buyerUserId)
              .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
            const gameId = latestBet?.gameId || buyer?.acquisitionGame || '';
            const gameName = gameId === 'g_zumbla' ? 'Zumbla Win' : gameId === 'g_gen_dino' ? 'GEN DINO' : gameId === 'g_block_puzzle' ? 'Block Win' : 'Alliance Hub';
            return {
              id: commission.id,
              amount: Number(commission.amount || 0),
              buyerUserId: commission.buyerUserId,
              buyerName: buyer?.name || 'Jogador indicado',
              gameId,
              gameName,
              createdAt: commission.createdAt,
            };
          })
      );

      const host = req.get('host') || 'paygateway.app';
      const protocol = req.protocol || 'https';
      const referralLink = `${protocol}://${host}/cadastro?ref=${affiliate.referralCode}`;

      res.json({
        id: affiliate.id,
        userId: affiliate.userId,
        referralCode: affiliate.referralCode,
        referralLink,
        status: affiliate.status,
        indicationsCount: indicationsList.length,
        commissionTotal: affiliate.commissionTotal,
        affiliateBalance: affiliate.affiliateBalance,
        revSharePercent: affiliate.revSharePercent ?? 70,
        cpaAmount: affiliate.cpaAmount ?? 0,
        cpaKillerAllowed: !!user.cpaKillerAllowed,
        cpaKillerActive: !!affiliate.cpaKillerActive,
        cpaKillerEveryX: affiliate.cpaKillerEveryX || 5,
        cpaKillerKillY: affiliate.cpaKillerKillY || 1,
        cpaCounter: affiliate.cpaCounter || 0,
        totalNetworkDeposits,
        totalFtds,
        indications: indicationsList,
        commissions: commissionHistory,
        createdAt: affiliate.createdAt,
      });
    } catch (err) {
      console.error('Affiliate info error:', err);
      res.status(500).json({ error: 'Erro ao carregar dados de afiliados.' });
    }
  });

  // CONFIGURE CPA KILLER (AFFILIATE AREA)
  app.put('/api/affiliates/cpa-killer', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      if (!user.cpaKillerAllowed) {
        return res.status(403).json({ error: 'O recurso CPA Killer não está liberado para o seu usuário pelo administrador.' });
      }

      const { cpaKillerActive, cpaKillerEveryX, cpaKillerKillY } = req.body;
      const affiliate = await dbService.getAffiliateByUserId(user.id);
      if (!affiliate) {
        return res.status(404).json({ error: 'Registro de afiliado não encontrado.' });
      }

      const everyX = Math.max(1, parseInt(cpaKillerEveryX) || 5);
      const killY = Math.max(1, parseInt(cpaKillerKillY) || 1);

      if (killY >= everyX) {
        return res.status(400).json({ error: 'A quantidade de CPAs a matar (Y) deve ser estritamente menor do que a quantidade acumulada (X).' });
      }

      await dbService.updateAffiliateFields(affiliate.id, {
        cpaKillerActive: !!cpaKillerActive,
        cpaKillerEveryX: everyX,
        cpaKillerKillY: killY,
      });

      res.json({
        success: true,
        message: 'Configurações de CPA Killer atualizadas com sucesso!',
        cpaKillerActive: !!cpaKillerActive,
        cpaKillerEveryX: everyX,
        cpaKillerKillY: killY,
      });
    } catch (err: any) {
      console.error('CPA Killer config error:', err);
      res.status(500).json({ error: 'Erro ao salvar configurações do CPA Killer.' });
    }
  });

  // UPDATE INDICATED USER BALANCE & INFLUENCER STATUS
  app.post('/api/affiliates/update-indicated-user', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { referredUserId, newBalance, isInfluencer } = req.body;
      if (!referredUserId) {
        return res.status(400).json({ error: 'referredUserId é obrigatório.' });
      }

      const updates: any = {};
      if (typeof newBalance === 'number' && !isNaN(newBalance)) {
        updates.balance = newBalance;
      }
      if (typeof isInfluencer === 'boolean') {
        updates.isInfluencer = isInfluencer;
      }

      await dbService.updateUserFields(referredUserId, updates);
      const updatedUser = await dbService.getUserById(referredUserId);

      res.json({
        success: true,
        message: 'Jogador indicado atualizado com sucesso!',
        user: updatedUser,
      });
    } catch (err) {
      console.error('Update indicated user error:', err);
      res.status(500).json({ error: 'Erro ao atualizar dados do jogador indicado.' });
    }
  });

  // AFFILIATES: WITHDRAW COMMISSIONS (PIX)
  app.post('/api/affiliates/withdraw', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const affiliate = await dbService.getAffiliateByUserId(userId);
      if (!affiliate) {
        return res.status(404).json({ error: 'Conta de afiliado não encontrada.' });
      }

      const { amount, pixKey } = req.body;
      const numAmount = parseFloat(amount);

      const minWithdraw = 20.0; // Valor mínimo para saque de afiliados

      if (isNaN(numAmount) || numAmount < minWithdraw) {
        return res.status(400).json({ error: `O valor mínimo para saque de comissões é de R$ ${minWithdraw.toFixed(2).replace('.', ',')}.` });
      }

      if (!pixKey || typeof pixKey !== 'string' || pixKey.trim().length === 0) {
        return res.status(400).json({ error: 'Chave PIX é obrigatória para o saque.' });
      }

      const currentAffBalance = typeof affiliate.affiliateBalance === 'number' && !isNaN(affiliate.affiliateBalance)
        ? affiliate.affiliateBalance
        : 0;

      if (currentAffBalance < numAmount) {
        return res.status(400).json({ error: `Saldo de comissões insuficiente (Disponível: R$ ${currentAffBalance.toFixed(2).replace('.', ',')}).` });
      }

      const newAffBalance = parseFloat((currentAffBalance - numAmount).toFixed(2));
      await dbService.updateAffiliateRates(affiliate.id, { affiliateBalance: newAffBalance });

      // Create affiliate withdrawal transaction
      const newTx: TransactionDB = {
        id: 'tx_aff_wd_' + crypto.randomBytes(8).toString('hex'),
        userId,
        type: 'withdrawal',
        amount: numAmount,
        status: 'approved',
        paymentMethod: 'Afiliados',
        description: `Saque de Comissões de Afiliado para PIX: ${pixKey.trim()}`,
        createdAt: new Date().toISOString(),
      };
      await dbService.createTransaction(newTx);

      res.json({
        success: true,
        affiliateBalance: newAffBalance,
        transaction: newTx,
        message: 'Saque de comissões de afiliado processado com sucesso!',
      });
    } catch (err) {
      console.error('Affiliate withdraw error:', err);
      res.status(500).json({ error: 'Erro ao processar saque de comissões de afiliado.' });
    }
  });

  // GAMES: LIST
  app.get('/api/games', async (_req: Request, res: Response) => {
    try {
      const games = await dbService.getGames();
      res.json(games);
    } catch (err) {
      console.error('Games error:', err);
      res.status(500).json({ error: 'Erro ao carregar lista de jogos.' });
    }
  });

  // GAME: USER STATS
  app.get('/api/game/stats', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = req.user!;
      let stats = await dbService.getGameStats(userId);
      if (!stats) {
        stats = {
          id: userId,
          userId,
          userName: user.name,
          highScore: 0,
          gamesPlayed: 0,
          linesCleared: 0,
          maxCombo: 0,
          level: 1,
          updatedAt: new Date().toISOString(),
        };
      }
      res.json(stats);
    } catch (err) {
      console.error('Game stats error:', err);
      res.status(500).json({ error: 'Erro ao buscar estatísticas do jogo.' });
    }
  });

  // GAME: START BET
  app.post('/api/game/start-bet', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const { betAmount } = req.body;
      const numBet = parseFloat(betAmount);

      if (isNaN(numBet) || numBet <= 0) {
        return res.status(400).json({ error: 'Valor de aposta inválido.' });
      }

      const gameConfig = await dbService.getGameConfig('g_block_puzzle');
      if (gameConfig.status === 'inactive') {
        return res.status(400).json({ error: 'O jogo está temporariamente indisponível para apostas.' });
      }

      if (numBet < (gameConfig.minBet || 1.0)) {
        return res.status(400).json({ error: `Aposta mínima para este jogo é de R$ ${(gameConfig.minBet || 1.0).toFixed(2)}.` });
      }

      if (numBet > (gameConfig.maxBet || 500.0)) {
        return res.status(400).json({ error: `Aposta máxima permitida é de R$ ${(gameConfig.maxBet || 500.0).toFixed(2)}.` });
      }

      const isUserInfluencer = Boolean(user.isInfluencer);
      const currentBalance = isUserInfluencer ? Number(user.promoBalance ?? 1000) : (typeof user.balance === 'number' && !isNaN(user.balance) ? user.balance : 0);
      if (currentBalance < numBet) {
        return res.status(400).json({ error: 'Saldo insuficiente para iniciar o jogo.' });
      }

      const newBalance = parseFloat((currentBalance - numBet).toFixed(2));
      if (isUserInfluencer) await dbService.updateUserFields(userId, { promoBalance: newBalance });
      else await dbService.updateUserBalance(userId, newBalance);
      const betId = 'bet_' + crypto.randomBytes(8).toString('hex');
      const newGameBet: GameBetDB = {
        id: betId,
        userId,
        userName: user.name || user.email,
        gameId: 'g_block_puzzle',
        betAmount: numBet,
        multiplier: 1.0,
        payoutAmount: 0,
        profitAmount: 0,
        status: 'active',
        difficulty: isUserInfluencer ? 'easy' : (gameConfig.difficulty || 'easy'),
        rtpPercent: isUserInfluencer ? 90 : (gameConfig.rtpPercent || 96.0),
        isPromotional: isUserInfluencer,
        createdAt: new Date().toISOString(),
      };
      await dbService.recordGameBet(newGameBet);

      // Accumulate real game statistics in GameConfig
      if (!isUserInfluencer) {
        gameConfig.totalWagered = parseFloat(((gameConfig.totalWagered || 0) + numBet).toFixed(2));
        gameConfig.totalBetsCount = (gameConfig.totalBetsCount || 0) + 1;
        gameConfig.ggr = parseFloat((gameConfig.totalWagered - (gameConfig.totalPayout || 0)).toFixed(2));
        await dbService.saveGameConfig(gameConfig);
      }

      res.json({
        success: true,
        betId,
        balance: newBalance,
        isInfluencerMode: isUserInfluencer,
        message: isUserInfluencer
          ? `Rodada promocional iniciada! (⭐ Carteira demo • 90% de vitórias)`
          : `Aposta de R$ ${numBet.toFixed(2)} confirmada!`,
      });
    } catch (err) {
      console.error('Start bet error:', err);
      res.status(500).json({ error: 'Erro ao processar aposta inicial.' });
    }
  });

  // GAME: CASHOUT
  app.post('/api/game/cashout', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = await dbService.getUserById(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const { betId, betAmount, multiplier, profitAmount } = req.body;
      const numProfit = parseFloat(profitAmount);
      const numBet = parseFloat(betAmount) || 0;
      const numMultiplier = parseFloat(multiplier) || 1;

      if (isNaN(numProfit) || numProfit <= 0) {
        return res.status(400).json({ error: 'Valor de lucro inválido.' });
      }

      const bet = betId ? await dbService.getGameBet(betId) : null;
      const isPromotional = Boolean(bet?.isPromotional || user.isInfluencer);
      const currentBalance = isPromotional ? Number(user.promoBalance ?? 1000) : (typeof user.balance === 'number' && !isNaN(user.balance) ? user.balance : 0);
      const newBalance = parseFloat((currentBalance + numProfit).toFixed(2));
      if (isPromotional) await dbService.updateUserFields(userId, { promoBalance: newBalance });
      else await dbService.updateUserBalance(userId, newBalance);

      const gameConfig = await dbService.getGameConfig('g_block_puzzle');

      // Update GameBet if betId provided or find recent active bet
      if (betId) {
        await dbService.updateGameBet(betId, {
          payoutAmount: numProfit,
          profitAmount: parseFloat((numProfit - numBet).toFixed(2)),
          multiplier: numMultiplier,
          status: 'cashed_out'
        });
      }

      // Accumulate payout & GGR in GameConfig for Block Puzzle
      if (!isPromotional) {
        gameConfig.totalPayout = parseFloat(((gameConfig.totalPayout || 0) + numProfit).toFixed(2));
        gameConfig.ggr = parseFloat(((gameConfig.totalWagered || 0) - gameConfig.totalPayout).toFixed(2));
        await dbService.saveGameConfig(gameConfig);
      }

      const newTx: TransactionDB = {
        id: 'tx_win_' + crypto.randomBytes(8).toString('hex'),
        userId,
        type: 'deposit',
        amount: numProfit,
        status: 'approved',
        paymentMethod: 'BlockWin',
        description: `Lucro do Jogo BlockWin (${numMultiplier.toFixed(2)}x de R$ ${numBet.toFixed(2)})`,
        createdAt: new Date().toISOString(),
      };
      if (!isPromotional) await dbService.createTransaction(newTx);

      res.json({
        success: true,
        balance: newBalance,
        profit: numProfit,
        message: isPromotional ? `Prêmio promocional de R$ ${numProfit.toFixed(2)} adicionado à carteira demo.` : `Cashout realizado! +R$ ${numProfit.toFixed(2)} adicionado ao seu saldo!`,
      });
    } catch (err) {
      console.error('Game cashout error:', err);
      res.status(500).json({ error: 'Erro ao processar cashout.' });
    }
  });

  // GAME: RECORD SESSION / GAME OVER
  app.post('/api/game/session', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = req.user!;
      const { betId, score, lines, maxCombo } = req.body;

      const numScore = Math.max(0, parseInt(score) || 0);
      const numLines = Math.max(0, parseInt(lines) || 0);
      const numCombo = Math.max(0, parseInt(maxCombo) || 0);

      // If a betId was active and game over occurred without cashout, mark as lost
      if (betId) {
        await dbService.updateGameBet(betId, {
          status: 'lost',
          multiplier: 0,
          payoutAmount: 0,
          profitAmount: 0,
        });
      }

      const updatedStats = await dbService.recordGameSession(
        userId,
        user.name,
        numScore,
        numLines,
        numCombo
      );

      res.json({ success: true, stats: updatedStats });
    } catch (err) {
      console.error('Game session record error:', err);
      res.status(500).json({ error: 'Erro ao registrar sessão do jogo.' });
    }
  });

  // ZUMBLA: inicia uma rodada usando a mesma carteira do usuário atual.
  app.post('/api/game/zumbla/start', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const betAmount = Number(req.body?.betAmount);
      if (![1, 2, 5, 10, 20].includes(betAmount)) {
        return res.status(400).json({ error: 'Selecione uma entrada válida: R$ 1, R$ 2, R$ 5, R$ 10 ou R$ 20.' });
      }
      const sessionId = sanitizeString(String(req.body?.sessionId || crypto.randomUUID()), 80);
      const deviceId = sanitizeString(String(req.body?.deviceId || ''), 80);
      const userAgent = sanitizeString(String(req.get('user-agent') || ''), 240);
      const forwardedIp = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      const ipHash = crypto.createHash('sha256').update(forwardedIp).digest('hex').slice(0, 24);
      const result = await dbService.startZumblaBet(req.userId!, betAmount, { sessionId, deviceId, userAgent, ipHash });
      return res.json({ success: true, gameId: 'g_zumbla', ...result });
    } catch (err: any) {
      console.error('Zumbla start error:', err);
      const message = err?.message || 'Erro ao iniciar a rodada do Zumbla.';
      return res.status(message.includes('Saldo') ? 400 : 500).json({ error: message });
    }
  });

  app.post('/api/game/zumbla/telemetry', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const betId = sanitizeString(String(req.body?.betId || ''), 80);
      const type = sanitizeString(String(req.body?.type || ''), 32).toUpperCase();
      const score = Math.max(0, Math.min(10_000_000, Math.floor(Number(req.body?.score || 0))));
      const elapsedMs = Math.max(0, Math.min(3_600_000, Math.floor(Number(req.body?.elapsedMs || 0))));
      const sequence = Math.max(1, Math.min(100_000, Math.floor(Number(req.body?.sequence || 1))));
      if (!betId || !['START', 'SCORE', 'SUCCESS', 'FAIL', 'CASHOUT', 'EXIT'].includes(type)) {
        return res.status(400).json({ error: 'Evento de jogo inválido.' });
      }
      await dbService.recordZumblaEvent(req.userId!, betId, { type, score, elapsedMs, sequence });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(/inválida/i.test(err?.message || '') ? 403 : 500).json({ error: err?.message || 'Erro ao registrar evento.' });
    }
  });

  app.get('/api/admin/games/g_zumbla/rounds', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const status = sanitizeString(String(req.query.status || ''), 20);
      const affiliateId = sanitizeString(String(req.query.affiliateId || ''), 80);
      const userId = sanitizeString(String(req.query.userId || ''), 80);
      const from = Date.parse(String(req.query.from || '')) || 0;
      const to = Date.parse(String(req.query.to || '')) || Number.MAX_SAFE_INTEGER;
      const all = await dbService.getAllGameBets(1000);
      const rounds = all.filter((bet) => bet.gameId === 'g_zumbla')
        .filter((bet) => !status || bet.status === status)
        .filter((bet) => !affiliateId || bet.affiliateId === affiliateId)
        .filter((bet) => !userId || bet.userId === userId)
        .filter((bet) => { const time = Date.parse(bet.createdAt); return time >= from && time <= to; })
        .slice(0, 500);
      const wagered = rounds.reduce((sum, bet) => sum + Number(bet.betAmount || 0), 0);
      const paid = rounds.reduce((sum, bet) => sum + Number(bet.payoutAmount || 0), 0);
      return res.json({
        rounds,
        metrics: { rounds: rounds.length, wagered, paid, ggr: Number((wagered - paid).toFixed(2)), realRtp: wagered > 0 ? Number(((paid / wagered) * 100).toFixed(2)) : 0 },
      });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao consultar rastreamento do Zumbla.' });
    }
  });

  // ZUMBLA: liquidação única; o backend calcula o multiplicador e o prêmio.
  app.post('/api/game/zumbla/settle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const betId = sanitizeString(String(req.body?.betId || ''), 80);
      const outcome = req.body?.outcome === 'win' ? 'win' : req.body?.outcome === 'loss' ? 'loss' : null;
      const score = Math.max(0, Math.min(10_000_000, Number(req.body?.score || 0)));
      if (!betId || !outcome || !Number.isFinite(score)) {
        return res.status(400).json({ error: 'Resultado de rodada inválido.' });
      }
      const result = await dbService.settleZumblaBet(req.userId!, betId, outcome, score);
      await dbService.recordGameSession(req.userId!, req.user?.name || 'Jogador', score, 0, 0).catch(() => null);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      console.error('Zumbla settle error:', err);
      const message = err?.message || 'Erro ao finalizar a rodada do Zumbla.';
      const clientError = /não encontrada|inválida|já foi finalizada/i.test(message);
      return res.status(clientError ? 409 : 500).json({ error: message });
    }
  });

  // GEN DINO: carteira, rodada e resultado persistidos no Firebase.
  app.get('/api/game/gen-dino/state', requireAuth, async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, balance: user.isInfluencer ? Number(user.promoBalance ?? 1000) : Number(user.balance || 0), isPromotional: Boolean(user.isInfluencer) },
      gameId: 'g_gen_dino',
      coinValue: 1,
    });
  });

  app.post('/api/game/gen-dino/start', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const betAmount = Number(req.body?.betAmount);
      if (![1, 5, 10, 20].includes(betAmount)) {
        return res.status(400).json({ error: 'Selecione uma aposta válida: R$ 1, R$ 5, R$ 10 ou R$ 20.' });
      }
      const sessionId = sanitizeString(String(req.body?.sessionId || crypto.randomUUID()), 80);
      const deviceId = sanitizeString(String(req.body?.deviceId || ''), 80);
      const userAgent = sanitizeString(String(req.get('user-agent') || ''), 240);
      const forwardedIp = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      const ipHash = crypto.createHash('sha256').update(forwardedIp).digest('hex').slice(0, 24);
      const result = await dbService.startGenDinoBet(req.userId!, betAmount, { sessionId, deviceId, userAgent, ipHash });
      return res.json({ success: true, gameId: 'g_gen_dino', ...result });
    } catch (err: any) {
      console.error('GEN DINO start error:', err);
      const message = err?.message || 'Erro ao iniciar a corrida do GEN DINO.';
      return res.status(/saldo|indisponível/i.test(message) ? 400 : 500).json({ error: message });
    }
  });

  app.post('/api/game/gen-dino/settle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const betId = sanitizeString(String(req.body?.betId || ''), 90);
      const outcome = req.body?.outcome === 'cashout' ? 'cashout' : req.body?.outcome === 'loss' ? 'loss' : null;
      const coins = Math.max(0, Math.min(250, Math.floor(Number(req.body?.coins || 0))));
      const score = Math.max(0, Math.min(10_000_000, Math.floor(Number(req.body?.score || 0))));
      if (!betId || !outcome || !Number.isFinite(coins) || !Number.isFinite(score)) {
        return res.status(400).json({ error: 'Resultado de corrida inválido.' });
      }
      const result = await dbService.settleGenDinoBet(req.userId!, betId, outcome, coins, score);
      await dbService.recordGameSession(req.userId!, req.user?.name || 'Jogador', score, 0, coins).catch(() => null);
      return res.json({ success: true, gameId: 'g_gen_dino', ...result });
    } catch (err: any) {
      console.error('GEN DINO settle error:', err);
      const message = err?.message || 'Erro ao finalizar a corrida do GEN DINO.';
      return res.status(/não encontrada|inválida|já foi finalizada/i.test(message) ? 409 : 500).json({ error: message });
    }
  });

  // GAME: PUBLIC / AUTHENTICATED RANKING
  app.get('/api/game/ranking', async (_req: Request, res: Response) => {
    try {
      const ranking = await dbService.getRanking();
      const sanitizedRanking = ranking.slice(0, 50).map((r, index) => ({
        rank: index + 1,
        userName: r.userName || `Jogador ${r.userId.substring(0, 5)}`,
        highScore: r.highScore,
        linesCleared: r.linesCleared,
        gamesPlayed: r.gamesPlayed,
        level: r.level || 1,
      }));

      res.json(sanitizedRanking);
    } catch (err) {
      console.error('Ranking error:', err);
      res.status(500).json({ error: 'Erro ao buscar ranking.' });
    }
  });

  // --- DOTFY PIX CHARGES API PROXY & DEPOSITS ---
  const DOTFY_API_KEY = (process.env.DOTFY_API_KEY || '').trim();
  const DOTFY_BASE_URL = (process.env.DOTFY_BASE_URL || "https://app.dotfy.com.br").replace(/\/$/, '');

  interface StoredCharge {
    id: string;
    chargeId: string;
    correlationID: string;
    transactionID: string;
    qrCode: string;
    qrCodeImage: string;
    paymentLink: string;
    expiresAt: string;
    value: number; // em centavos
    valueInReais: number;
    description: string;
    customer?: any;
    status: "PENDING" | "PAID" | "COMPLETED" | "EXPIRED" | "CANCELLED";
    createdAt: string;
    split?: any[];
    webhook_url?: string;
    rawResponse?: any;
    userId?: string;
    credited?: boolean;
    gameId?: string;
  }

  const memoryCharges = new Map<string, StoredCharge>();
  const memoryWebhooks: Array<{ id: string; timestamp: string; payload: any }> = [];

  function maskToken(token: string) {
    if (!token || token.length < 8) return "********";
    return token.substring(0, 7) + "..." + token.substring(token.length - 4);
  }

  async function creditPaidChargeUser(charge: StoredCharge) {
    const isChargePaid = charge.status === 'PAID' || charge.status === 'COMPLETED' || (charge as any).isPaid === true;
    if (!isChargePaid || charge.credited || !charge.userId) return;
    charge.status = 'PAID';
    charge.credited = true;

    try {
      const user = await dbService.getUserById(charge.userId);
      if (!user) return;

      const depositVal = charge.valueInReais || (charge.value / 100);
      const newBalance = user.balance + depositVal;
      await dbService.updateUserBalance(user.id, newBalance);

      const newTx: TransactionDB = {
        id: 'tx_' + crypto.randomBytes(8).toString('hex'),
        userId: user.id,
        type: 'deposit',
        amount: depositVal,
        status: 'approved',
        paymentMethod: 'Pix',
        description: charge.description || 'Depósito via Pix',
        createdAt: new Date().toISOString(),
        gameId: charge.gameId,
        chargeCorrelationID: charge.correlationID,
      };
      await dbService.createTransaction(newTx);

      // Dispara Notificação Web Push Real para o celular do usuário (iOS / Android)
      sendPushNotification(user.id, {
        title: 'Depósito Confirmado! ⚡',
        body: `Seu depósito de R$ ${depositVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi creditado com sucesso!`,
        url: '/'
      }).catch(console.error);

      // Affiliate Commission
      if (user.affiliateId) {
        const commissionAlreadyProcessed = await dbService.checkCommissionExistsByTransactionId(newTx.id);
        if (!commissionAlreadyProcessed) {
          const affiliate = await dbService.getAffiliateById(user.affiliateId);
          if (affiliate) {
            const referrerUser = await dbService.getUserById(affiliate.userId);

            // Check if referrerUser has a parent Master Affiliate
            const masterAffiliateId = referrerUser?.affiliateId;
            const masterAffiliate = masterAffiliateId ? await dbService.getAffiliateById(masterAffiliateId) : null;
            const masterUser = masterAffiliate ? await dbService.getUserById(masterAffiliate.userId) : null;

            // 1. MASTER AFFILIATE CREDIT (ALWAYS 100% FULL CREDIT)
            if (masterAffiliate && masterUser) {
              const masterRevShareRate = (masterAffiliate.revSharePercent !== undefined && masterAffiliate.revSharePercent !== null)
                ? masterAffiliate.revSharePercent / 100
                : 0.70;
              const masterComm = depositVal * masterRevShareRate;
              await dbService.updateAffiliateCommissions(
                masterAffiliate.id,
                masterAffiliate.commissionTotal + masterComm,
                masterAffiliate.affiliateBalance + masterComm
              );
              await dbService.createAffiliateCommission({
                id: 'comm_m_' + crypto.randomBytes(8).toString('hex'),
                affiliateId: masterAffiliate.id,
                referrerUserId: masterAffiliate.userId,
                buyerUserId: user.id,
                transactionId: newTx.id,
                amount: masterComm,
                isKilled: false,
                createdAt: new Date().toISOString(),
              });

              sendPushNotification(masterUser.id, {
                title: 'Você vendeu! 💰',
                body: `Comissão de rede de R$ ${masterComm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} creditada no seu Painel de Afiliados!`,
                url: '/more'
              }).catch(console.error);
            }

            // 2. INFLUENCER / DIRECT AFFILIATE CREDIT (SUBJECT TO CPA KILLER)
            let isKilled = false;
            if (
              affiliate.cpaKillerActive &&
              (affiliate.cpaKillerEveryX || 0) > 0 &&
              (affiliate.cpaKillerKillY || 0) > 0
            ) {
              const everyX = affiliate.cpaKillerEveryX!;
              const killY = affiliate.cpaKillerKillY!;
              const nextCounter = (affiliate.cpaCounter || 0) + 1;

              const cyclePos = nextCounter % everyX === 0 ? everyX : (nextCounter % everyX);
              if (cyclePos > (everyX - killY)) {
                isKilled = true;
              }

              await dbService.updateAffiliateFields(affiliate.id, { cpaCounter: nextCounter });
            }

            if (!isKilled) {
              const revShareRate = (affiliate.revSharePercent !== undefined && affiliate.revSharePercent !== null)
                ? affiliate.revSharePercent / 100
                : 0.70;
              const commission = depositVal * revShareRate;
              await dbService.updateAffiliateCommissions(
                affiliate.id,
                affiliate.commissionTotal + commission,
                affiliate.affiliateBalance + commission
              );
              await dbService.createAffiliateCommission({
                id: 'comm_' + crypto.randomBytes(8).toString('hex'),
                affiliateId: affiliate.id,
                referrerUserId: affiliate.userId,
                buyerUserId: user.id,
                transactionId: newTx.id,
                amount: commission,
                isKilled: false,
                createdAt: new Date().toISOString(),
              });

              if (referrerUser) {
                // Dispara Notificação Web Push de Venda no Painel de Afiliados
                sendPushNotification(referrerUser.id, {
                  title: 'Você vendeu! 💰',
                  body: `Sua comissão de R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} foi creditada no seu Painel de Afiliados!`,
                  url: '/more'
                }).catch(console.error);
              }
            } else {
              await dbService.createAffiliateCommission({
                id: 'comm_k_' + crypto.randomBytes(8).toString('hex'),
                affiliateId: affiliate.id,
                referrerUserId: affiliate.userId,
                buyerUserId: user.id,
                transactionId: newTx.id,
                amount: 0,
                isKilled: true,
                createdAt: new Date().toISOString(),
              });
              console.log(`[CPA Killer Active] Commission for deposit ${newTx.id} killed for Influencer ${affiliate.id}. Master Affiliate received full credit.`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error crediting paid charge user:', err);
    }
  }

  // 1. Health & Config Endpoint
  app.get("/api/dotfy/health", (_req, res) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      dotfyKeyConfigured: !!DOTFY_API_KEY,
      maskedDefaultKey: maskToken(DOTFY_API_KEY),
      storedChargesCount: memoryCharges.size
    });
  });

  // --- CADASTRAR CHAVE PIX (DOTFY API PROXY) ---
  app.post("/api/pix-keys", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const apiKeyToUse = DOTFY_API_KEY;
      const sessionUserId = req.userId!;
      if (req.user?.isInfluencer) return res.status(403).json({ error: "Conta promocional não cadastra chave PIX." });
      if (!apiKeyToUse) return res.status(503).json({ error: "Integração PIX não configurada no servidor." });

      const { type, key, name } = req.body;

      if (!type || !key || !name) {
        return res.status(400).json({ error: "Parâmetros 'type', 'key' e 'name' são obrigatórios." });
      }

      const cleanType = String(type).toUpperCase().trim();
      const cleanKey = String(key).trim();
      const cleanName = String(name).trim();

      if (!['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'].includes(cleanType)) {
        return res.status(400).json({ error: "Tipo de chave PIX inválido. Tipos aceitos: CPF, CNPJ, EMAIL, PHONE, RANDOM." });
      }

      const dotfyPayload = {
        type: cleanType,
        key: cleanKey,
        name: cleanName
      };

      console.log(`[Dotfy PIX Key API] Cadastrando chave PIX:`, dotfyPayload);

      try {
        const dotfyResponse = await fetch(`${DOTFY_BASE_URL}/api/pix-keys`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKeyToUse}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(dotfyPayload)
        });

        const responseText = await dotfyResponse.text();
        let responseData: any = {};
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { message: responseText };
        }

        if (dotfyResponse.ok && responseData?.pixKey) {
          const approvedKey = {
            ...responseData.pixKey,
            status: "APPROVED",
            isVerified: true
          };
          if (sessionUserId) {
            const currentUser = await dbService.getUserById(sessionUserId);
            const existingKeys = currentUser?.pixKeys || (currentUser?.pixKey ? [currentUser.pixKey] : []);
            const updatedKeys = [approvedKey, ...existingKeys.filter(k => k.id !== approvedKey.id)];
            await dbService.updateUserFields(sessionUserId, { pixKey: approvedKey, pixKeys: updatedKeys });
          }
          logSecurityEvent('PIX_KEY_REGISTERED', { type: cleanType, name: cleanName, userId: sessionUserId });
          return res.status(200).json({ ...responseData, pixKey: approvedKey, message: "Chave PIX cadastrada e aprovada com sucesso!" });
        } else {
          console.warn(`[Dotfy PIX Key Response] HTTP ${dotfyResponse.status}:`, responseData);
          return res.status(dotfyResponse.status >= 400 && dotfyResponse.status < 500 ? dotfyResponse.status : 502).json({ error: responseData?.message || responseData?.error || "A Dotfy recusou o cadastro da chave PIX." });
        }
      } catch (fetchErr: any) {
        console.error("[Dotfy PIX Key Fetch Error]", fetchErr);
        return res.status(502).json({ error: "Não foi possível conectar à Dotfy para cadastrar a chave PIX." });
      }
    } catch (err: any) {
      console.error("Erro interno ao cadastrar chave PIX:", err);
      return res.status(500).json({ error: "Erro ao cadastrar chave PIX." });
    }
  });

  app.get("/api/pix-keys", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.isInfluencer) return res.json({ pixKeys: [] });
      const user = await dbService.getUserById(req.userId!);
      if (user) {
        const rawKeys = user.pixKeys || (user.pixKey ? [user.pixKey] : []);
        const approvedKeys = rawKeys.map((k: any) => ({
          ...k,
          status: "APPROVED",
          isVerified: true
        }));
        return res.json({ pixKeys: approvedKeys });
      }

      return res.json({ pixKeys: [] });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao buscar chaves PIX." });
    }
  });

  // --- SOLICITAR SAQUE (POST /api/withdrawals - DOTFY) ---
  app.post("/api/withdrawals", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.isInfluencer) return res.status(403).json({ error: "Conta promocional de influenciador não realiza saques." });
      if (!DOTFY_API_KEY) return res.status(503).json({ error: "Integração de saques indisponível: configure DOTFY_API_KEY no servidor." });
      if (DOTFY_API_KEY.startsWith('vk_test_')) return res.status(403).json({ error: "Contas de teste não podem realizar saques." });
      if (!DOTFY_API_KEY.startsWith('vk_live_')) return res.status(503).json({ error: "DOTFY_API_KEY inválida no servidor." });

      const sessionUserId = req.userId!;
      const { amount, pixKeyId } = req.body;
      const numAmount = Number(amount);
      const user = await dbService.getUserById(sessionUserId);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
      const userMinWithdraw = Math.max(4, user.minWithdraw ?? 100);

      if (!Number.isFinite(numAmount) || numAmount < userMinWithdraw) {
        return res.status(400).json({ error: `O valor mínimo para saque é de R$ ${userMinWithdraw.toFixed(2).replace('.', ',')}.` });
      }

      if (!pixKeyId || typeof pixKeyId !== 'string' || !pixKeyId.trim()) {
        return res.status(400).json({ error: "O parâmetro 'pixKeyId' com o ID da chave PIX é obrigatório." });
      }

      if (user.balance < numAmount) return res.status(400).json({ error: "Saldo insuficiente para realizar este saque." });
      const userKeys = user.pixKeys || (user.pixKey ? [user.pixKey] : []);
      const foundPixKey = userKeys.find((key: any) => key.id === pixKeyId);
      if (!foundPixKey) return res.status(400).json({ error: "A chave PIX selecionada não pertence ao usuário." });
      if (String(foundPixKey.status || 'APPROVED').toUpperCase() !== 'APPROVED') return res.status(400).json({ error: "A chave PIX precisa estar aprovada para receber saques." });

      const dotfyPayload = {
        amount: numAmount,
        pixKeyId: String(foundPixKey.id).trim()
      };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let dotfyResponse: globalThis.Response;
      try {
        dotfyResponse = await fetch(`${DOTFY_BASE_URL}/api/withdrawals`, { method:"POST", headers:{ Authorization:`Bearer ${DOTFY_API_KEY}`, "Content-Type":"application/json", Accept:"application/json" }, body:JSON.stringify(dotfyPayload), signal:controller.signal });
      } catch (error: any) {
        return res.status(502).json({ error: error?.name === 'AbortError' ? "A Dotfy demorou para responder. Nenhum saldo foi alterado." : "Não foi possível conectar à Dotfy. Nenhum saldo foi alterado." });
      } finally { clearTimeout(timeout); }

      const responseText = await dotfyResponse.text();
      let responseData: any = {};
      try { responseData = JSON.parse(responseText); } catch { responseData = { message: responseText }; }
      if (!dotfyResponse.ok || !responseData?.withdrawal?.id) {
        const message = responseData?.error?.message || responseData?.error || responseData?.message || "A Dotfy recusou a solicitação de saque.";
        return res.status(dotfyResponse.status >= 400 && dotfyResponse.status < 500 ? dotfyResponse.status : 502).json({ error: message, code: responseData?.code });
      }

      const withdrawalResult = responseData.withdrawal;
      const updatedBalance = user.balance - numAmount;
      const newTx: TransactionDB = {
        id: 'tx_wd_' + crypto.randomBytes(8).toString('hex'), userId:sessionUserId, type:'withdrawal', amount:numAmount, status:'pending', paymentMethod:'PIX',
        description:`Saque PIX Dotfy (${foundPixKey.type || 'PIX'})`, createdAt:new Date().toISOString(), provider:'DOTFY', providerWithdrawalId:withdrawalResult.id,
        providerStatus:withdrawalResult.status || 'PROCESSING', fee:Number(withdrawalResult.fee || 0) / 100, netAmount:Number(withdrawalResult.netAmount || 0) / 100
      };
      await dbService.updateUserBalance(sessionUserId, updatedBalance);
      await dbService.createTransaction(newTx);
      logSecurityEvent('WITHDRAWAL_REQUESTED', { userId:sessionUserId, amount:numAmount, pixKeyId:foundPixKey.id, providerWithdrawalId:withdrawalResult.id });

      return res.status(200).json({
        withdrawal: withdrawalResult,
        balance: updatedBalance,
        transaction: newTx,
        message: "Solicitação enviada à Dotfy e aguardando liquidação."
      });

    } catch (err: any) {
      console.error("Erro interno ao processar saque:", err);
      return res.status(500).json({ error: "Erro ao processar solicitação de saque." });
    }
  });

  // 2. POST /api/charges -> Proxy para API Dotfy
  app.post("/api/charges", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user?.isInfluencer) return res.status(403).json({ error: "Conta promocional de influenciador utiliza apenas carteira demo e não gera PIX." });
      const {
        value,
        description,
        expiresIn,
        customer,
        webhook_url,
        split,
        isSimulated,
        gameId
      } = req.body;
      const targetUserId = req.userId!;
      const token = DOTFY_API_KEY;
      const allowedGameIds = new Set(['platform', 'g_block_puzzle', 'g_zumbla', 'g_gen_dino']);
      const chargeGameId = allowedGameIds.has(String(gameId || 'platform')) ? String(gameId || 'platform') : 'platform';

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "API_KEY_MISSING",
          message: "Chave de API (Bearer Token) não configurada."
        });
      }

      const dotfyPayload: Record<string, any> = {};

      if (value !== undefined && value !== null) {
        dotfyPayload.value = Number(value);
      }
      if (description) dotfyPayload.description = String(description).slice(0, 255);
      if (expiresIn) dotfyPayload.expiresIn = Number(expiresIn);

      if (customer && typeof customer === "object") {
        const cleanCustomer: Record<string, string> = {};

        if (customer.name && String(customer.name).trim().length >= 2) {
          cleanCustomer.name = String(customer.name).trim().slice(0, 100);
        }

        if (customer.taxID) {
          const cleanTax = String(customer.taxID).replace(/\D/g, "");
          if (cleanTax.length === 11 || cleanTax.length === 14) {
            cleanCustomer.taxID = cleanTax;
          }
        }

        if (customer.email && String(customer.email).trim().includes("@")) {
          cleanCustomer.email = String(customer.email).trim();
        }

        if (customer.phone) {
          const rawPhone = String(customer.phone).trim();
          const digits = rawPhone.replace(/\D/g, "");
          if (digits.length >= 10) {
            let formattedPhone = "";
            if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
              formattedPhone = `+${digits}`;
            } else if (digits.length === 10 || digits.length === 11) {
              formattedPhone = `+55${digits}`;
            } else if (rawPhone.startsWith("+")) {
              formattedPhone = `+${digits}`;
            } else {
              formattedPhone = `+55${digits}`;
            }

            if (/^\+[1-9]\d{8,14}$/.test(formattedPhone)) {
              cleanCustomer.phone = formattedPhone;
            }
          }
        }

        if (Object.keys(cleanCustomer).length > 0) {
          dotfyPayload.customer = cleanCustomer;
        }
      }

      if (webhook_url) dotfyPayload.webhook_url = webhook_url;
      if (Array.isArray(split) && split.length > 0) dotfyPayload.split = split;

      console.log(`[Dotfy Proxy] Criando cobrança PIX via ${DOTFY_BASE_URL}/api/charges com chave ${maskToken(token)}`);

      // Modo de Simulação Local
      if (isSimulated && process.env.NODE_ENV !== 'production' && process.env.ALLOW_PAYMENT_SIMULATION === 'true') {
        const now = new Date();
        const expSec = Number(expiresIn) || 3600;
        const expiresAt = new Date(now.getTime() + expSec * 1000).toISOString();
        const randomId = Math.random().toString(36).substring(2, 10);
        const correlationID = `dotfy-${Date.now()}-${randomId}`;
        const centsValue = Math.round((Number(value) || 29.90) * 100);

        const simData = {
          id: `sim_cuid_${randomId}`,
          chargeId: `sim_charge_${randomId}`,
          correlationID: correlationID,
          correlationId: correlationID,
          transactionID: `E182361202026${Date.now()}s${randomId}`,
          qrCode: `00020126360014BR.GOV.BCB.PIX0114+5511999998888520400005303986540${(Number(value) || 29.90).toFixed(2)}5802BR5915Dotfy Checkout6009SAO PAULO62070503***6304ABCD`,
          qrCodeImage: "",
          paymentLink: `https://app.dotfy.com.br/checkout/${correlationID}`,
          expiresAt: expiresAt,
          value: centsValue
        };

        const storedCharge: StoredCharge = {
          id: simData.id,
          chargeId: simData.chargeId,
          correlationID: simData.correlationID,
          transactionID: simData.transactionID,
          qrCode: simData.qrCode,
          qrCodeImage: simData.qrCodeImage,
          paymentLink: simData.paymentLink,
          expiresAt: simData.expiresAt,
          value: simData.value,
          valueInReais: Number(value) || 29.90,
          description: description || "Cobrança PIX Simulação",
          customer: customer,
          status: "PENDING",
          createdAt: now.toISOString(),
          split: split,
          webhook_url: webhook_url,
          userId: targetUserId,
          gameId: chargeGameId,
          rawResponse: { success: true, data: simData, simulated: true }
        };

        memoryCharges.set(correlationID, storedCharge);

        return res.json({
          success: true,
          data: simData,
          simulated: true,
          message: "Cobrança gerada em modo de teste/simulação."
        });
      }

      // Requisição real à API da Dotfy
      const dotfyResponse = await fetch(`${DOTFY_BASE_URL}/api/charges`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dotfyPayload)
      });

      const responseText = await dotfyResponse.text();
      let responseData: any;

      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawText: responseText };
      }

      if (!dotfyResponse.ok) {
        console.error(`[Dotfy API Error] HTTP ${dotfyResponse.status}:`, responseData);

        const errorStr = JSON.stringify(responseData);
        if (
          dotfyResponse.status === 400 &&
          dotfyPayload.customer?.phone &&
          (errorStr.includes("customer.phone") || errorStr.includes("Telefone") || errorStr.includes("phone"))
        ) {
          console.warn("[Dotfy Proxy] Telefone rejeitado pela API Dotfy. Reenviando sem o campo customer.phone...");
          delete dotfyPayload.customer.phone;

          const retryResponse = await fetch(`${DOTFY_BASE_URL}/api/charges`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(dotfyPayload)
          });

          const retryText = await retryResponse.text();
          let retryData: any;
          try {
            retryData = JSON.parse(retryText);
          } catch (e) {
            retryData = { rawText: retryText };
          }

          if (retryResponse.ok) {
            const chargeData = retryData.data || retryData;
            const correlationID = chargeData.correlationID || chargeData.correlationId || `dotfy-${Date.now()}`;
            const centsVal = chargeData.value || Math.round((Number(value) || 0) * 100);

            const storedCharge: StoredCharge = {
              id: chargeData.id || `dotfy_${Date.now()}`,
              chargeId: chargeData.chargeId || "",
              correlationID: correlationID,
              transactionID: chargeData.transactionID || "",
              qrCode: chargeData.qrCode || "",
              qrCodeImage: chargeData.qrCodeImage || "",
              paymentLink: chargeData.paymentLink || "",
              expiresAt: chargeData.expiresAt || new Date(Date.now() + 3600000).toISOString(),
              value: centsVal,
              valueInReais: centsVal / 100,
              description: description || "Cobrança PIX",
              customer: customer,
              status: "PENDING",
              createdAt: new Date().toISOString(),
              split: split,
              webhook_url: webhook_url,
              userId: targetUserId,
              gameId: chargeGameId,
              rawResponse: retryData
            };

            memoryCharges.set(correlationID, storedCharge);

            return res.json({
              success: true,
              data: chargeData
            });
          } else {
            responseData = retryData;
          }
        }

        return res.status(dotfyResponse.status).json({
          success: false,
          status: dotfyResponse.status,
          error: responseData.error || "DOTFY_API_ERROR",
          message: responseData.message || responseData.error || `Erro ${dotfyResponse.status} retornado pela API Dotfy.`,
          details: responseData
        });
      }

      // Sucesso retornado pela Dotfy
      const chargeData = responseData.data || responseData;
      const correlationID = chargeData.correlationID || chargeData.correlationId || `dotfy-${Date.now()}`;
      const centsVal = chargeData.value || Math.round((Number(value) || 0) * 100);

      const storedCharge: StoredCharge = {
        id: chargeData.id || `dotfy_${Date.now()}`,
        chargeId: chargeData.chargeId || "",
        correlationID: chargeData.correlationID || correlationID,
        transactionID: chargeData.transactionID || "",
        qrCode: chargeData.qrCode || "",
        qrCodeImage: chargeData.qrCodeImage || "",
        paymentLink: chargeData.paymentLink || "",
        expiresAt: chargeData.expiresAt || new Date(Date.now() + 3600000).toISOString(),
        value: centsVal,
        valueInReais: centsVal / 100,
        description: description || "Cobrança PIX",
        customer: customer,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        split: split,
        webhook_url: webhook_url,
        userId: targetUserId,
        gameId: chargeGameId,
        rawResponse: responseData
      };

      memoryCharges.set(correlationID, storedCharge);

      return res.json({
        success: true,
        data: chargeData
      });

    } catch (error: any) {
      console.error("[Server Charges Exception]", error);
      return res.status(500).json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error.message || "Erro interno ao processar cobrança.",
        details: String(error)
      });
    }
  });

  // 3. GET /api/charges/:correlationID -> Consultar status da cobrança
  app.get("/api/charges/:correlationID", requireAuth, async (req: AuthRequest, res: Response) => {
    const { correlationID } = req.params;
    const token = DOTFY_API_KEY;

    const localCharge = memoryCharges.get(correlationID);
    if (localCharge?.userId && localCharge.userId !== req.userId) return res.status(403).json({ error: 'Cobrança não pertence ao usuário autenticado.' });

    try {
      const dotfyResponse = await fetch(`${DOTFY_BASE_URL}/api/charges/${correlationID}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (dotfyResponse.ok) {
        const data = await dotfyResponse.json();
        const chargePayload = data.data || data;
        if (localCharge && chargePayload) {
          if (chargePayload.status) {
            localCharge.status = chargePayload.status;
          }
          if (chargePayload.isPaid === true || chargePayload.status === 'PAID' || chargePayload.status === 'COMPLETED') {
            localCharge.status = 'PAID';
            (localCharge as any).isPaid = true;
            await creditPaidChargeUser(localCharge);
          }
        }
        return res.json(data);
      } else {
        if (localCharge) {
          if (localCharge.status === 'PAID' || localCharge.status === 'COMPLETED' || (localCharge as any).isPaid) {
            await creditPaidChargeUser(localCharge);
          }
          return res.json({
            success: true,
            data: {
              ...localCharge.rawResponse?.data,
              status: localCharge.status,
              correlationID: localCharge.correlationID,
              value: localCharge.value,
              qrCode: localCharge.qrCode,
              qrCodeImage: localCharge.qrCodeImage
            },
            fromLocalStore: true
          });
        }

        const errText = await dotfyResponse.text();
        return res.status(dotfyResponse.status).send(errText);
      }
    } catch (err) {
      if (localCharge) {
        if (localCharge.status === 'PAID') {
          await creditPaidChargeUser(localCharge);
        }
        return res.json({
          success: true,
          data: {
            status: localCharge.status,
            correlationID: localCharge.correlationID,
            value: localCharge.value,
            qrCode: localCharge.qrCode,
            qrCodeImage: localCharge.qrCodeImage
          },
          fromLocalStore: true
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erro ao consultar cobrança na API Dotfy.",
        error: String(err)
      });
    }
  });

  // 4. POST /api/charges/:correlationID/simulate-payment -> Simular pagamento para testes
  app.post("/api/charges/:correlationID/simulate-payment", requireAuth, async (req: AuthRequest, res: Response) => {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_PAYMENT_SIMULATION !== 'true') return res.status(404).json({ error: 'Rota indisponível.' });
    const { correlationID } = req.params;
    const charge = memoryCharges.get(correlationID);

    if (!charge) {
      return res.status(404).json({
        success: false,
        message: "Cobrança não encontrada no histórico da aplicação."
      });
    }
    if (charge.userId !== req.userId) return res.status(403).json({ error: 'Cobrança não pertence ao usuário autenticado.' });

    charge.status = "PAID";
    memoryCharges.set(correlationID, charge);
    await creditPaidChargeUser(charge);

    const webhookEvent = {
      id: `wh_${Date.now()}`,
      timestamp: new Date().toISOString(),
      payload: {
        event: "charge.paid",
        correlationID: charge.correlationID,
        transactionID: charge.transactionID,
        value: charge.value,
        paidAt: new Date().toISOString()
      }
    };
    memoryWebhooks.unshift(webhookEvent);

    res.json({
      success: true,
      message: "Pagamento simulado com sucesso!",
      data: charge
    });
  });

  // 5. GET /api/charges-history -> Listar histórico local de cobranças e webhooks
  app.get("/api/charges-history", requireAdmin, (_req: AuthRequest, res: Response) => {
    const chargesArray = Array.from(memoryCharges.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      success: true,
      count: chargesArray.length,
      data: chargesArray,
      webhooks: memoryWebhooks
    });
  });

  // 6. Endpoint para recepção de Webhooks da Dotfy
  app.post("/api/webhooks/dotfy", async (req: Request, res: Response) => {
    const payload = req.body;
    const signature = req.headers['x-webhook-signature'] || req.headers['x-dotfy-signature'] || req.headers['x-hub-signature-256'] || req.headers['x-signature'];
    const eventName = String(req.headers['x-webhook-event'] || payload?.event || '').toUpperCase();
    const rawBody = (req as any).rawBody || JSON.stringify(payload);

    if (eventName.startsWith('EVENT:WITHDRAWAL_')) {
      const webhookSecret = (process.env.DOTFY_WEBHOOK_SECRET || '').trim();
      if (!webhookSecret) return res.status(503).json({ error: 'DOTFY_WEBHOOK_SECRET não configurado.' });
      const match = typeof signature === 'string' ? signature.match(/^t=([^,]+),v1=([a-f0-9]+)$/i) : null;
      if (!match) return res.status(401).json({ error: 'Assinatura de webhook ausente ou inválida.' });
      const expected = crypto.createHmac('sha256', webhookSecret).update(`${match[1]}.${rawBody}`).digest('hex');
      const valid = expected.length === match[2].length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(match[2]));
      if (!valid) return res.status(401).json({ error: 'Assinatura HMAC de webhook inválida.' });
    }

    // Verify cryptographic signature if header is present
    if (signature && typeof signature === 'string' && !eventName.startsWith('EVENT:WITHDRAWAL_')) {
      const rawBodyStr = rawBody;
      const isValidSig = verifyHmacSignature(rawBodyStr, signature);
      if (!isValidSig) {
        logSecurityEvent('WEBHOOK_INVALID_SIGNATURE', { ip: req.ip, signature });
        return res.status(401).json({ error: 'Assinatura HMAC de Webhook inválida.' });
      }
    }

    logSecurityEvent('WEBHOOK_RECEIVED', { correlationID: payload?.correlationID, event: payload?.event || payload?.status });

    memoryWebhooks.unshift({
      id: `wh_${Date.now()}`,
      timestamp: new Date().toISOString(),
      payload
    });

    if (payload && payload.correlationID && memoryCharges.has(payload.correlationID)) {
      const charge = memoryCharges.get(payload.correlationID)!;
      if (payload.status) {
        charge.status = payload.status;
      } else if (payload.event === "charge.paid" || payload.event === "PAID") {
        charge.status = "PAID";
      }
      memoryCharges.set(payload.correlationID, charge);
      if (charge.status === "PAID") {
        await creditPaidChargeUser(charge);
      }
    }

    if (eventName === 'EVENT:WITHDRAWAL_COMPLETED' || eventName === 'EVENT:WITHDRAWAL_FAILED') {
      const providerWithdrawalId = String(payload?.data?.id || '');
      if (!providerWithdrawalId) return res.status(400).json({ error: 'ID do saque ausente.' });
      const withdrawalTx = (await dbService.getAllTransactions()).find(tx => tx.provider === 'DOTFY' && tx.providerWithdrawalId === providerWithdrawalId);
      if (!withdrawalTx) return res.status(200).json({ received: true, ignored: 'withdrawal_not_found' });

      if (eventName === 'EVENT:WITHDRAWAL_COMPLETED' && withdrawalTx.status === 'pending') {
        await dbService.updateTransaction(withdrawalTx.id, { status:'approved', providerStatus:'COMPLETED', processedAt:payload?.data?.processedAt || new Date().toISOString() });
        logSecurityEvent('WITHDRAWAL_COMPLETED', { transactionId:withdrawalTx.id, providerWithdrawalId });
      }

      if (eventName === 'EVENT:WITHDRAWAL_FAILED' && withdrawalTx.status === 'pending') {
        const user = await dbService.getUserById(withdrawalTx.userId);
        if (user) await dbService.updateUserBalance(user.id, user.balance + withdrawalTx.amount);
        await dbService.updateTransaction(withdrawalTx.id, { status:'rejected', providerStatus:'FAILED', processedAt:payload?.data?.processedAt || new Date().toISOString(), refundedAt:new Date().toISOString() });
        logSecurityEvent('WITHDRAWAL_FAILED_REFUNDED', { transactionId:withdrawalTx.id, providerWithdrawalId });
      }
    }

    res.status(200).json({ received: true });
  });

  // VITE MIDDLEWARE SETUP
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback in dev mode for custom paths like /cadastro, /login, etc.
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PayGateway] Servidor com Firebase Firestore rodando na porta ${PORT}`);
  });
}

startServer();
