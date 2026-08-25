import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { User, Transaction, Game, AffiliateInfo } from './types';
import { Header } from './components/Header';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { HomeView } from './components/HomeView';
import { FinanceView } from './components/FinanceView';
import { GamesView } from './components/GamesView';
import { MoreView } from './components/MoreView';
import { AffiliatesView } from './components/AffiliatesView';
import { MembersAreaView } from './components/MembersAreaView';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { TermsModal } from './components/TermsModal';
import { ProfileModal } from './components/ProfileModal';
import { GatewaySettingsModal } from './components/GatewaySettingsModal';
import { PixKeysModal } from './components/PixKeysModal';
import { BannerModal } from './components/BannerModal';
import { Toast, ToastType } from './components/Toast';
import {
  registerServiceWorker,
  triggerSaleNotification,
  triggerNewAffiliateNotification,
  getNotificationState,
  playSaleSound,
} from './lib/pwaNotification';
import { Loader2, Gamepad2, ShieldCheck, ExternalLink, Wallet, Activity, Layers3 } from 'lucide-react';
import logoImg from './components/logo.webp';
import { GAME_ASSETS, publicAsset } from './config/gameAssets';

const AdminPanel = lazy(() => import('./components/AdminPanel').then((module) => ({ default: module.AdminPanel })));
const BlockPuzzleApp = lazy(() => import('./game/BlockPuzzleApp').then((module) => ({ default: module.BlockPuzzleApp })));
const LazyScreen = () => <div className="min-h-screen bg-white grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-800" /></div>;

type AppContext = 'alliance-hub' | 'blockwin' | 'zumbla' | 'gen-dino';

const detectAppContext = (): AppContext => {
  const host = window.location.hostname.toLowerCase();
  const site = new URLSearchParams(window.location.search).get('site')?.toLowerCase().replaceAll('_', '-');

  if (host.includes('goalliancehub')) return 'alliance-hub';
  if (site === 'zumbla' || site === 'zumbla-win' || host === 'zumblapay.site' || host.endsWith('.zumblapay.site')) return 'zumbla';
  if (site === 'gen-dino' || site === 'gendino' || host === 'dinopay.site' || host.endsWith('.dinopay.site')) return 'gen-dino';
  if (site === 'blockwin' || site === 'block-win' || host.includes('blockwinner') || host.includes('blockwinn.fun') || host.includes('blockwin')) return 'blockwin';
  return 'alliance-hub';
};

const gameTrackingId = (context: AppContext) => context === 'zumbla' ? 'g_zumbla' : context === 'gen-dino' ? 'g_gen_dino' : context === 'blockwin' ? 'g_block_puzzle' : 'platform';

const resolveAcquisitionGame = (context: AppContext) => {
  const raw = (new URLSearchParams(window.location.search).get('game') || '').toLowerCase().replaceAll('_', '-');
  if (['zumbla', 'zumbla-win', 'g-zumbla'].includes(raw)) return 'g_zumbla';
  if (['gen-dino', 'gendino', 'g-gen-dino'].includes(raw)) return 'g_gen_dino';
  if (['blockwin', 'block-win', 'block-puzzle', 'g-block-puzzle'].includes(raw)) return 'g_block_puzzle';
  return gameTrackingId(context);
};

const DirectGameFrame: React.FC<{ context: 'zumbla' | 'gen-dino' }> = ({ context }) => {
  const base = context === 'zumbla' ? GAME_ASSETS.zumbla.app : GAME_ASSETS.genDino.app;
  const target = new URL(base, window.location.href);
  const incoming = new URLSearchParams(window.location.search);
  const ref = incoming.get('ref') || incoming.get('refCode') || incoming.get('r');
  if (ref) target.searchParams.set('ref', ref.trim().toUpperCase());
  target.searchParams.set('game', gameTrackingId(context));
  target.searchParams.set('sourceDomain', window.location.hostname.toLowerCase());

  return <iframe src={target.toString()} title={context === 'zumbla' ? 'Zumbla Win' : 'GEN DINO'} className="fixed inset-0 h-[100dvh] w-full border-0 bg-black" allow="autoplay; fullscreen; clipboard-write" />;
};

