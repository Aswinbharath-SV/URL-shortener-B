import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Toast Notification Portal Overlay */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel shadow-lg ${
                n.type === 'success'
                  ? 'border-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                  : n.type === 'error'
                  ? 'border-rose-500/20 text-rose-900 dark:text-rose-300'
                  : 'border-blue-500/20 text-blue-900 dark:text-blue-300'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {n.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {n.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              </div>

              <div className="flex-1 text-sm font-medium leading-5">
                {n.message}
              </div>

              <button
                onClick={() => removeNotification(n.id)}
                className="flex-shrink-0 p-0.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context.showNotification;
};
