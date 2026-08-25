import React, { useState, useEffect } from 'react';
import { AffiliateInfo, IndicationItem } from '../types';
import { ReferralCard } from './ReferralCard';
import { ManageIndicatedModal } from './ManageIndicatedModal';
import { AffiliateWithdrawModal } from './AffiliateWithdrawModal';
import { Users, ShieldCheck, UserCheck, ArrowLeft, Settings, BarChart3, Wallet, TrendingUp, X, Coins, ArrowDownLeft, Search, Target, Loader2, RotateCw, Sun, Moon, Bell, Gamepad2, UserPlus, BadgeDollarSign, Filter, ChevronRight, CheckCircle2, Clock3 } from 'lucide-react';
import logoImg from './logo.webp';
import { getNotificationState, requestNotificationPermission, registerServiceWorker, triggerSaleNotification } from '../lib/pwaNotification';

interface AffiliatesViewProps {
  affiliateInfo: AffiliateInfo | null;
  onBack?: () => void;
  onCopySuccess: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const AffiliatesView: React.FC<AffiliatesViewProps> = ({
  affiliateInfo,
  onBack,
  onCopySuccess,
  onShowToast,
  onRefresh,
}) => {
  const [selectedIndication, setSelectedIndication] = useState<IndicationItem | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState<boolean>(false);
  const [influencerMetricsItem, setInfluencerMetricsItem] = useState<IndicationItem | null>(null);
  const [localIndications, setLocalIndications] = useState<IndicationItem[] | null>(null);
  const [filterType, setFilterType] = useState<'players' | 'influencers'>('players');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [depositFilter, setDepositFilter] = useState<'all' | 'deposited' | 'no_deposit'>('all');
  const [networkSort, setNetworkSort] = useState<'recent' | 'deposits' | 'name'>('recent');
  const [internalAffiliateInfo, setInternalAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [loadingInternal, setLoadingInternal] = useState<boolean>(false);
  const [gameFilter, setGameFilter] = useState<'all' | 'g_block_puzzle' | 'g_zumbla' | 'g_gen_dino'>('all');
  const [affiliateTheme, setAffiliateTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('affiliate_hub_theme') as 'light' | 'dark') || 'light');
  const [notificationMode, setNotificationMode] = useState<'simple' | 'detailed'>(() => (localStorage.getItem('affiliate_notification_mode') as 'simple' | 'detailed') || 'detailed');
  const [notificationPrefs, setNotificationPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('affiliate_notification_prefs') || '') as { registration:boolean; ftd:boolean; pixPending:boolean; gameActivity:boolean }; }
    catch { return { registration: true, ftd: true, pixPending: false, gameActivity: true }; }
  });
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => getNotificationState().permission === 'granted');
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  useEffect(() => { localStorage.setItem('affiliate_hub_theme', affiliateTheme); }, [affiliateTheme]);
  useEffect(() => { localStorage.setItem('affiliate_notification_mode', notificationMode); }, [notificationMode]);
  useEffect(() => { localStorage.setItem('affiliate_notification_prefs', JSON.stringify(notificationPrefs)); }, [notificationPrefs]);

  const enableAffiliateNotifications = async () => {
    const allowed = await requestNotificationPermission();
    if (!allowed) {
      onShowToast?.('Permissão de notificações não liberada no navegador.', 'error');
      return;
    }
    await registerServiceWorker();
    localStorage.setItem('pg_gateway_notifications', 'true');
    setBrowserNotificationsEnabled(true);
    await triggerSaleNotification({ customTitle: 'Notificações ativadas', customSubtitle: 'Você receberá os eventos selecionados no Programa de Afiliados.' });
    onShowToast?.('Notificações ativadas com sucesso!', 'success');
  };

  // Self-heal: If affiliateInfo is not yet provided by parent, fetch it directly
  useEffect(() => {
    if (!affiliateInfo && !internalAffiliateInfo) {
      const token = localStorage.getItem('pg_auth_token') || localStorage.getItem('paygateway_token') || localStorage.getItem('token');
      if (token) {
        setLoadingInternal(true);
        fetch('/api/affiliates/info', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.referralCode) {
              setInternalAffiliateInfo(data);
            }
          })
          .catch((err) => console.error('Error fetching affiliate info fallback', err))
          .finally(() => setLoadingInternal(false));
      }
    }
  }, [affiliateInfo]);

  const activeInfo = affiliateInfo || internalAffiliateInfo;

  // CPA Killer State
  const [cpaKillerActive, setCpaKillerActive] = useState<boolean>(activeInfo?.cpaKillerActive || false);
  const [cpaKillerEveryX, setCpaKillerEveryX] = useState<number>(activeInfo?.cpaKillerEveryX || 5);
  const [cpaKillerKillY, setCpaKillerKillY] = useState<number>(activeInfo?.cpaKillerKillY || 1);
  const [savingCpaKiller, setSavingCpaKiller] = useState<boolean>(false);

  useEffect(() => {
    if (activeInfo) {
      setCpaKillerActive(activeInfo.cpaKillerActive || false);
      setCpaKillerEveryX(activeInfo.cpaKillerEveryX || 5);
      setCpaKillerKillY(activeInfo.cpaKillerKillY || 1);
    }
  }, [activeInfo]);

  const handleSaveCpaKiller = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('pg_auth_token') || localStorage.getItem('paygateway_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      if (onShowToast) onShowToast('Sessão expirada. Faça login novamente.', 'error');
      return;
    }

    if (cpaKillerKillY >= cpaKillerEveryX) {
      if (onShowToast) onShowToast('A quantidade de CPAs a matar (Y) deve ser estritamente menor do que a quantidade acumulada (X).', 'error');
      return;
    }

    setSavingCpaKiller(true);
    try {
      const res = await fetch('/api/affiliates/cpa-killer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cpaKillerActive,
          cpaKillerEveryX,
          cpaKillerKillY
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (onShowToast) onShowToast(data.message || 'Configurações de CPA Killer salvas com sucesso!', 'success');
      } else {
        if (onShowToast) onShowToast(data.error || 'Erro ao salvar CPA Killer.', 'error');
      }
    } catch (err) {
      if (onShowToast) onShowToast('Erro de conexão ao salvar CPA Killer.', 'error');
    } finally {
      setSavingCpaKiller(false);
    }
  };

  if (!activeInfo) {
    return (
      <div className="space-y-6 pb-24 px-4 pt-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:bg-[#ECECEC] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-[#111111] tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#111111]" />
              Programa de Afiliados
            </h1>
            <p className="text-xs text-[#737373]">Carregando seus dados...</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[24px] border border-[#E5E5E5] flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-[#111111] border border-slate-100 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#111111]">Carregando programa de afiliados</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-xs">
              Buscando seu link de indicação, comissões de RevShare e métricas da rede.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Atualizar
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Voltar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const rawIndicationsList = localIndications || activeInfo.indications || [];

  const filteredIndications = rawIndicationsList.filter((ind) => {
    const matchesType = filterType === 'players' ? !ind.isInfluencer : ind.isInfluencer;
    if (!matchesType) return false;
    const deposited = Number(ind.totalDeposited || 0) + Number(ind.subNetworkDeposits || 0) > 0;
    if (depositFilter === 'deposited' && !deposited) return false;
    if (depositFilter === 'no_deposit' && deposited) return false;
    if (gameFilter !== 'all' && ind.lastGameId !== gameFilter) return false;
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase();
    return (
      (ind.referredName && ind.referredName.toLowerCase().includes(query)) ||
      (ind.referredEmail && ind.referredEmail.toLowerCase().includes(query))
    );
  }).sort((a, b) => {
    if (networkSort === 'deposits') return (Number(b.totalDeposited || 0) + Number(b.subNetworkDeposits || 0)) - (Number(a.totalDeposited || 0) + Number(a.subNetworkDeposits || 0));
    if (networkSort === 'name') return String(a.referredName || '').localeCompare(String(b.referredName || ''), 'pt-BR');
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  const influencerRows = rawIndicationsList.filter(ind => ind.isInfluencer);
  const operationTotals = {
    revenue: influencerRows.reduce((sum, ind) => sum + Number(ind.subNetworkDeposits || 0), 0),
    registrations: influencerRows.reduce((sum, ind) => sum + Number(ind.subReferralsCount || 0), 0),
    ftds: influencerRows.reduce((sum, ind) => sum + Number(ind.ftdCount || 0), 0),
    activeInfluencers: influencerRows.length,
  };

  return (
    <div className={`affiliate-hub-view affiliate-ops-theme space-y-6 pb-24 px-4 pt-4 lg:px-8 lg:pt-7 lg:pb-28 ${affiliateTheme === 'dark' ? 'is-dark' : ''}`}>
      {/* Top Bar with back if rendered as subview */}
      <div className="affiliate-hub-heading flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] hover:bg-[#ECECEC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-[#111111] tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#111111]" />
            Programa de Afiliados
          </h1>
          <p className="text-xs text-[#737373]">Convide pessoas e acompanhe suas indicações.</p>
        </div>
        <span className="affiliate-version-badge lg:hidden">v5</span>
        <button onClick={() => setAffiliateTheme(theme => theme === 'light' ? 'dark' : 'light')} className="affiliate-theme-button affiliate-theme-mobile lg:hidden" aria-label="Alternar tema">{affiliateTheme === 'light' ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}</button>
        <div className="hidden lg:flex ml-auto items-center gap-2">
          <button onClick={() => setAffiliateTheme(theme => theme === 'light' ? 'dark' : 'light')} className="affiliate-theme-button" title="Alternar tema">{affiliateTheme === 'light' ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}<span>{affiliateTheme === 'light' ? 'Escuro' : 'Claro'}</span></button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Rede ativa
          </span>
          <span className="affiliate-version-badge">Hub v5</span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500">
            Código {activeInfo.referralCode}
          </span>
        </div>
      </div>

      {/* Affiliate Operations Center */}
      <section className="affiliate-operations-center">
        <div className="affiliate-ops-header">
          <div><span className="affiliate-eyebrow"><span /> OPERAÇÃO EM TEMPO REAL</span><h2>Performance dos influenciadores</h2><p>Receita, cadastros e primeiros depósitos da sua rede.</p></div>
          <div className="affiliate-ops-actions"><div className="affiliate-game-filter"><Filter className="w-3.5 h-3.5"/><select value={gameFilter} onChange={e => setGameFilter(e.target.value as typeof gameFilter)}><option value="all">Todos os jogos</option><option value="g_block_puzzle">Block Win</option><option value="g_zumbla">Zumbla Win</option><option value="g_gen_dino">GEN DINO</option></select></div><button type="button" onClick={() => setNotificationCenterOpen(true)} className="affiliate-notification-trigger" aria-label="Abrir central de notificações"><Bell className="w-4 h-4"/><span>Notificações</span><i>{Object.values(notificationPrefs).filter(Boolean).length}</i></button></div>
        </div>
        <div className="affiliate-ops-kpis">
          <article><i className="green"><BadgeDollarSign/></i><div><span>Receita gerada</span><strong>R$ {operationTotals.revenue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong><small>Depósitos da rede</small></div></article>
          <article><i className="blue"><UserPlus/></i><div><span>Cadastros</span><strong>{operationTotals.registrations}</strong><small>Novos jogadores</small></div></article>
          <article><i className="violet"><CheckCircle2/></i><div><span>FTDs confirmados</span><strong>{operationTotals.ftds}</strong><small>Primeiro depósito</small></div></article>
          <article><i className="orange"><TrendingUp/></i><div><span>Conversão cadastro → FTD</span><strong>{operationTotals.registrations ? ((operationTotals.ftds / operationTotals.registrations) * 100).toFixed(1) : '0,0'}%</strong><small>{operationTotals.activeInfluencers} influenciadores</small></div></article>
        </div>
        <div className="affiliate-ops-grid affiliate-ops-grid-wide">
          <div className="affiliate-ranking-card">
            <div className="affiliate-card-head"><div><h3>Ranking de influenciadores</h3><p>Ordenado pelo volume financeiro gerado</p></div><Gamepad2 className="w-4 h-4"/></div>
            <div className="affiliate-ranking-head"><span>Influenciador</span><span>Cadastros</span><span>FTDs</span><span>Receita</span><span>Jogo</span></div>
            {influencerRows.filter(ind => gameFilter === 'all' || ind.lastGameId === gameFilter).sort((a,b) => Number(b.subNetworkDeposits||0)-Number(a.subNetworkDeposits||0)).map((ind,index) => <button key={ind.id} onClick={() => setInfluencerMetricsItem(ind)} className="affiliate-ranking-row"><span><b>{index+1}</b><i>{ind.referredName?.charAt(0).toUpperCase()}</i><em>{ind.referredName}<small>{ind.referredEmail}</small></em></span><strong>{ind.subReferralsCount||0}</strong><strong>{ind.ftdCount||0}</strong><strong className="money">R$ {Number(ind.subNetworkDeposits||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong><span className="game-pill">{ind.lastGameName||'Sem jogo'}</span><ChevronRight className="w-4 h-4"/></button>)}
            {influencerRows.length === 0 && <div className="affiliate-empty"><Users className="w-5 h-5"/><span>Nenhum influenciador encontrado.</span></div>}
          </div>
        </div>
      </section>

      {notificationCenterOpen && <div className="affiliate-notification-overlay" role="dialog" aria-modal="true" aria-label="Central de notificações" onMouseDown={e => { if (e.target === e.currentTarget) setNotificationCenterOpen(false); }}>
        <aside className="affiliate-notification-card affiliate-notification-sheet">
          <div className="affiliate-sheet-handle" />
          <div className="affiliate-card-head"><div><h3>Central de notificações</h3><p>Escolha os eventos importantes</p></div><button type="button" onClick={() => setNotificationCenterOpen(false)} aria-label="Fechar"><X className="w-4 h-4"/></button></div>
          <div className="affiliate-mode-picker"><button className={notificationMode === 'simple' ? 'active' : ''} onClick={() => setNotificationMode('simple')}>Simples<small>Evento e valor</small></button><button className={notificationMode === 'detailed' ? 'active' : ''} onClick={() => setNotificationMode('detailed')}>Detalhada<small>Influenciador, jogador e jogo</small></button></div>
          <div className="affiliate-notification-list">
            {[
              ['registration','Novo cadastro','Quem indicou e horário',UserPlus],
              ['ftd','FTD confirmado','Influenciador, jogador e valor',CheckCircle2],
              ['pixPending','PIX pendente','Cobrança aguardando pagamento',Clock3],
              ['gameActivity','Atividade por jogo','Jogo acessado pelo indicado',Gamepad2],
            ].map(([key,title,description,Icon]) => <label key={String(key)}><span><i><Icon className="w-4 h-4"/></i><em>{title}<small>{description}</small></em></span><input type="checkbox" checked={(notificationPrefs as any)[key as string]} onChange={e => setNotificationPrefs(prev => ({...prev,[String(key)]:e.target.checked}))}/></label>)}
          </div>
          <div className="affiliate-notification-preview"><span>PRÉVIA • {notificationMode === 'simple' ? 'SIMPLES' : 'DETALHADA'}</span><strong>Novo FTD • R$ 100,00</strong>{notificationMode === 'detailed' && <p>Influenciador: Marina S. • Jogador: Carlos M. • GEN DINO</p>}</div>
          <button type="button" onClick={enableAffiliateNotifications} className={`affiliate-enable-notifications ${browserNotificationsEnabled ? 'enabled' : ''}`}><Bell className="w-4 h-4"/>{browserNotificationsEnabled ? 'Notificações ativas' : 'Ativar notificações no aparelho'}</button>
        </aside>
      </div>}

      {/* Referral Link & Overview Cards */}
      <div className="affiliate-hub-overview">
        <ReferralCard
          affiliateInfo={activeInfo}
          onCopySuccess={onCopySuccess}
          onOpenWithdraw={() => setWithdrawModalOpen(true)}
        />

      {/* CPA Killer Configuration (Only visible if allowed by Admin) */}
      {activeInfo.cpaKillerAllowed && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-white shadow-lg space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">CPA Killer</h3>
                <p className="text-[11px] text-zinc-400">Anulação automática de comissões por ciclo</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCpaKillerActive(!cpaKillerActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                cpaKillerActive ? 'bg-rose-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  cpaKillerActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <form onSubmit={handleSaveCpaKiller} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300 block">
                  A cada quantos CPAs (X):
                </label>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={cpaKillerEveryX}
                  onChange={(e) => setCpaKillerEveryX(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-300 block">
                  Matar Quantos CPAs (Y):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cpaKillerKillY}
                  onChange={(e) => setCpaKillerKillY(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/60 text-xs text-zinc-300 leading-relaxed">
              Regra: A cada <strong className="text-white">{cpaKillerEveryX} CPAs</strong>, os últimos <strong className="text-rose-400">{cpaKillerKillY}</strong> serão anulados.
            </div>

            <button
              type="submit"
              disabled={savingCpaKiller}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {savingCpaKiller ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Salvar Configuração</span>
              )}
            </button>
          </form>
        </div>
      )}
      </div>

      {/* Indications List */}
      <div className="affiliate-network-panel space-y-3 pt-2">
        {/* Controls Bar: Category Filters + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-[#E5E5E5] shadow-2xs">
          {/* Filters for Jogadores / Influenciadores */}
          <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E5E5] gap-1 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setFilterType('players')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                filterType === 'players' ? 'bg-[#111111] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jogadores ({rawIndicationsList.filter(i => !i.isInfluencer).length})
            </button>
            <button
              onClick={() => setFilterType('influencers')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'influencers' ? 'bg-[#111111] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <img src={logoImg} alt="Logo" className="h-3.5 max-w-[20px] object-contain" />
              Influenciadores ({rawIndicationsList.filter(i => i.isInfluencer).length})
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <select value={depositFilter} onChange={(e) => setDepositFilter(e.target.value as typeof depositFilter)} className="bg-[#F5F5F5] border border-[#E5E5E5] text-[11px] font-semibold text-[#111111] px-2.5 py-1.5 rounded-xl outline-none">
              <option value="all">Todos da minha rede</option>
              <option value="deposited">Com depósito</option>
              <option value="no_deposit">Sem depósito</option>
            </select>
            <select value={networkSort} onChange={(e) => setNetworkSort(e.target.value as typeof networkSort)} className="bg-[#F5F5F5] border border-[#E5E5E5] text-[11px] font-semibold text-[#111111] px-2.5 py-1.5 rounded-xl outline-none">
              <option value="recent">Mais recentes</option>
              <option value="deposits">Maior depósito</option>
              <option value="name">Nome A–Z</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-[#F5F5F5] focus:bg-white border border-[#E5E5E5] focus:border-[#111111] text-xs font-medium text-[#111111] pl-8 pr-7 py-1.5 rounded-xl outline-none transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-[11px] uppercase tracking-wider text-[#737373]">
            Exibindo {filteredIndications.length} usuário{filteredIndications.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {filteredIndications.length > 0 ? (
          <div className="affiliate-network-list space-y-1.5">
            {filteredIndications.map((ind) => (
              <div
                key={ind.id}
                onClick={() => {
                  setSelectedIndication(ind);
                  setManageModalOpen(true);
                }}
                className="affiliate-network-row p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50/90 border border-[#E5E5E5] hover:border-slate-300 transition-all cursor-pointer shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                {/* User Info */}
                <div className="flex items-center gap-2.5 min-w-[180px]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] border p-1 bg-[#F5F5F5] text-[#111111] border-[#E5E5E5] shrink-0">
                    {ind.isInfluencer ? (
                      <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      ind.referredName ? ind.referredName.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                      <h4 className="font-bold text-[#111111] text-xs truncate max-w-[150px]">
                        {ind.referredName}
                      </h4>
                      {ind.isInfluencer ? (
                        <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[8px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 shrink-0">
                          <img src={logoImg} alt="Logo" className="h-2 max-w-[12px] object-contain" /> Influenciador
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[8px] px-1.5 py-0.2 rounded-full font-bold shrink-0">
                          Jogador
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#737373] block truncate max-w-[180px]">
                      {ind.referredEmail}
                    </span>
                  </div>
                </div>

                {/* Metrics & Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-2.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <span className="text-emerald-700 font-bold bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-100/80 text-[10px] sm:text-[11px]">
                      Dep: <strong className="font-extrabold">R$ {(ind.totalDeposited ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </span>
                    <span className="text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/80 text-[10px] sm:text-[11px]">
                      Saldo: <strong className="font-extrabold">R$ {(ind.referredBalance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {ind.isInfluencer ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInfluencerMetricsItem(ind);
                          }}
                          className="px-2 py-1 bg-[#111111] hover:bg-black text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                        >
                          <BarChart3 className="w-3 h-3 text-amber-400" />
                          <span>Métricas</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndication(ind);
                            setManageModalOpen(true);
                          }}
                          className="p-1 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#111111] border border-[#E5E5E5] rounded-lg transition-all cursor-pointer"
                          title="Gerenciar"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndication(ind);
                          setManageModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#111111] border border-[#E5E5E5] rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Settings className="w-3 h-3 text-[#111111]" />
                        <span>Gerenciar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-[#F5F5F5] rounded-2xl border border-dashed border-[#E5E5E5] text-center text-xs text-[#737373] space-y-1">
            <ShieldCheck className="w-6 h-6 mx-auto text-[#737373] mb-1" />
            <p className="font-medium text-[#111111]">Nenhum usuário nesta categoria</p>
            <p>Alterne entre os filtros ou compartilhe seu link de indicação.</p>
          </div>
        )}
      </div>

      {/* POPUP INFLUENCER METRICS BOTTOM SHEET */}
      {influencerMetricsItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-xl border-t sm:border border-[#E5E5E5] max-h-[88vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Logo" className="h-8 max-w-[120px] object-contain shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[#111111]">{influencerMetricsItem.referredName}</h3>
                    <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[9px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <img src={logoImg} alt="Logo" className="h-2.5 max-w-[14px] object-contain" /> Influenciador
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{influencerMetricsItem.referredEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setInfluencerMetricsItem(null)}
                className="p-1.5 rounded-full bg-[#F5F5F5] hover:bg-[#EBEBEB] text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title / Description */}
            <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-700 shrink-0" />
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Desempenho da rede de indicados vinculados a este influenciador.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total Depósitos da Rede */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Depósitos Gerados na Rede
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 font-mono">
                    R$ {(influencerMetricsItem.subNetworkDeposits || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Volume acumulado depositado pelos indicados do influenciador
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-emerald-400 flex items-center justify-center shadow-2xs shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              {/* Saldo Total Trazido Pela Rede */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-800" /> Saldo Total Trazido Pela Rede
                  </span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    R$ {(influencerMetricsItem.subNetworkBalances || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Soma dos saldos atuais nas contas dos jogadores indicados
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
              </div>

              {/* Total Cadastros / Indicados */}
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center mb-1.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 block">Cadastros na Rede</span>
                <span className="text-sm font-bold text-[#111111] block font-mono mt-0.5">
                  {influencerMetricsItem.subReferralsCount || 0} <span className="text-[10px] font-normal text-slate-500">jogadores</span>
                </span>
              </div>

              {/* Saldo de Comissão de Afiliado */}
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                <div className="w-6 h-6 rounded-lg bg-amber-100 p-1 flex items-center justify-center mb-1.5">
                  <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500 block">Saldo de Comissão</span>
                <span className="text-sm font-bold text-[#111111] block font-mono mt-0.5">
                  R$ {(influencerMetricsItem.affiliateBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  const current = influencerMetricsItem;
                  setInfluencerMetricsItem(null);
                  setSelectedIndication(current);
                  setManageModalOpen(true);
                }}
                className="flex-1 py-2.5 bg-[#111111] hover:bg-black text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Gerenciar Permissões / Saldo</span>
              </button>

              <button
                onClick={() => setInfluencerMetricsItem(null)}
                className="px-4 py-2.5 bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#111111] border border-[#E5E5E5] rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <ManageIndicatedModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        indication={selectedIndication}
        onShowToast={onShowToast}
        onSaveSuccess={(updated) => {
          const updatedList = rawIndicationsList.map((item) =>
            (item.id === updated.id || item.referredUserId === updated.referredUserId)
              ? updated
              : item
          );
          setLocalIndications(updatedList);
        }}
      />

      <AffiliateWithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        affiliateBalance={activeInfo.affiliateBalance || 0}
        onWithdrawSuccess={(newBalance) => {
          if (internalAffiliateInfo) {
            setInternalAffiliateInfo((prev) => prev ? { ...prev, affiliateBalance: newBalance } : null);
          }
          if (onRefresh) onRefresh();
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
