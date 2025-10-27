import Link from 'next/link'
import AuthNav from '@/components/AuthNav'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-foreground text-base font-semibold tracking-tight">AmLaw</Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/" className="text-foreground/80 hover:text-foreground hover:underline underline-offset-4">Home</Link>
            <Link href="/explore" className="text-foreground/80 hover:text-foreground hover:underline underline-offset-4">Explore</Link>
            <Link href="/search" className="text-foreground/80 hover:text-foreground hover:underline underline-offset-4">Search</Link>
            <Link href="/lists" className="text-foreground/80 hover:text-foreground hover:underline underline-offset-4">Lists</Link>
            <Link href="/settings" className="text-foreground/80 hover:text-foreground hover:underline underline-offset-4">Settings</Link>
          </nav>
        </div>
        <AuthNav />
      </div>
    </header>
  )
}