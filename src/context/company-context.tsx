
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getCompanyInfo, type CompanyInfo } from '@/services/settings';

interface CompanyContextType {
  companyInfo: CompanyInfo | null;
  loading: boolean;
  refreshCompanyInfo: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanyInfo = useCallback(async () => {
    setLoading(true);
    try {
      const info = await getCompanyInfo();
      setCompanyInfo(info);
    } catch (error) {
      console.error('Failed to load company info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyInfo();
  }, [fetchCompanyInfo]);

  const value = { companyInfo, loading, refreshCompanyInfo: fetchCompanyInfo };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
