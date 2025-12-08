import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

export const Navbar = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll);
  }, [])

  return (
    <header>
      <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2 top-0 left-0">
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5'
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Logo + mobile controls */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link to="/" aria-label="home" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Trekky" className="h-8 w-auto" />
                <span className="ml-1 text-lg font-semibold tracking-tight text-foreground">
                  Trekky
                </span>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState === true ? 'Close Menu' : 'Open Menu'}
                  className="relative z-20 -m-2.5 block cursor-pointer p-2.5"
                >
                  <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                  <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                </button>
              </div>
            </div>

            {/* CENTER DESKTOP MENU */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                {/* Add more links if you want later */}
                <Link
                  to="/trek-ai"
                  className="hover:text-foreground transition-colors"
                >
                  Trek AI Photo
                </Link>
              </nav>
            </div>

            {/* RIGHT SIDE: mobile dropdown + auth buttons */}
            <div
              className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent"
            >
              {/* MOBILE MENU LINKS */}
              <div className="lg:hidden w-full">
                <nav className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
                  <Link
                    to="/trek-ai"
                    onClick={() => setMenuState(false)}
                    className="hover:text-foreground transition-colors"
                  >
                    Trek AI Photo
                  </Link>
                  {/* you can add more mobile links here later */}
                </nav>
              </div>

              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit items-center">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(isScrolled && 'lg:hidden')}
                >
                  <Link to="/auth?mode=login">
                    <span>Login</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(isScrolled && 'lg:hidden')}
                >
                  <Link to="/auth?mode=signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
