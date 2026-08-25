import React, { useState } from 'react';
import { Modal } from './Modal';
import { Loader2, AlertCircle, ShieldCheck, Wallet, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface AffiliateWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliateBalance: number;
  onWithdrawSuccess: (newBalance: number) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const AffiliateWithdrawModal: React.FC<AffiliateWithdrawModalProps> = ({
  isOpen,
  onClose,
  affiliateBalance,
  onWithdrawSuccess,
  onShowToast,
}) => {
  const minWithdraw = 20.0;
  const [amount, setAmount] = useState<string>(minWithdraw.toString());
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [pixKey, setPixKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSelectAll = () => {
    if (affiliateBalance > 0) {
      setAmount(affiliateBalance.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val < minWithdraw) {
      setError(`O valor mínimo para saque de comissões é de R$ ${minWithdraw.toFixed(2).replace('.', ',')}.`);
      return;
    }

    if (val > affiliateBalance) {
      setError(`Saldo de comissões insuficiente. Disponível: ${formatCurrency(affiliateBalance)}`);
      return;
    }

    if (!pixKey.trim()) {
      setError('Por favor, informe a chave PIX de destino.');
      return;
    }

    const token = localStorage.getItem('pg_auth_token') || localStorage.getItem('paygateway_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (!token) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/affiliates/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: val,
          pixKey: `[${pixKeyType.toUpperCase()}] ${pixKey.trim()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (onShowToast) {
          onShowToast(data.message || `Saque de comissões de ${formatCurrency(val)} solicitado com sucesso!`, 'success');
        }
        onWithdrawSuccess(data.affiliateBalance);
        onClose();
      } else {
        setError(data.error || 'Erro ao processar saque de comissões.');
      }
    } catch (err: any) {
      setError('Erro de conexão ao processar o saque. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sacar Comissões de Afiliado">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Balance Card Warning - Clarifying Affiliate Balance Isolation */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Saldo Disponível de Afiliado
            </span>
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Comissões Hub
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-2xl font-black text-emerald-900">
              {formatCurrency(affiliateBalance)}
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={affiliateBalance <= 0}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer disabled:opacity-40"
            >
              Sacar tudo
            </button>
          </div>
          <p className="text-[10px] text-emerald-700 font-medium pt-1">
            Este saldo provém exclusivamente das suas comissões de indicação e é separado do saldo de jogador/apostas.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Valor do Saque (R$)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min={minWithdraw}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            Valor mínimo para saque de afiliados: {formatCurrency(minWithdraw)}
          </span>
        </div>

        {/* PIX Key Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Tipo de Chave PIX
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'cpf', label: 'CPF' },
              { id: 'email', label: 'E-mail' },
              { id: 'phone', label: 'Telefone' },
              { id: 'random', label: 'Aleatória' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPixKeyType(t.id as any)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  pixKeyType === t.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* PIX Key Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Chave PIX de Destino
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder={
              pixKeyType === 'cpf'
                ? '000.000.000-00'
                : pixKeyType === 'email'
                ? 'seu@email.com'
                : pixKeyType === 'phone'
                ? '(11) 99999-9999'
                : 'Chave aleatória'
            }
            required
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || affiliateBalance < minWithdraw}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processando Saque PIX...</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              <span>Confirmar Saque de Comissões PIX</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pagamento instantâneo via PIX do Programa de Afiliados</span>
        </div>
      </form>
    </Modal>
  );
};