export default function App() {
  const [appContext, setAppContext] = useState<AppContext>(() => detectAppContext());
  const isGameSite = appContext !== 'alliance-hub';

  // Auth State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pg_auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialRefCode, setInitialRefCode] = useState<string>('');

  // Real-time tracking of known transactions for affiliate sale notifications
  const knownTxIdsRef = useRef<Set<string> | null>(null);
  const knownIndicationsCountRef = useRef<number | null>(null);
  const knownCommissionIdsRef = useRef<Set<string> | null>(null);

  // Main App State
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [subView, setSubView] = useState<'main' | 'affiliates' | 'members'>('main');
  const [gamesResetKey, setGamesResetKey] = useState<number>(0);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);

  // Modals & Overlay State
  const [adminPanelOpen, setAdminPanelOpen] = useState(() => {
    const host = window.location.hostname.toLowerCase();
    const search = window.location.search.toLowerCase();
    return host.includes('admin.goalliancehub.com') || search.includes('admin=true');
  });
  const [bannerOpen, setBannerOpen] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGameId, setDepositGameId] = useState('platform');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [gatewaySettingsOpen, setGatewaySettingsOpen] = useState(false);
  const [pixKeyModalOpen, setPixKeyModalOpen] = useState(false);
  const [pixKeyModalInitialView, setPixKeyModalInitialView] = useState<'list' | 'add'>('add');

  // Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  // 1. Initialize Service Worker & Detect Route / Referral URL Parameter on initial load
  useEffect(() => {
    registerServiceWorker();

    const metadata = {
      'alliance-hub': ['Alliance Hub | iGAMING PAINEL', publicAsset('allifavicon.png')],
      blockwin: ['BLOCK WIN | GANHE DINHEIRO JOGANDO', publicAsset('faviconblock.png')],
      zumbla: ['ZUMBLA WIN | JOGAR', publicAsset('zumbla/favicon.svg')],
      'gen-dino': ['GEN DINO | JOGAR', publicAsset('gen-dino/images/fav_icon.png')],
    } satisfies Record<AppContext, [string, string]>;
    document.title = metadata[appContext][0];
    document.querySelectorAll("link[rel*='icon']").forEach((el) => { (el as HTMLLinkElement).href = metadata[appContext][1]; });

    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('refCode') || params.get('r');
    
    if (ref) {
      const cleanRef = ref.toUpperCase().trim();
      setInitialRefCode(cleanRef);
      try {
        localStorage.setItem('alliance_ref_code', cleanRef);
        sessionStorage.setItem('alliance_ref_code', cleanRef);
        localStorage.setItem('alliance_origin_game', resolveAcquisitionGame(appContext));
        localStorage.setItem('alliance_origin_domain', window.location.hostname.toLowerCase());
      } catch (e) {}
    } else {
      try {
        const stored = localStorage.getItem('alliance_ref_code') || sessionStorage.getItem('alliance_ref_code');
        if (stored) {
          setInitialRefCode(stored);
        }
      } catch (e) {}
    }

    if (pathname.includes('/cadastro') || pathname.includes('/register') || ref) {
      setAuthView('register');
    } else if (pathname.includes('/login')) {
      setAuthView('login');
    }
  }, [appContext]);

  // 2. Fetch User Data on mount or token change
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setUser(null);
        knownTxIdsRef.current = null;
        knownIndicationsCountRef.current = null;
        knownCommissionIdsRef.current = null;
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const userData = await res.json();

          setUser(userData);
          fetchOverview(token);
          fetchGames(token);
          fetchAffiliateInfo(token);
        } else {
          // Invalid token
          localStorage.removeItem('pg_auth_token');
          setToken(null);
          setUser(null);
          knownTxIdsRef.current = null;
          knownCommissionIdsRef.current = null;
        }
      } catch (e) {
        console.error('Auth error', e);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [token]);

  // Real-time Polling Interval for instant balance, transactions and affiliate sales updates
  useEffect(() => {
    if (!token) {
      knownTxIdsRef.current = null;
      knownCommissionIdsRef.current = null;
      return;
    }

    const pollInterval = setInterval(() => {
      fetchOverview(token);
      fetchAffiliateInfo(token);
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [token]);

  // Fetch Finance Data (with Real-Time Affiliate Sale Detection & PWA Notification)
  const fetchOverview = async (authToken: string) => {
    try {
      const res = await fetch('/api/finance/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newTxs: Transaction[] = data.transactions || [];

        if (knownTxIdsRef.current === null) {
          // Initial population of transaction IDs
          knownTxIdsRef.current = new Set(newTxs.map((t) => t.id));
        } else {
          // Check for new incoming sales, commissions or deposits
          for (const tx of newTxs) {
            if (!knownTxIdsRef.current.has(tx.id)) {
              knownTxIdsRef.current.add(tx.id);

              const isDepositOrSale =
                tx.type === 'deposit' ||
                tx.paymentMethod === 'Afiliados' ||
                tx.description?.toLowerCase().includes('comissão') ||
                tx.description?.toLowerCase().includes('indicação') ||
                tx.description?.toLowerCase().includes('depósito') ||
                tx.amount > 0;

              if (isDepositOrSale) {
                const formattedAmount = tx.amount.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                // Always play venda.mp3 sound instantly
                playSaleSound();

                // Trigger PWA background/foreground sale notification
                triggerSaleNotification({
                  amount: tx.amount,
                  customTitle: 'Nova Venda na sua rede!',
                  customSubtitle: `Comissão de R$ ${formattedAmount} adicionada ao saldo!`,
                });
              }
            }
          }
        }

        setUser((prev) => (prev ? {
          ...prev,
          balance: data.balance,
          minWithdraw: data.minWithdraw !== undefined ? data.minWithdraw : prev.minWithdraw
        } : null));
        setTransactions(newTxs);
      }
    } catch (e) {
      console.error('Failed to fetch overview', e);
    }
  };

  // Fetch Games List
  const fetchGames = async (authToken: string) => {
    try {
      const res = await fetch('/api/games', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      }
    } catch (e) {
      console.error('Failed to fetch games', e);
    }
  };

  // Fetch Affiliate Info (with Real-Time New Registration Detection & PWA Notification)
  const fetchAffiliateInfo = async (authToken: string) => {
    try {
      const res = await fetch('/api/affiliates/info', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const currentCount = data.indicationsCount || 0;
        const commissions = Array.isArray(data.commissions) ? data.commissions : [];

        if (knownIndicationsCountRef.current === null) {
          knownIndicationsCountRef.current = currentCount;
        } else if (currentCount > knownIndicationsCountRef.current) {
          knownIndicationsCountRef.current = currentCount;

          const state = getNotificationState();
          if (state.newAffiliateEnabled) {
            triggerNewAffiliateNotification();
          }
        }

        if (knownCommissionIdsRef.current === null) {
          knownCommissionIdsRef.current = new Set(commissions.map((commission: any) => commission.id));
        } else {
          for (const commission of commissions) {
            if (!knownCommissionIdsRef.current.has(commission.id)) {
              knownCommissionIdsRef.current.add(commission.id);
              playSaleSound();
              triggerSaleNotification({
                amount: Number(commission.amount || 0),
                customTitle: 'Nova comissão recebida!',
                customSubtitle: `${commission.buyerName || 'Um indicado'} gerou comissão em ${commission.gameName || 'sua rede'}.`,
              });
            }
          }
        }

        setAffiliateInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch affiliate info', e);
    }
  };

  // AUTH ACTIONS
  const handleLogin = async (email: string, pass: string) => {
    setAuthError(null);
    setActionLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, isGameSite, acquisitionGame: resolveAcquisitionGame(appContext) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao efetuar login.');
      }

      localStorage.setItem('pg_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Bem-vindo de volta!', 'success');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    refCode?: string;
  }) => {
    setAuthError(null);
    setActionLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          isAffiliate: !isGameSite, // Registers as affiliate when on goalliancehub.com portal
          acquisitionGame: resolveAcquisitionGame(appContext),
          acquisitionDomain: window.location.hostname.toLowerCase(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Falha ao cadastrar conta.');
      }

      localStorage.setItem('pg_auth_token', resData.token);
      setToken(resData.token);
      setUser(resData.user);
      showToast('Conta criada com sucesso!', 'success');

      if (!isGameSite) {
        setPixKeyModalInitialView('add');
        setPixKeyModalOpen(true);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error('Logout error', e);
      }
    }
    localStorage.removeItem('pg_auth_token');
    setToken(null);
    setUser(null);
    knownTxIdsRef.current = null;
    knownIndicationsCountRef.current = null;
    knownCommissionIdsRef.current = null;
    setActiveTab('home');
    setSubView('main');
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // FINANCIAL ACTIONS
  const handleConfirmDeposit = async (amount: number) => {
    if (!token) return;
    setActionLoading(true);
    try {
      // Re-fetch user profile to sync updated balance
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          setUser(meData.user);
        }
      }

      playSaleSound();
      fetchOverview(token);
      fetchAffiliateInfo(token);
      showToast(`Depósito de R$ ${amount.toFixed(2)} aprovado!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao atualizar dados.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmWithdraw = async (amount: number, pixKeyId: string) => {
    if (!token) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, pixKeyId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Erro ao processar saque.');
      }

      if (typeof data.balance === 'number') {
        setUser((prev) => (prev ? { ...prev, balance: data.balance } : null));
      }
      fetchOverview(token);
      showToast(`Solicitação de saque de R$ ${amount.toFixed(2)} enviada com sucesso!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao realizar saque.', 'error');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Render Independent Game Site if explicitly in game site mode
  if (appContext === 'blockwin') {
    return (
      <Suspense fallback={<LazyScreen />}>
        <BlockPuzzleApp
          onReturnToPortal={() => {
            setAppContext('alliance-hub');
            setActiveTab('home');
          }}
        />
      </Suspense>
    );
  }

  if (appContext === 'zumbla' || appContext === 'gen-dino') {
    return <DirectGameFrame context={appContext} />;
  }

  // Render Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <img src={logoImg} alt="Logo" className="h-10 max-w-[160px] object-contain mx-auto animate-pulse" />
          <Loader2 className="w-5 h-5 text-zinc-900 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Carregando...</p>
        </div>
      </div>
    );
  }

  // Render Unauthenticated Flow (Login / Register)
  if (!user) {
    return (
      <div className="auth-app-background min-h-screen bg-zinc-900/5 flex flex-col items-center justify-center">
        <div className="auth-app-shell w-full bg-white min-h-screen border border-zinc-200/80 shadow-2xl overflow-hidden relative">
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              duration={3000}
              onClose={() => setToast(null)}
            />
          )}

          {authView === 'login' ? (
            <LoginView
              onLogin={handleLogin}
              onNavigateToRegister={() => setAuthView('register')}
              onForgotPassword={() =>
                showToast('Instruções de recuperação foram enviadas.', 'info')
              }
              loading={actionLoading}
              error={authError}
            />
          ) : (
            <RegisterView
              onRegister={handleRegister}
              onNavigateToLogin={() => setAuthView('login')}
              onOpenTerms={() => setTermsOpen(true)}
              loading={actionLoading}
              error={authError}
              initialRefCode={initialRefCode}
            />
          )}

          <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
        </div>
      </div>
    );
  }

  // Render Authenticated Mobile Container
  return (
    <div className="min-h-screen bg-zinc-900/5 sm:py-6 flex items-center justify-center">
      {/* Centered Mobile Shell Frame (100% Mobile First) */}
      <div className="alliance-app-shell w-full max-w-md lg:max-w-[1440px] bg-white min-h-screen sm:min-h-[820px] border border-zinc-200/90 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-[max-width,border-radius] duration-300 sm:rounded-3xl lg:rounded-[28px]">
        {/* Toast */}
        {toast && (
          <Toast message={toast.message} type={toast.type} duration={3000} onClose={() => setToast(null)} />
        )}

        {/* Header */}
        <Header
          user={{ ...user, balance: user.balance + Number(affiliateInfo?.affiliateBalance || 0) }}
          onProfileClick={() => setProfileOpen(true)}
          onOpenSettings={() => setGatewaySettingsOpen(true)}
          onOpenAdmin={() => setAdminPanelOpen(true)}
        />

        {/* Scrollable Main Content Area */}
        <main className="alliance-main-content flex-1 overflow-y-auto no-scrollbar">
          <section className="desktop-context-strip" aria-label="Resumo da seção atual">
            <div><span>ÁREA ATUAL</span><strong>{activeTab === 'home' ? 'Visão geral' : activeTab === 'finance' ? 'Financeiro' : activeTab === 'games' ? 'Central de jogos' : subView === 'affiliates' ? 'Programa de afiliados' : 'Conta e configurações'}</strong></div>
            <div><i><Wallet/></i><span>Saldo total<strong>R$ {(user.balance + Number(affiliateInfo?.affiliateBalance || 0)).toLocaleString('pt-BR', { minimumFractionDigits:2 })}</strong></span></div>
            <div><i><Activity/></i><span>Movimentações<strong>{transactions.length}</strong></span></div>
            <div><i><Layers3/></i><span>Jogos disponíveis<strong>{games.length || 3}</strong></span></div>
            <div className="desktop-live-pill"><span/> Sistema atualizado</div>
          </section>
          <div key={`${activeTab}-${subView}`} className="alliance-section-transition">
          {activeTab === 'home' && (
            <HomeView
              user={user}
              transactions={transactions}
              affiliateInfo={affiliateInfo}
              onDeposit={() => { setDepositGameId('platform'); setDepositOpen(true); }}
              onWithdraw={() => setWithdrawOpen(true)}
              onNavigateToFinance={() => setActiveTab('finance')}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              user={user}
              transactions={transactions}
              affiliateInfo={affiliateInfo}
              onDeposit={() => { setDepositGameId('platform'); setDepositOpen(true); }}
              onWithdraw={() => setWithdrawOpen(true)}
            />
          )}

          {activeTab === 'games' && (
            <GamesView
              key={gamesResetKey}
              games={games}
              user={user}
              affiliateInfo={affiliateInfo}
              onShowToast={showToast}
              onDeposit={(gameId) => { setDepositGameId(gameId || 'platform'); setDepositOpen(true); }}
              onWithdraw={() => setWithdrawOpen(true)}
              onPlayGame={(betAmount) => {
                showToast(`Partida iniciada com entrada de R$ ${betAmount.toFixed(2)}!`, 'success');
                setAppContext('blockwin');
              }}
              onBalanceChange={(balance) => {
                setUser((current) => current ? { ...current, balance } : current);
              }}
              onOpenReferral={() => {
                setActiveTab('more');
                setSubView('affiliates');
              }}
              onOpenProfile={() => setProfileOpen(true)}
            />
          )}

          {activeTab === 'more' && (
            <>
              {subView === 'affiliates' ? (
                <AffiliatesView
                  affiliateInfo={affiliateInfo}
                  onBack={() => setSubView('main')}
                  onCopySuccess={() => showToast('Link de indicação copiado!', 'success')}
                  onShowToast={showToast}
                  onRefresh={() => {
                    if (token) fetchAffiliateInfo(token);
                  }}
                />
              ) : subView === 'members' ? (
                <MembersAreaView onBack={() => setSubView('main')} />
              ) : (
                <MoreView
                  user={user}
                  onOpenProfile={() => setProfileOpen(true)}
                  onOpenAffiliates={() => {
                    setSubView('affiliates');
                    if (token) fetchAffiliateInfo(token);
                  }}
                  onOpenMembers={() => setSubView('members')}
                  onOpenSettings={() => setGatewaySettingsOpen(true)}
                  onOpenPixKeys={() => {
                    setPixKeyModalInitialView('list');
                    setPixKeyModalOpen(true);
                  }}
                  onOpenTerms={() => setTermsOpen(true)}
                  onOpenPrivacy={() => setTermsOpen(true)}
                  onLogout={handleLogout}
                  onOpenAdmin={() => setAdminPanelOpen(true)}
                />
              )}
            </>
          )}
          </div>
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          desktopExpanded={true}
          onChangeTab={(tab) => {
            if (tab === 'games') {
              setGamesResetKey((prev) => prev + 1);
            }
            setActiveTab(tab);
            setSubView('main');
          }}
        />

        {/* Interactive Modals */}
        <DepositModal
          isOpen={depositOpen}
          onClose={() => setDepositOpen(false)}
          onConfirmDeposit={handleConfirmDeposit}
          loading={actionLoading}
          gameId={depositGameId}
        />

        <WithdrawModal
          isOpen={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          onConfirmWithdraw={handleConfirmWithdraw}
          userBalance={user.balance}
          minWithdraw={user.minWithdraw}
          loading={actionLoading}
          token={token}
          onOpenAddPixKey={() => {
            setPixKeyModalInitialView('add');
            setPixKeyModalOpen(true);
          }}
        />

        <ProfileModal
          user={user}
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
        />

        <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />

        <GatewaySettingsModal
          isOpen={gatewaySettingsOpen}
          onClose={() => setGatewaySettingsOpen(false)}
          onShowToast={showToast}
        />

        <PixKeysModal
          isOpen={pixKeyModalOpen}
          onClose={() => setPixKeyModalOpen(false)}
          token={token}
          userName={user?.name}
          initialView={pixKeyModalInitialView}
          onSuccess={(msg, pixKeyData) => {
            showToast(msg, 'success');
            if (user && pixKeyData) {
              setUser({ ...user, pixKey: pixKeyData });
            }
          }}
        />

        <BannerModal
          isOpen={bannerOpen}
          onClose={() => setBannerOpen(false)}
          onAction={() => {
            if (!user) {
              setAuthView('register');
            } else {
              setDepositOpen(true);
            }
          }}
        />

        {adminPanelOpen && user && (
          <Suspense fallback={<LazyScreen />}>
            <AdminPanel
              currentUser={user}
              token={token}
              onClose={() => setAdminPanelOpen(false)}
              onShowToast={(msg, type) => showToast(msg, type)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
