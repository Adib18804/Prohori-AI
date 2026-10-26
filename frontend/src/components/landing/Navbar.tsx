import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          backgroundColor: scrolled ? 'rgba(10, 10, 15, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(42, 42, 56, 0.5)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 group focus-ring-premium"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet to-magenta shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-text-primary">Prohori AI</span>
                <span className="text-[10px] text-text-muted tracking-wider uppercase">Security Gateway</span>
              </div>
            </button>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-200 focus-ring-premium rounded-lg"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border-base rounded-lg transition-all hover:border-violet/50 focus-ring-premium"
              >
                Sign In
              </button>
              <motion.button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-violet to-magenta shadow-glow-sm hover:shadow-glow focus-ring-premium flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary focus-ring-premium rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 lg:hidden bg-background pt-24 px-6"
          >
            <div className="space-y-2">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="w-full text-left px-4 py-3 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 text-base font-medium text-text-secondary border border-border-base rounded-lg hover:border-violet/50 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3 text-base font-semibold text-white rounded-lg bg-gradient-to-r from-violet to-magenta flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
