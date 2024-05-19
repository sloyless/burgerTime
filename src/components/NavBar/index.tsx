import { MouseEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBurger,
  faCaretDown,
  faCaretUp,
  faGauge,
  faRightFromBracket,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

import logo from './assets/logo.png';
import defaultAvatar from './assets/favicon.png';

import styles from './NavBar.module.css';
import Button from 'components/Button';
import { ADMINUID } from 'functions';

function NavBar() {
  const { login, logout, user } = useAuth();
  const router = useRouter();
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    // Allows user to close dropdown menu by clicking outside the menu/document
    document.body.addEventListener('click', () => {
      setDropdown(false);
    });
  });

  async function loginUser() {
    try {
      await login();
      await router.push('/dashboard');
    } catch (error) {
      console.log(error);
    }
  }

  async function logoutUser() {
    try {
      await logout();
      await router.push('/');
    } catch (error) {
      console.log(error);
    }
  }

  const showDropdown = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDropdown(!dropdown);
  };

  // Main navigation
  const navLinks = [
    {
      title: 'About',
      path: '/about',
      icon: faUtensils,
      active: router.asPath === '/about',
    },
  ];

  // Admin only
  if (user && user?.uid === ADMINUID) {
    navLinks.push(
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: faGauge,
        active: router.asPath === '/dashboard',
      },
      {
        title: 'Add Burger',
        path: '/add',
        icon: faBurger,
        active: router.asPath === '/add',
      }
    );
  }

  return (
    <nav
      className="font-serif border-b border-orange-300 bg-gradient-to-b from-orange-400 to-orange-100
      px-4 py-2 text-slate-900 shadow-md transition-[height] md:px-8"
    >
      <div className="container mx-auto flex flex-wrap items-center">
        <Link href="/" className="flex flex-wrap items-center gap-4 md:mr-6 ">
          <Image
            width={30}
            src={logo}
            alt=""
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
          <h1 className="font-serif text-xl font-extrabold lg:text-2xl">
            BurgerTime
          </h1>
        </Link>
        <div className="flex grow justify-end">
          <div className="relative flex flex-row items-end justify-around lg:ml-auto lg:inline-flex lg:h-auto lg:w-auto lg:flex-row lg:items-center">
            {navLinks.map((item) => {
              return (
                <Link
                  className={`${styles.link} ${
                    item.active ? 'text-orange-500' : 'text-orange-900'
                  } mr-4 flex-row items-center text-center transition-colors duration-300 hover:text-orange-500 lg:mr-8`}
                  href={item.path}
                  key={uuidv4()}
                  title={item.title}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    size="2x"
                    className="mx-auto w-[24px]"
                  />
                </Link>
              );
            })}
            {user ? (
              <button
                className="flex items-center text-slate-800"
                type="button"
                onClick={(e) => showDropdown(e)}
              >
                <Image
                  className="mr-3 rounded-full"
                  src={user.photoURL ?? defaultAvatar}
                  width={25}
                  height={25}
                  alt=""
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                <small className="mr-2 hidden font-sans md:block">
                  {user?.displayName}
                </small>
                <FontAwesomeIcon
                  icon={dropdown ? faCaretUp : faCaretDown}
                  size="sm"
                  className="mx-auto w-[9px]"
                />
              </button>
            ) : (
              <Button onClick={loginUser} status="primary">
                Login
              </Button>
            )}
            {dropdown ? (
              <div
                className={`absolute right-0 top-full z-50 mt-3 flex w-40 flex-col rounded-md bg-white text-slate-800 shadow-md transition duration-300 ease-in-out ${
                  dropdown ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  type="button"
                  className="flex items-center rounded-b-md px-4 py-2 text-left hover:bg-amber-300"
                  onClick={() => logoutUser()}
                >
                  <FontAwesomeIcon
                    icon={faRightFromBracket}
                    className="w-[16px]"
                  />
                  <span className="ml-2">Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
