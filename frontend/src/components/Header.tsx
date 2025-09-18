// components/Header.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RiMenuLine, RiCloseLine } from '@remixicon/react';
import { createPortal } from 'react-dom';

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
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Cierra y limpia estado al cambiar de ruta
  useEffect(() => {
    setIsOpen(false);
    setPendingPath(null);
  }, [pathname]);

  // Bloqueo total del fondo (scroll, foco y VISIBILIDAD)
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onEsc as any);

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
        window.removeEventListener('keydown', onEsc as any);
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

    return () => window.removeEventListener('keydown', onEsc as any);
  }, [isOpen]);

  // Selección actual (respeta click inmediato antes de que cambie la ruta)
  const selectedPath = pendingPath ?? pathname;

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {brand}
          </Link>


          {/* Mobile toggle */}
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


                <div className="h-10 md:hidden" />
              </nav>
            </div>
          </div>
        </BodyPortal>
      )}
    </header>
  );
}
