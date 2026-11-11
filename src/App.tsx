import React, { useState } from 'react';
import { Role, ResearchProtocolSettings, ClinicalCase } from './types';
import { researchStore } from './services/researchStore';
import { Navbar } from './components/layout/Navbar';
import { ParticipantFlow } from './components/participant/ParticipantFlow';
import { ResearcherDashboard } from './components/researcher/ResearcherDashboard';
import { ResearcherAuthModal } from './components/researcher/ResearcherAuthModal';

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('participant');
  const [activeTab, setActiveTab] = useState<string>('participant');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isResearcherAuthenticated, setIsResearcherAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<ResearchProtocolSettings>(() => researchStore.getSettings());
  const [cases, setCases] = useState<ClinicalCase[]>(() => researchStore.getCases());

  const handleUpdateSettings = (newSettings: Partial<ResearchProtocolSettings>) => {
    researchStore.updateSettings(newSettings);
    setSettings(researchStore.getSettings());
  };

  const handleUpdateCase = (updatedCase: ClinicalCase) => {
    researchStore.updateCase(updatedCase);
    setCases(researchStore.getCases());
  };

  const handleRoleChange = (targetRole: Role) => {
    if (targetRole === 'researcher') {
      if (!isResearcherAuthenticated) {
        setIsAuthModalOpen(true);
      } else {
        setCurrentRole('researcher');
        setActiveTab('researcher');
      }
    } else {
      setCurrentRole('participant');
      setActiveTab('participant');
    }
  };

  const handleAuthenticate = () => {
    setIsResearcherAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentRole('researcher');
    setActiveTab('researcher');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'participant') {
      setCurrentRole('participant');
      setActiveTab('participant');
    } else {
      if (!isResearcherAuthenticated) {
        setIsAuthModalOpen(true);
      } else {
        setCurrentRole('researcher');
        setActiveTab(tab);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDemoMode={isDemoMode}
        onToggleDemoMode={(val) => setIsDemoMode(val)}
      />

      {/* Main Viewport */}
      <div className="flex-1">
        {currentRole === 'participant' ? (
          <ParticipantFlow
            isDemoMode={isDemoMode}
            settings={settings}
            cases={cases}
            onOpenResearcherDashboard={() => handleRoleChange('researcher')}
          />
        ) : (
          <ResearcherDashboard
            isDemoMode={isDemoMode}
            onToggleDemoMode={(val) => setIsDemoMode(val)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            cases={cases}
            onUpdateCase={handleUpdateCase}
          />
        )}
      </div>

      {/* Passcode Authentication Modal */}
      <ResearcherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthenticate={handleAuthenticate}
        configuredPasscode={settings.passcode}
      />
    </div>
  );
}
