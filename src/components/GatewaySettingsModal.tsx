import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  UserPlus,
  Zap,
  X,
  Smartphone,
  Check,
} from 'lucide-react';
import {
  getNotificationState,
  requestNotificationPermission,
  setNotificationsEnabled,
  setNewAffiliateNotificationsEnabled,
  triggerSaleNotification,
  triggerBackgroundPushTest,
  NotificationState,
} from '../lib/pwaNotification';

interface GatewaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const GatewaySettingsModal: React.FC<GatewaySettingsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [notifState, setNotifState] = useState<NotificationState>(getNotificationState());
  const [salesEnabled, setSalesEnabled] = useState<boolean>(false);
  const [newAffiliateEnabled, setNewAffiliateEnabledState] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const state = getNotificationState();
      setNotifState(state);
      setSalesEnabled(state.enabled && state.permission === 'granted');
      setNewAffiliateEnabledState(state.newAffiliateEnabled);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSales = async () => {
    if (!salesEnabled) {
      const granted = await requestNotificationPermission();
      const updatedState = getNotificationState();
      setNotifState(updatedState);

      if (granted) {
        setSalesEnabled(true);
        setNotificationsEnabled(true);
        onShowToast('Notificações de vendas ativadas!', 'success');

        triggerSaleNotification({
          amount: '37,50',
          customTitle: 'Nova Venda na sua rede!',
          customSubtitle: 'Comissão de R$ 37,50 adicionada ao saldo!',
        });
      } else {
        setSalesEnabled(false);
        setNotificationsEnabled(false);
        if (updatedState.permission === 'denied') {
          onShowToast('Permissão negada no navegador.', 'error');
        }
      }
    } else {
      setSalesEnabled(false);
      setNotificationsEnabled(false);
      onShowToast('Notificações de vendas desativadas.', 'info');
    }
  };

  const handleToggleNewAffiliate = () => {
    const nextVal = !newAffiliateEnabled;
    setNewAffiliateEnabledState(nextVal);
    setNewAffiliateNotificationsEnabled(nextVal);
    onShowToast(
      nextVal
        ? 'Notificação de novo cadastro ativada!'
        : 'Notificação de novo cadastro desativada.',
      nextVal ? 'success' : 'info'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Black & White Clean */}
        <div className="bg-white px-6 pt-5 pb-4 flex items-center justify-between border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0 text-white shadow-xs">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-black tracking-tight">
                Notificações de Vendas
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Alertas em Tempo Real no seu dispositivo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-black flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto no-scrollbar">
          {/* Status Badge */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-zinc-700" />
              <span className="text-xs font-semibold text-zinc-800">Status no Dispositivo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Check className="w-3 h-3 text-white" />
              <span>{notifState.permission === 'granted' ? 'Ativo' : 'Pendente'}</span>
            </div>
          </div>

          {/* Toggle 1: Notificação de Vendas */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  salesEnabled
                    ? 'bg-black text-white border-black'
                    : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                }`}
              >
                {salesEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-black">Notificação de Vendas</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Notifica sempre que cair uma nova venda
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleSales}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                salesEnabled ? 'bg-black' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  salesEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Notificação de Novo Cadastro */}
          <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  newAffiliateEnabled
                    ? 'bg-black text-white border-black'
                    : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                }`}
              >
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-black">Notificação de Novo Cadastro</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-tight">
                  Notifica novos cadastros na sua rede de afiliados
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleNewAffiliate}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                newAffiliateEnabled ? 'bg-black' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  newAffiliateEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
