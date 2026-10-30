import React from 'react';
import type { Metadata } from 'next';
import { getPlatformDataStore } from '@clouse/data';
import { getUnifiedToolCatalog } from '@clouse/tool-sdk';
import { PlatformGovernanceClient } from '@/components/PlatformGovernanceClient';

export const metadata: Metadata = {
  title: 'Cloud Architecture & Security — Clouse Tools',
  description:
    'Unified catalog of 73 tools, 6 isolated server engines, Supabase database with row access control, and 2,500 verified controls.',
};

export default function PlatformPage() {
  const store = getPlatformDataStore();
  const initialSummary = store.getGovernanceSummary();
  const serverTools = getUnifiedToolCatalog().filter((tool) => tool.executionMode !== 'client');
  const initialEngineering = store.queryEngineeringMatrix({ page: 1, pageSize: 12 });
  const initialSecurity = store.querySecurityPractices({ page: 1, pageSize: 12 });

  return (
    <PlatformGovernanceClient
      locale="en"
      initialSummary={initialSummary}
      serverTools={serverTools}
      initialEngineering={initialEngineering}
      initialSecurity={initialSecurity}
    />
  );
}
