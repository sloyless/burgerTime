import { type MouseEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { App, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBurger,
  faMagnifyingGlass,
  faRightFromBracket,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'context/AuthContext';

import Button from 'components/Button';
import SiteWordmark from 'components/SiteWordmark';
import { ADMINUID } from 'functions';
import { getGoogleSignInHelpMessage } from 'utils/googleSignIn';

const DEFAULT_AVATAR_SRC = '/favicon.png';
const HOME_HERO_ID = 'home-hero';

function NavBar() {
  const { message } = App.useApp();
  const { login, logout, user } = useAuth();
  const router = useRouter();
  const [loginPending, setLoginPending] = useState(false);

  async function loginUser(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (loginPending) return;

    setLoginPending(true);
    try {
      const result = await login();
      if (result === undefined) {
        message.loading('Redirecting to Google…', 2);
        return;
      }
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : 'unknown';
      console.error('Google sign-in failed:', code, error);
      message.error(getGoogleSignInHelpMessage(error), 8);
    } finally {
      setLoginPending(false);
    }
  }

  async function logoutUser() {
    try {
      await logout();
      await router.push('/');
    } catch (error) {
      console.error(error);
    }
  }

  const navLinks = [
    {
      title: 'Search',
      path: '/search',
      icon: faMagnifyingGlass,
      active: router.pathname === '/search',
    },
    {
      title: 'About',
      path: '/about',
      icon: faUtensils,
      active: router.asPath === '/about',
    },
  ];

  if (user && user?.uid === ADMINUID) {
    navLinks.push({
      title: 'Add review',
      path: '/add',
      icon: faBurger,
      active: router.asPath === '/add',
    });
  }

  const isHome = router.pathname === '/';
  const [homeHeroInView, setHomeHeroInView] = useState(true);

  useEffect(() => {
    if (!isHome) {
      return;
    }

    let observer: IntersectionObserver | undefined;

    const attach = () => {
      const hero = document.getElementById(HOME_HERO_ID);
      if (!hero) return false;

      observer = new IntersectionObserver(
        ([entry]) => {
          setHomeHeroInView(entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(hero);
      return true;
    };

    if (!attach()) {
      const frameId = requestAnimationFrame(() => {
        attach();
      });
      return () => {
        cancelAnimationFrame(frameId);
        observer?.disconnect();
      };
    }

    return () => observer?.disconnect();
  }, [isHome, router.asPath]);

  const brandHidden = isHome && homeHeroInView;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: 'Logout',
      icon: <FontAwesomeIcon icon={faRightFromBracket} className="size-4" />,
      onClick: () => logoutUser(),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
      <nav
        className={`relative mx-auto flex max-w-screen-2xl flex-wrap items-center justify-end gap-3 px-4 py-2 sm:px-6 lg:px-8`}
      >
        <Link
          href="/"
          aria-hidden={isHome && brandHidden}
          tabIndex={isHome && brandHidden ? -1 : undefined}
          className={`absolute top-1/2 left-4 -translate-y-1/2 sm:left-6 lg:left-8 ${
            brandHidden ? 'pointer-events-none' : ''
          }`}
        >
          <span
            className="inline-block whitespace-nowrap text-stone-900 hover:text-brand-700"
            style={{
              opacity: brandHidden ? 0 : 1,
              transition: isHome ? 'opacity 300ms ease-out' : undefined,
            }}
          >
            <SiteWordmark
              className="text-xl text-stone-900"
              priority={!isHome}
            />
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              title={item.title}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-sans text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-brand-700'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="size-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </Link>
          ))}

          {user ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <button
                className="flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1 pl-1 shadow-sm"
                type="button"
              >
                <Image
                  className="rounded-full"
                  src={user.photoURL ?? DEFAULT_AVATAR_SRC}
                  width={28}
                  height={28}
                  alt=""
                  loading="lazy"
                />
                <span className="hidden max-w-28 truncate font-sans text-sm text-stone-700 md:inline">
                  {user.displayName}
                </span>
              </button>
            </Dropdown>
          ) : (
            <Button
              type="button"
              onClick={loginUser}
              status="primary"
              disabled={loginPending}
              loading={loginPending}
            >
              Login
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
