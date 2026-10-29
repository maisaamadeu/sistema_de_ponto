import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { OnboardingGate } from '@/app/router/onboarding-gate'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { HistoryPage } from '@/features/history/history-page'
import { OnboardingPage } from '@/features/onboarding/onboarding-page'
import { SettingsPage } from '@/features/settings/settings-page'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<OnboardingGate />}>
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="historico" element={<HistoryPage />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
