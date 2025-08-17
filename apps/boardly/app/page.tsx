"use client"

import Link from "next/link"
import { ArrowRight, Github } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="text-2xl font-montserrat font-black text-foreground">boardly</span>

            <nav className="flex items-center space-x-6">
              <Link
                href="https://github.com"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center gap-2"
              >
                <Github className="w-5 h-5" />
                GitHub
              </Link>
              <Link
                href="/signin"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center fade-in">
            <div className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Realtime eraser.io alternative</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-montserrat font-black text-foreground mb-6 leading-tight">
              Unified canvas for
              <br />
              <span className="text-primary">every team</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              boardly connects to all your favourite apps and services to let you access your creativity from anywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="btn-primary text-primary-foreground px-8 py-3 rounded-lg font-medium inline-flex items-center gap-2 professional-glow"
              >
                Sign Up
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signin"
                className="btn-secondary px-8 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
