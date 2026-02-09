"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import LanguageSelector from "./LanguageSelector";
import menuData from "./menuData";
import PasscodeModal from "@/components/PasscodeModal";
import { hasVerifiedAccess } from "@/utils/passcode";

const Header = () => {
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  // Reset submenu when mobile menu closes
  useEffect(() => {
    if (!navbarOpen) {
      setOpenIndex(-1);
    }
  }, [navbarOpen]);

  // Passcode modal for document access
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<{
    path: string;
    title: string;
  } | null>(null);

  // Handle document link click
  const handleDocumentClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
    title: string
  ) => {
    // Check if user already has verified access
    if (hasVerifiedAccess()) {
      // Close mobile menu if open (important for iOS)
      setNavbarOpen(false);
      // Allow access - link will open in new tab
      return;
    }

    // Prevent default navigation
    e.preventDefault();
    // Store the document info
    setPendingDocument({ path, title });
    // Open passcode modal
    setIsPasscodeModalOpen(true);
    // Close mobile menu if open
    setNavbarOpen(false);
  };

  // Handle successful passcode verification
  const handlePasscodeSuccess = () => {
    if (pendingDocument) {
      // Open the document in a new tab
      window.open(pendingDocument.path, "_blank");
      setPendingDocument(null);
    }
  };

  const usePathName = usePathname();

  return (
    <>
      <header
        className={`header top-0 left-0 z-40 flex w-full items-center ${
          sticky
            ? "dark:bg-gray-dark dark:shadow-sticky-dark shadow-sticky fixed z-9999 bg-white/80 backdrop-blur-xs transition"
            : "absolute bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
              <Link
                href="/"
                className={`header-logo block w-full ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                } `}
              >
                {/* Light mode logo (with black text) */}
                <Image
                  src="/images/logo/A-logobbb.jpg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full block dark:hidden"
                />
                {/* Dark mode logo (with white text) */}
                <Image
                  src="/images/logo/A-Logo.png"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full hidden dark:block"
                />
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="absolute top-1/2 right-4 block translate-y-[-50%] rounded-lg px-3 py-[6px] outline-none xlg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar border-body-color/50 dark:border-body-color/20 dark:bg-dark absolute right-0 z-30 w-[250px] rounded border-[.5px] bg-white px-6 py-4 duration-300 xlg:visible xlg:static xlg:w-auto xlg:border-none xlg:!bg-transparent xlg:p-0 xlg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                  <ul className="block xlg:flex xlg:space-x-12">
                    {menuData.map((menuItem, index) => (
                      <li key={index} className="group relative">
                        {menuItem.path ? (
                          <Link
                            href={menuItem.path}
                            onClick={() => setNavbarOpen(false)}
                            className={`flex py-2 text-base xlg:mr-0 xlg:inline-flex xlg:px-0 xlg:py-6 ${
                              usePathName === menuItem.path
                                ? "text-primary dark:text-white"
                                : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                            }`}
                          >
                            {menuItem.title}
                          </Link>
                        ) : (
                          <>
                            <p
                              onClick={() => handleSubmenu(index)}
                              className="text-dark group-hover:text-primary flex cursor-pointer items-center justify-between py-2 text-base xlg:mr-0 xlg:inline-flex xlg:px-0 xlg:py-6 dark:text-white/70 dark:group-hover:text-white"
                            >
                              {menuItem.title}
                              <span className="pl-3">
                                <svg width="25" height="24" viewBox="0 0 25 24">
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                                    fill="currentColor"
                                  />
                                </svg>
                              </span>
                            </p>
                            <div
                              className={`submenu dark:bg-dark relative top-full left-0 rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 xlg:invisible xlg:absolute xlg:top-[110%] xlg:block xlg:w-[250px] xlg:p-4 xlg:opacity-0 xlg:shadow-lg xlg:group-hover:visible xlg:group-hover:top-full ${
                                openIndex === index ? "block" : "hidden"
                              }`}
                            >
                              {menuItem.submenu.map((submenuItem, index) => (
                                submenuItem.newTab ? (
                                  <a
                                    href={submenuItem.path}
                                    key={index}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      // Check if this is a PDF document
                                      if (submenuItem.path.includes("/pdf-viewer")) {
                                        handleDocumentClick(
                                          e,
                                          submenuItem.path,
                                          submenuItem.title
                                        );
                                      } else {
                                        setNavbarOpen(false);
                                      }
                                    }}
                                    className="text-dark hover:text-primary block rounded-sm py-2.5 text-sm xlg:px-3 dark:text-white/70 dark:hover:text-white"
                                  >
                                    {submenuItem.title}
                                  </a>
                                ) : (
                                  <Link
                                    href={submenuItem.path}
                                    key={index}
                                    onClick={() => setNavbarOpen(false)}
                                    className="text-dark hover:text-primary block rounded-sm py-2.5 text-sm xlg:px-3 dark:text-white/70 dark:hover:text-white"
                                  >
                                    {submenuItem.title}
                                  </Link>
                                )
                              ))}
                            </div>
                          </>
                        )}
                      </li>
                    ))}

                    {/* Mobile Sign In and Sign Up Links */}
                    <li className="xlg:hidden">
                      <Link
                        href="/signin"
                        onClick={() => setNavbarOpen(false)}
                        className="text-dark hover:text-primary flex py-2 text-base dark:text-white/70 dark:hover:text-white"
                      >
                        Sign In
                      </Link>
                    </li>
                    <li className="xlg:hidden">
                      <Link
                        href="/signup"
                        onClick={() => setNavbarOpen(false)}
                        className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 mt-2 block rounded-full px-8 py-3 text-center text-base font-medium text-white transition duration-300"
                      >
                        Sign Up
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end gap-3 pr-16 xlg:pr-0">
                <Link
                  href="/signin"
                  className="text-dark hidden px-7 py-3 text-base font-medium hover:opacity-70 xlg:block dark:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary/90 hidden rounded-full px-8 py-3 text-base font-medium text-white transition duration-300 xlg:block xlg:px-9"
                >
                  Sign Up
                </Link>
                <LanguageSelector onMenuClose={() => setNavbarOpen(false)} />
                <div>
                  <ThemeToggler />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop - Click to close */}
      {navbarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm xlg:hidden"
          onClick={() => setNavbarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Passcode Modal for Document Access */}
      <PasscodeModal
        isOpen={isPasscodeModalOpen}
        onClose={() => {
          setIsPasscodeModalOpen(false);
          setPendingDocument(null);
        }}
        onSuccess={handlePasscodeSuccess}
        documentTitle={pendingDocument?.title || "Document"}
      />
    </>
  );
};

export default Header;
