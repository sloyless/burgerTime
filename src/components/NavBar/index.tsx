import { MouseEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { App, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBurger,
  faRightFromBracket,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'context/AuthContext';

import Button from 'components/Button';
import { ADMINUID } from 'functions';
import { getGoogleSignInHelpMessage } from 'utils/googleSignIn';

const LOGO_SRC = '/logo.png';
const DEFAULT_AVATAR_SRC = '/favicon.png';

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
      <nav className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-stone-900 hover:text-brand-700"
        >
          <Image
            width={36}
            height={30}
            src={LOGO_SRC}
            priority
            alt="BurgerTime"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <span className="font-venue text-xl">BurgerTime</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
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
