// src/components/Toast.js
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

function Toast({ 
  message, 
  type = 'info', 
  duration = 4000, 
  onClose,
  position = 'top-right' 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      default:
        return <Info size={20} color="#3b82f6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      default:
        return '#eff6ff';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 1000,
      transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      transition: 'transform 0.3s ease-in-out'
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-center':
        return { ...base, top: '20px', left: '50%', transform: `translateX(${isExiting ? '100%' : '-50%'})` };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-center':
        return { ...base, bottom: '20px', left: '50%', transform: `translateX(${isExiting ? '100%' : '-50%'})` };
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      default:
        return { ...base, top: '20px', right: '20px' };
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        ...getPositionStyles(),
        backgroundColor: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: '8px',
        padding: '16px',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}
    >
      {/* Icon */}
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {getIcon()}
      </div>

      {/* Message */}
      <div style={{ flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          lineHeight: '1.5',
          color: '#374151'
        }}>
          {message}
        </p>
      </div>

      {/* Close Button */}
     <button
  onClick={handleClose}
  style={{
    flexShrink: 0,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    zIndex: 1001  // Add this
  }}
>
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} color="#6b7280" />
      </button>
    </div>
  );
}

// Toast Container Component
function ToastContainer({ toasts, removeToast, position = 'top-right' }) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration + 300); // Extra time for exit animation
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer: ({ position }) => (
      <ToastContainer 
        toasts={toasts} 
        removeToast={removeToast} 
        position={position} 
      />
    )
  };
}

export default Toast;
