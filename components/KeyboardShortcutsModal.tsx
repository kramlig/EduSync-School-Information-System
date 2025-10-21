import React from 'react';
import Modal from './Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: 'Tab', description: 'Move to next cell (right)' },
      { keys: 'Shift + Tab', description: 'Move to previous cell (left)' },
      { keys: 'Enter', description: 'Move down to next row (same column)' },
      { keys: 'Arrow Keys', description: 'Navigate up/down/left/right' },
      { keys: 'Escape', description: 'Clear current input and cancel edit' },
    ]},
    { category: 'Filtering & Search', items: [
      { keys: 'Ctrl + F', description: 'Focus search box' },
      { keys: 'Alt + 1-4', description: 'Quick filter (All/Missing/Failing/Excellent)' },
    ]},
    { category: 'Bulk Operations', items: [
      { keys: 'Ctrl + A', description: 'Select all students' },
      { keys: 'Ctrl + Click', description: 'Toggle student selection' },
      { keys: 'Shift + Click', description: 'Select range of students' },
    ]},
    { category: 'Saving', items: [
      { keys: 'Ctrl + S', description: 'Manual save (auto-save is always on)' },
    ]},
    { category: 'Help', items: [
      { keys: 'Ctrl + ?', description: 'Show this help dialog' },
      { keys: 'F1', description: 'Show keyboard shortcuts' },
    ]},
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⌨️ Keyboard Shortcuts">
      <div className="space-y-6">
        {shortcuts.map(section => (
          <div key={section.category}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              {section.category === 'Navigation' && '🧭'}
              {section.category === 'Filtering & Search' && '🔍'}
              {section.category === 'Bulk Operations' && '📦'}
              {section.category === 'Saving' && '💾'}
              {section.category === 'Help' && '❓'}
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.keys} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{item.description}</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-sm">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            💡 Tip: Use keyboard shortcuts to speed up grade entry and navigation!
          </p>
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Got it!
        </button>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;
