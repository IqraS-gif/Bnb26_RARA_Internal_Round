import React, { useState, useEffect } from 'react';
import LandingHeader from './components/landing/LandingHeader';
import HeroSection from './components/landing/HeroSection';
import BenefitStrip from './components/landing/BenefitStrip';
import HowQuorumWorks from './components/landing/HowQuorumWorks';
import LiveVerification from './components/landing/LiveVerification';
import ConflictDetection from './components/landing/ConflictDetection';
import FinalCTA from './components/landing/FinalCTA';
import Footer from './components/landing/Footer';
import AppShell from './components/app/AppShell';
import VerifyRelease from './pages/VerifyRelease';
import VerificationResult from './pages/VerificationResult';
import VerificationHistory from './pages/VerificationHistory';
import BuilderEvidence from './pages/BuilderEvidence';
import Blockchain from './pages/Blockchain';
import Documentation from './pages/Documentation';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    return (
      path.startsWith('/verify') ||
      path === '/history' ||
      path === '/verification-history' ||
      path === '/builder-evidence' ||
      path === '/evidence' ||
      path === '/blockchain' ||
      path === '/documentation' ||
      path === '/docs'
    )
      ? path
      : '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(
        path.startsWith('/verify') ||
          path === '/history' ||
          path === '/verification-history' ||
          path === '/builder-evidence' ||
          path === '/evidence' ||
          path === '/blockchain' ||
          path === '/documentation' ||
          path === '/docs'
          ? path
          : '/'
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (path) => {
    if (path === currentRoute) return;
    window.history.pushState(null, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Dedicated /verify/:id Result Page
  if (currentRoute.startsWith('/verify/') && currentRoute.length > 8) {
    const verificationId = currentRoute.replace('/verify/', '').split('?')[0];
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/verify">
        <VerificationResult
          verificationId={verificationId}
          onNavigate={handleNavigate}
        />
      </AppShell>
    );
  }

  // Documentation Page
  if (currentRoute === '/documentation' || currentRoute === '/docs') {
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/documentation">
        <Documentation onNavigate={handleNavigate} />
      </AppShell>
    );
  }

  // Blockchain Evidence Page
  if (currentRoute === '/blockchain') {
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/blockchain">
        <Blockchain onNavigate={handleNavigate} />
      </AppShell>
    );
  }

  // Builder Evidence Page
  if (currentRoute === '/builder-evidence' || currentRoute === '/evidence') {
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/builder-evidence">
        <BuilderEvidence onNavigate={handleNavigate} />
      </AppShell>
    );
  }

  // Verification History Page
  if (currentRoute === '/history' || currentRoute === '/verification-history') {
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/history">
        <VerificationHistory onNavigate={handleNavigate} />
      </AppShell>
    );
  }

  // /verify Page
  if (currentRoute === '/verify' || currentRoute.startsWith('/verify')) {
    return (
      <AppShell onNavigate={handleNavigate} currentPath="/verify">
        <VerifyRelease onNavigate={handleNavigate} currentRoute={currentRoute} />
      </AppShell>
    );
  }

  // Standard Quorum Landing Page (Frames 1–5)
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <LandingHeader onNavigate={handleNavigate} />

      {/* Main Landing Page Content */}
      <main className="flex-1 flex flex-col justify-center">
        {/* Frame 1: Hero & Visual Network */}
        <HeroSection onNavigate={handleNavigate} />
        <BenefitStrip />

        {/* Frame 2: How Quorum Works */}
        <HowQuorumWorks />

        {/* Frame 3: A Live Verification You Can See */}
        <LiveVerification onNavigate={handleNavigate} />

        {/* Frame 4: When Builders Disagree */}
        <ConflictDetection />

        {/* Frame 5: Final CTA */}
        <FinalCTA onNavigate={handleNavigate} />
      </main>

      {/* Frame 5: Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
