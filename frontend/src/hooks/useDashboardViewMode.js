import { useState, useEffect } from 'react';

/**
 * Custom hook to manage and persist dashboard view mode (dashboard or feed)
 * @param {string} defaultMode - Default view mode if localStorage is empty
 * @returns {[string, Function]} - Current viewMode and setViewMode function
 */
export const useDashboardViewMode = (defaultMode = 'dashboard') => {
  const [viewMode, setViewMode] = useState(() => {
    // Initialize from localStorage or use default
    const savedViewMode = localStorage.getItem('dashboardViewMode');
    return savedViewMode || defaultMode;
  });

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardViewMode', viewMode);
  }, [viewMode]);

  return [viewMode, setViewMode];
};
