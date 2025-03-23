import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ErrorPopupProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoCloseDelay?: number;
}

export default function ErrorPopup({
  message,
  isVisible,
  onClose,
  autoCloseDelay = 4000
}: ErrorPopupProps) {
  // Auto-close after delay
  useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, autoCloseDelay]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 min-w-[300px] max-w-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-red-500 text-white rounded-lg shadow-lg p-4 pr-10 relative">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute right-2 top-2 text-white hover:text-gray-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 