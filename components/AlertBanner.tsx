import React from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from './icons';

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss?: (id: string) => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  const typeConfig = {
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-400 dark:border-yellow-600',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: <ExclamationTriangleIcon />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-400 dark:border-blue-600',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <InformationCircleIcon />,
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-400 dark:border-green-600',
      text: 'text-green-800 dark:text-green-200',
      icon: <CheckCircleIcon />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-400 dark:border-red-600',
      text: 'text-red-800 dark:text-red-200',
      icon: <ExclamationTriangleIcon />,
    },
  };

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => {
        const config = typeConfig[alert.type];
        return (
          <div
            key={alert.id}
            className={`${config.bg} ${config.border} border-l-4 p-4 rounded-r-lg`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className={config.text}>{config.icon}</div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${config.text}`}>
                  {alert.title}
                </h3>
                <p className={`text-sm mt-1 ${config.text} opacity-90`}>
                  {alert.message}
                </p>
                {alert.action && (
                  <button
                    onClick={alert.action.onClick}
                    className={`mt-2 text-sm font-medium underline ${config.text} hover:opacity-80`}
                  >
                    {alert.action.label}
                  </button>
                )}
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(alert.id)}
                  className={`${config.text} hover:opacity-70`}
                  aria-label="Dismiss alert"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanner;
