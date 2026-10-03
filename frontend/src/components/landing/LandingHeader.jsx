import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function LandingHeader({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navLinks = [
    { label: 'How it Works', id: 'how-it-works', href: '#how-it-works' },
    { label: 'Live Demo', id: 'live-demo', href: '#live-demo' },
    { label: 'Builders', id: 'builders', href: '#builders' },
    { label: 'About', id: 'about', href: '#about' },
  ];

  // Detect scroll position for sticky navbar shadow state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section-aware active item detection using IntersectionObserver
  useEffect(() => {
    const sectionIds = ['hero', 'how-it-works', 'live-demo', 'builders', 'about'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observerCallback = (entries) => {
      // Check if at the bottom of the page
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;

      if (isAtBottom) {
        setActiveSection('about');
        return;
      }

      // If near the top, no nav link should be active (Hero section is active)
      if (window.scrollY < 120) {
        setActiveSection('');
        return;
      }

      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by closest to viewport top / largest intersection ratio
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const currentId = visibleEntries[0].target.id;
        if (currentId === 'hero') {
          setActiveSection('');
        } else {
          setActiveSection(currentId);
        }
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '-80px 0px -40% 0px',
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
    });

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll handler respecting prefers-reduced-motion
  const scrollToSection = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
      window.history.pushState(null, '', `#${targetId}`);
    }
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
    window.history.pushState(null, '', '/');
    setActiveSection('');
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleGetStarted = (e) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate('/verify');
    }
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-all duration-200 ${
        isScrolled
          ? 'border-b border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)]'
          : 'border-b border-slate-100 shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* ==================================================== */}
          {/* LEFT: BRAND LOGO */}
          {/* ==================================================== */}
          <a
            href="#hero"
            onClick={handleLogoClick}
            className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none rounded-lg p-1"
            aria-label="Quorum Home"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white"
                aria-hidden="true"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Quorum
            </span>
          </a>

          {/* ==================================================== */}
          {/* CENTER: SECTION-AWARE DESKTOP NAVIGATION */}
          {/* ==================================================== */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm py-2 px-1 relative transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-md ${
                    isActive
                      ? 'font-semibold text-blue-600'
                      : 'font-medium text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-fade-in"
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* ==================================================== */}
          {/* RIGHT: GET STARTED PRIMARY BUTTON */}
          {/* ==================================================== */}
          <div className="hidden md:flex items-center">
            <a
              href="/verify"
              onClick={handleGetStarted}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-xs hover:shadow hover:-translate-y-0.5 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-0.5" aria-hidden="true" />
            </a>
          </div>

          {/* ==================================================== */}
          {/* MOBILE MENU TOGGLE BUTTON */}
          {/* ==================================================== */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ==================================================== */}
      {/* MOBILE COLLAPSIBLE DRAWER */}
      {/* ==================================================== */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-fade-in"
        >
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-2.5 text-base rounded-lg transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-700 font-medium hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                  )}
                </a>
              );
            })}
          </nav>
          
          <div className="pt-2 border-t border-slate-100">
            <a
              href="/verify"
              onClick={handleGetStarted}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
