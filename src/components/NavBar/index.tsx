import { MouseEvent, useEffect, useState } from 'react';
import Image from "next/legacy/image";
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
  if (user?.uid === 'HN7f9PmeCgg3nd8WRFb6EhJVPnl2') {
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
      className="font-serif flex flex-wrap items-center bg-orange-600 px-4 py-2
      text-white transition-[height] md:px-8"
    >
      <Link
        href={user ? '/dashboard' : '/'}
        className="flex flex-wrap items-center gap-4 md:mr-6"
      >
        <Image width={30} src={logo} alt="" priority />
        <h1 className="hidden text-xl lg:inline">BurgerTime</h1>
      </Link>
      <div className="flex grow justify-around">
        <div className="ml-5 flex w-auto items-center justify-around gap-8">
          {user &&
            navLinks.map((item) => {
              return (
                <Link
                  className={`${styles.link} ${
                    item.active ? 'text-amber-300' : 'text-white'
                  } flex-row items-center text-center transition-colors duration-300 hover:text-amber-400`}
                  href={item.path}
                  key={uuidv4()}
                >
                  <FontAwesomeIcon
                    icon={item.icon}
                    className="mx-auto w-[24px] text-amber-200"
                  />
                  <span className="ml-2">{item.title}</span>
                </Link>
              );
            })}
        </div>
        <div className="relative flex flex-row items-end justify-around lg:ml-auto lg:inline-flex lg:h-auto lg:w-auto lg:flex-row lg:items-center">
          {user ? (
            <button
              className="flex items-center text-white"
              type="button"
              onClick={(e) => showDropdown(e)}
            >
              <Image
                className="mr-3 rounded-full"
                src={user.photoURL ?? defaultAvatar}
                width={40}
                height={40}
                alt=""
              />
              <small className="mr-2 hidden md:block">
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
              {/* {subNavLinks.map((item, i) => {
                let rounded = '';

                if (i + 1 === subNavLinks.length) {
                  rounded = 'rounded-b-md';
                } else if (i === 0) {
                  rounded = 'rounded-t-md';
                }

                return (
                  <Link
                    className={`${
                      item.active ? 'bg-amber-300' : ''
                    } ${rounded} flex items-center px-4 py-2 hover:bg-amber-300`}
                    href={item.path}
                    key={uuidv4()}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-[16px]" />
                    <span className="ml-2">{item.title}</span>
                  </Link>
                );
              })} */}
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
    </nav>
  );
}

export default NavBar;
