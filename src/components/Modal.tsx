import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] border border-[#E5E5E5] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
          <h3 className="font-bold text-sm text-[#111111] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F5F5F5] text-[#737373] hover:text-[#111111] flex items-center justify-center transition-colors cursor-pointer border border-[#E5E5E5]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};
