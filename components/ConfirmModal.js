'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ 
  isOpen, 
  title = 'Confirm', 
  message = 'Are you sure?', 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel' 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="bg-white/10 border border-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-sm w-full text-white relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <p className="mb-6">{message}</p>

            <div className="flex justify-end gap-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 transition"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 transition"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
