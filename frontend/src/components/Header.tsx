// components/Header.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiMenuLine, RiCloseLine, RiLogoutBoxLine, RiUserLine } from '@remixicon/react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';

export type NavItem = { label: string; path: string };

type Props = {
  brand?: string;
};

function BodyPortal({ children, id = 'mobile-menu-portal' }: { children: React.ReactNode; id?: string }) {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (typeof document !== 'undefined' && !elRef.current) {
    const div = document.createElement('div');
    div.id = id;
    elRef.current = div;
  }

  useEffect(() => {
    if (!elRef.current) return;
    document.body.appendChild(elRef.current);
    return () => {
      if (elRef.current?.parentNode) elRef.current.parentNode.removeChild(elRef.current);
    };
  }, []);

  return elRef.current ? createPortal(children, elRef.current) : null;
}

// TS: declarar inert

export default function Header({ brand = 'Disruptica Stream Chat' }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  // const [pendingPath, setPendingPath] = useState<string | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Cierra y limpia estado al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
    // setPendingPath(null);
  }, [pathname]);

  // Bloqueo total del fondo (scroll, foco y VISIBILIDAD)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onEsc);

    document.documentElement.classList.toggle('overflow-hidden', isOpen);
    document.body.classList.toggle('overflow-hidden', isOpen);

    const portalEl = document.getElementById('mobile-menu-portal');
    const siblings = Array.from(document.body.children).filter((el) => el !== portalEl);

    if (isOpen) {
      // Desactiva interacción + oculta visualmente TODO lo demás
      siblings.forEach((el) => {
        el.setAttribute('aria-hidden', 'true');
        (el as HTMLElement).inert = true;
        const h = el as HTMLElement;
        h.dataset.prevVisibility = h.style.visibility || '';
        h.style.visibility = 'hidden';
      });

      // Enfoque accesible
      const id = window.setTimeout(() => firstLinkRef.current?.focus(), 0);

      return () => {
        window.clearTimeout(id);
        window.removeEventListener('keydown', onEsc);
        document.documentElement.classList.remove('overflow-hidden');
        document.body.classList.remove('overflow-hidden');

        siblings.forEach((el) => {
          el.removeAttribute('aria-hidden');
          (el as HTMLElement).inert = false;
          const h = el as HTMLElement;
          const prev = h.dataset.prevVisibility || '';
          if (prev) h.style.visibility = prev;
          else h.style.removeProperty('visibility');
          delete h.dataset.prevVisibility;
        });
      };
    }

    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen]);

  // Manage pending path state for smooth navigation
  // const selectedPath = pendingPath ?? pathname;

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href={isAuthenticated ? "/stream" : "/login"} className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {brand}
          </Link>

          {/* Desktop user menu */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <RiUserLine className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <RiLogoutBoxLine className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Mobile toggle */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-950"
            >
              <RiMenuLine className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile fullscreen menu */}
      {isOpen && (
        <BodyPortal>
          <div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[2147483647] pointer-events-auto"
          >
            {/* Scrim 100% opaco */}
            <div
              className="absolute inset-0 bg-gray-950"
              aria-hidden="true"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <div className="absolute inset-0 flex items-start justify-center">
              <nav
                aria-label="Mobile"
                className="relative mt-0 h-[100dvh] w-screen flex flex-col bg-gray-950
                           transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                {/* Top bar con botón cerrar */}
                <div className="h-16 flex items-center justify-end px-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    <RiCloseLine className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Mobile menu content */}
                <div className="flex-1 flex flex-col justify-center px-8">
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 text-white mb-4">
                        <RiUserLine className="w-6 h-6" />
                        <span className="text-lg">{user?.email}</span>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center space-x-2 px-6 py-3 text-white bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        <RiLogoutBoxLine className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-10 md:hidden" />
              </nav>
            </div>
          </div>
        </BodyPortal>
      )}
    </header>
  );
}
