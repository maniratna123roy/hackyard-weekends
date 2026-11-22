'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, ChevronRight,
  CircleHelp, Clock3, Compass, ExternalLink, FileText, Flag, Grid2X2, Layers3, Menu, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Trophy, Users, X, Zap, LogOut, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/lib/AuthProvider'
import { apiFetch } from '@/lib/apiClient'
import { useTheme } from '@/lib/ThemeProvider'

const navPublic = [
  ['Discover', '/events'],
  ['How it works', '/how-it-works'],
  ['For founders', '/for-founders'],
  ['For teams', '/for-teams']
]

const missions = ['Bug Fix', 'Feature', 'Growth & Marketing', 'UX/UI', 'Other']

const appNav: Record<'participant' | 'founder' | 'admin', [string, string, typeof Grid2X2][]> = {
  participant: [
    ['Overview', '/dashboard', Grid2X2],
    ['My teams', '/dashboard/teams', Users],
    ['Missions', '/events', Compass],
    ['Certificates', '/dashboard/certificates', FileText],
    ['Rewards', '/dashboard/rewards', Trophy],
    ['Notifications', '/dashboard/notifications', Bell],
    ['Profile', '/dashboard/profile', Users],
    ['Settings', '/dashboard/settings', Settings2]
  ],
  founder: [
    ['Overview', '/founder', Grid2X2],
    ['Startup', '/founder/startup', Layers3],
    ['My missions', '/founder/missions', Flag],
    ['Create mission', '/founder/missions/new', Plus],
    ['Judging desk', '/founder/judging', ShieldCheck],
    ['Notifications', '/founder/notifications', Bell],
    ['Settings', '/founder/settings', Settings2]
  ],
  admin: [
    ['Overview', '/admin', Grid2X2],
    ['Events', '/admin/events', Compass],
    ['Startups', '/admin/startups', Layers3],
    ['Missions', '/admin/missions', Flag],
    ['Users', '/admin/users', Users],
    ['Reports', '/admin/reports', FileText],
    ['Analytics', '/admin/analytics', Grid2X2],
    ['Settings', '/admin/settings', Settings2]
  ]
}

const titleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" aria-label="Hackyard Weekends home" className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span>
        hackyard<span className="brand-weekends">weekends</span>
      </span>
    </Link>
  )
}

function PublicNav() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="public-nav">
      <Brand />
      <nav className={open ? 'public-links is-open' : 'public-links'} aria-label="Main navigation">
        {navPublic.map(([label, href]) => (
          <Link onClick={() => setOpen(false)} href={href} key={href}>
            {label}
          </Link>
        ))}
        {!user && (
          <Link className="mobile-join" href="/signup">
            Join Hackyard <ArrowUpRight size={15} />
          </Link>
        )}
      </nav>
      <div className="nav-actions">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} style={{ color: '#ffb300' }} /> : <Moon size={17} />}
        </button>
        {user ? (
          <>
            <Link
              className="button button-small button-outline"
              href={user.role === 'admin' ? '/admin' : user.role === 'founder' ? '/founder' : '/dashboard'}
            >
              {user.role === 'admin' ? 'Admin Ops' : user.role === 'founder' ? 'Founder Studio' : 'Workspace'}
            </Link>
            <button className="button button-small button-dark" onClick={() => logout()}>
              <LogOut size={13} /> Sign out
            </button>
          </>
        ) : (
          <>
            <Link className="nav-signin" href="/login">
              Sign in
            </Link>
            <Link className="button button-dark nav-join" href="/signup">
              Join Hackyard <ArrowUpRight size={15} />
            </Link>
          </>
        )}
        <button
          className="icon-button menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Brand />
          <p>Make a weekend count.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>EXPLORE</span>
            <Link href="/events">Missions</Link>
            <Link href="/events">Events</Link>
            <Link href="/how-it-works">How it works</Link>
          </div>
          <div>
            <span>GET INVOLVED</span>
            <Link href="/for-founders">For founders</Link>
            <Link href="/for-teams">For teams</Link>
            <Link href="/signup">Join the community</Link>
          </div>
          <div>
            <span>GROW TOGETHER</span>
            <Link href="/referrals">Referrals</Link>
            <Link href="/ambassadors">Ambassadors</Link>
            <Link href="/showcase">Showcase</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Hackyard Weekends</span>
        <span>Build something that matters.</span>
        <Link href="/report">
          Report a concern <ArrowUpRight size={13} />
        </Link>
      </div>
    </footer>
  )
}

function SectionLabel({ children, color = 'blue' }: { children: React.ReactNode; color?: string }) {
  return (
    <div className={`section-label label-${color}`}>
      <span className="label-dot" />
      {children}
    </div>
  )
}

function EmptyState({
  title = 'Nothing here yet.',
  description = 'When something is ready, it will show up here.',
  action,
  href = '/events',
  onClick
}: {
  title?: string
  description?: string
  action?: string
  href?: string
  onClick?: () => void
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Sparkles size={19} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        onClick ? (
          <button className="button button-outline button-small" onClick={onClick}>
            {action} <ArrowRight size={14} />
          </button>
        ) : (
          <Link className="button button-outline button-small" href={href}>
            {action} <ArrowRight size={14} />
          </Link>
        )
      )}
    </div>
  )
}

function FeatureCard({
  number,
  title,
  text,
  tone = 'blue'
}: {
  number: string
  title: string
  text: string
  tone?: string
}) {
  return (
    <article className={`feature-card tone-${tone}`}>
      <span className="feature-number">{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <ArrowUpRight className="feature-arrow" size={18} />
    </article>
  )
}

function Landing() {
  return (
    <>
      <PublicNav />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <SectionLabel>THE WEEKEND STARTUP SPRINT</SectionLabel>
            <h1>
              Real problems.<br />Real <em>builders.</em><br />Real impact.
            </h1>
            <p className="hero-lede">
              Startups bring the challenges. Teams bring the ideas. In 24 hours, something real gets built.
            </p>
            <div className="hero-buttons">
              <Link className="button button-blue" href="/events">
                Explore missions <ArrowUpRight size={17} />
              </Link>
              <Link className="button button-outline" href="/for-founders">
                I&apos;m a founder <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-proof">
              <div className="proof-avatars">
                <span>H</span>
                <span>W</span>
                <span>24</span>
              </div>
              <span>Good ideas deserve a weekend.</span>
            </div>
          </div>
          <div className="hero-art" aria-label="A 24-hour creative sprint">
            <div className="art-grid" />
            <div className="art-outline">
              BUILD<br />WEEKEND
            </div>
            <div className="art-blue">
              <span className="art-24">
                24<span>H</span>
              </span>
              <span className="art-blue-caption">
                A little time.<br />A lot of momentum.
              </span>
              <ArrowDownRight size={38} />
            </div>
            <div className="art-orange" />
            <div className="art-lime">
              IDEAS<br />INTO<br />ACTION<span>✳</span>
            </div>
            <div className="art-tag tag-top">ISSUE NO. 01 / BUILD</div>
            <div className="art-tag tag-bottom">START HERE ↗</div>
            <div className="art-orbit" />
          </div>
          <div className="hero-side-note">
            A different kind<br />of weekend <ArrowDownRight size={16} />
          </div>
        </section>
        <section className="ticker">
          <span>LESS TALK, MORE BUILDING</span>
          <i>✳</i>
          <span>REAL STARTUP CHALLENGES</span>
          <i>✳</i>
          <span>24 HOURS TO MAKE A DENT</span>
          <i>✳</i>
          <span>OPEN TO CURIOUS MINDS</span>
        </section>
        <section className="intro section-wrap">
          <div className="intro-title">
            <SectionLabel color="orange">NOT ANOTHER HACKATHON</SectionLabel>
            <h2>
              Start with a problem.<br /><em>Leave with proof.</em>
            </h2>
          </div>
          <div className="intro-body">
            <p>
              Hackyard Weekends puts curious people in the room with real startups and the stuff they actually need help solving.
            </p>
            <p>
              No made-up briefs. No waiting for permission. Just a focused sprint, a sharp team, and a useful thing at the end.
            </p>
            <Link className="text-link" href="/how-it-works">
              Get the full picture <ArrowRight size={15} />
            </Link>
          </div>
        </section>
        <section className="how-section">
          <div className="section-wrap">
            <div className="section-heading">
              <div>
                <SectionLabel color="lime">THE GOOD PART</SectionLabel>
                <h2>
                  One weekend.<br /><em>Three moves.</em>
                </h2>
              </div>
              <p>
                Small enough to start.<br />Real enough to matter.
              </p>
            </div>
            <div className="steps-layout">
              <div className="step-feature">
                <span className="step-big">01</span>
                <div className="step-shape">
                  <span>01</span>
                  <Zap size={50} />
                </div>
                <h3>Pick a real problem</h3>
                <p>Founders bring the knot they can&apos;t untangle. You choose the one you can&apos;t stop thinking about.</p>
                <Link className="step-link" href="/events">
                  Find your challenge <ArrowRight size={15} />
                </Link>
              </div>
              <div className="step-list">
                <article>
                  <span>02</span>
                  <div>
                    <h3>Find your people</h3>
                    <p>Team up with builders, designers, and big-question askers who see it differently.</p>
                  </div>
                  <div className="step-visual visual-orange">
                    <Users size={25} />
                  </div>
                </article>
                <article>
                  <span>03</span>
                  <div>
                    <h3>Make it real</h3>
                    <p>Work shoulder-to-shoulder for 24 hours. Ship a useful answer, not a slide deck.</p>
                  </div>
                  <div className="step-visual visual-lime">
                    <ArrowUpRight size={27} />
                  </div>
                </article>
                <article>
                  <span>04</span>
                  <div>
                    <h3>Show what you made</h3>
                    <p>Present your work to the people who brought the challenge. Your next opportunity starts here.</p>
                  </div>
                  <div className="step-visual visual-violet">
                    <Trophy size={25} />
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
        <section className="final-cta">
          <div className="cta-sticker">
            GOOD<br />THINGS<br />HAPPEN<br /><span>↘</span>
          </div>
          <SectionLabel color="orange">YOUR MOVE</SectionLabel>
          <h2>
            Got a problem?<br />Got a point of view?<br /><em>Good. Start there.</em>
          </h2>
          <div className="cta-buttons">
            <Link href="/signup" className="button button-dark">
              I want to build <ArrowUpRight size={16} />
            </Link>
            <Link href="/signup?role=founder" className="button button-outline">
              I have a startup <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function AppShell({
  role,
  children,
  title,
  eyebrow
}: {
  role: 'participant' | 'founder' | 'admin'
  children: React.ReactNode
  title: string
  eyebrow?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const nav = appNav[role]
  const labels = { participant: 'BUILDER SPACE', founder: 'FOUNDER STUDIO', admin: 'PLATFORM OPS' }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <Brand />
          <button onClick={() => setMobileOpen(false)} className="icon-button sidebar-close" aria-label="Close menu">
            <X />
          </button>
        </div>
        <div className="sidebar-workspace">
          <span className="workspace-avatar">{role === 'participant' ? 'B' : role === 'founder' ? 'F' : '👑'}</span>
          <span>
            <small>{labels[role]}</small>
            <strong>{user?.name || (role === 'participant' ? 'Your workspace' : role === 'founder' ? 'Startup space' : 'Hackyard Admin (King)')}</strong>
          </span>
        </div>
        <span className="sidebar-caption">WORKSPACE</span>
        <nav className="sidebar-nav" aria-label={`${role} navigation`}>
          {nav.map(([label, href, Icon]) => (
            <Link
              key={href}
              onClick={() => setMobileOpen(false)}
              className={pathname === href || (href !== '/dashboard' && href !== '/founder' && href !== '/admin' && pathname.startsWith(href)) ? 'active' : ''}
              href={href}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            onClick={() => logout()}
            className="button button-outline button-small button-full"
            style={{ marginBottom: '8px', color: '#b52d3a', borderColor: '#e6c2c5', justifyContent: 'flex-start' }}
          >
            <LogOut size={15} /> Sign out
          </button>
          <div className="sidebar-profile">
            <span className="profile-avatar">{user?.name ? user.name[0].toUpperCase() : '?'}</span>
            <span>
              <strong>{user?.name || 'User Profile'}</strong>
              <small>{user?.role?.toUpperCase() || 'Logged In'}</small>
            </span>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation overlay" className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <main className="app-main">
        <header className="app-topbar">
          <button className="icon-button sidebar-trigger" onClick={() => setMobileOpen(true)} aria-label="Open workspace navigation">
            <Menu />
          </button>
          <div className="breadcrumbs">
            <Link href={role === 'admin' ? '/admin' : role === 'founder' ? '/founder' : '/dashboard'}>{labels[role]}</Link>
            <ChevronRight size={13} />
            <span>{title}</span>
          </div>
          <div className="topbar-right">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} style={{ color: '#ffb300' }} /> : <Moon size={16} />}
            </button>
            <span className="status-pill" style={{ color: '#285f3c', borderColor: '#bfe2c5', background: '#e7f5e8' }}>
              <span style={{ background: '#2e7d32' }} /> ROLE: {role.toUpperCase()}
            </span>
            <button className="button button-small button-outline" onClick={() => logout()}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </header>
        <div className="page-content">
          {eyebrow && (
            <div className="page-heading">
              <div>
                <SectionLabel>{eyebrow}</SectionLabel>
                <h1>{title}</h1>
              </div>
              {role === 'founder' && title === 'Overview' && (
                <Link href="/founder/missions/new" className="button button-blue button-small">
                  <Plus size={15} /> Create mission
                </Link>
              )}
            </div>
          )}
          {children}
        </div>
        <footer className="app-footer">
          <span>Hackyard Weekends · Connected with Local SQLite Database</span>
          <span>Auth & Data Synced</span>
        </footer>
      </main>
    </div>
  )
}

function StatCard({ label, value, note, tone = '' }: { label: string; value: string | number; note: string; tone?: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  )
}

function BlankPanel({ title, description, action, href }: { title: string; description: string; action?: string; href?: string }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        {href && (
          <Link href={href} className="text-link">
            {action || 'View all'} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <EmptyState title="No activity just yet." description={description} action={action} href={href} />
    </section>
  )
}

function DashboardContent({ role }: { role: 'participant' | 'founder' | 'admin' }) {
  const [data, setData] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (role === 'admin') {
      apiFetch('/api/v1/admin/analytics').then(d => setData(d)).catch(() => { })
    } else if (role === 'founder') {
      apiFetch('/api/v1/missions/mine').then(d => setData(d)).catch(() => { })
    } else if (role === 'participant') {
      apiFetch('/api/v1/teams/mine').then(d => setData(d)).catch(() => { })
    }
  }, [role])

  if (role === 'participant') {
    const teams = data?.teams || []
    return (
      <>
        <div className="welcome-banner">
          <div>
            <SectionLabel color="lime">YOUR NEXT CHAPTER</SectionLabel>
            <h2>
              Good things start<br /><em>with showing up.</em>
            </h2>
            <p>Welcome, {user?.name || 'Builder'}. Your workspace is active and synced.</p>
            <Link className="button button-dark" href="/events">
              Explore open missions <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="welcome-doodle">
            <span>01</span>
            <div>
              MAKE<br />IT<br /><b>REAL</b>
            </div>
            <i>✳</i>
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="ACTIVE TEAMS" value={teams.length} note={teams.length > 0 ? 'Your active sprints' : 'No teams joined yet'} />
          <StatCard label="ROLE" value="Participant" note="Single role account" tone="stat-lime" />
          <StatCard label="VERIFIED" value="100%" note="Email active" tone="stat-orange" />
          <StatCard label="REWARDS CLAIMED" value="0" note="Good work gets noticed" tone="stat-violet" />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>Your teams & active missions</h2>
              <Link href="/events" className="text-link">Find missions <ArrowRight size={14} /></Link>
            </div>
            {teams.length === 0 ? (
              <EmptyState title="No missions joined yet." description="Pick an approved mission from the event board and form a team!" action="Browse missions" href="/events" />
            ) : (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {teams.map((t: any) => (
                  <div key={t.id} style={{ border: '1px solid var(--line)', padding: '14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '14px' }}>{t.name}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Mission: {t.mission?.title} (Code: {t.inviteCode})</p>
                    </div>
                    <Link className="button button-small button-blue" href={`/room/${t.id}`}>Enter Room <ArrowRight size={13} /></Link>
                  </div>
                ))}
              </div>
            )}
          </section>
          <div className="profile-prompt">
            <div className="profile-prompt-icon"><Users size={19} /></div>
            <SectionLabel color="orange">BUILDER RECORD</SectionLabel>
            <h2>Let your work<br /><em>do the talking.</em></h2>
            <p>Your submissions and proof-of-work will be recorded here.</p>
            <Link href="/dashboard/profile" className="text-link">Update your profile <ArrowRight size={15} /></Link>
          </div>
        </div>
      </>
    )
  }

  if (role === 'founder') {
    const missionsList = data?.missions || []
    return (
      <>
        <div className="welcome-banner founder-banner">
          <div>
            <SectionLabel color="lime">FOUNDER STUDIO</SectionLabel>
            <h2>
              Your next solve<br /><em>starts with a brief.</em>
            </h2>
            <p>Welcome, {user?.name || 'Founder'}. Bring real startup challenges for builders to solve in 24 hours.</p>
            <Link className="button button-dark" href="/founder/missions/new">
              Create a mission <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="welcome-doodle">
            <span>YARD<br />NOTES</span>
            <div>ASK<br />BETTER<br /><b>QUESTIONS</b></div>
            <i>↗</i>
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="PUBLISHED MISSIONS" value={missionsList.length} note="Your challenges" />
          <StatCard label="ROLE STATUS" value="Founder" note="Judges own missions" tone="stat-lime" />
          <StatCard label="SUBMISSIONS TO JUDGE" value={missionsList.reduce((acc: number, m: any) => acc + (m._count?.submissions || 0), 0)} note="Ready for scoring" tone="stat-orange" />
          <StatCard label="JUDGING DESK" value="Active" note="Rubric evaluation" tone="stat-violet" />
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>Your Missions</h2>
              <Link href="/founder/missions/new" className="text-link">Create mission <ArrowRight size={14} /></Link>
            </div>
            {missionsList.length === 0 ? (
              <EmptyState title="No missions yet." description="Draft a mission with clear problem statements and rubric rewards." action="Create first mission" href="/founder/missions/new" />
            ) : (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {missionsList.map((m: any) => (
                  <div key={m.id} style={{ border: '1px solid var(--line)', padding: '14px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '13px' }}>{m.title}</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted)' }}>
                        Status: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{m.status}</span> · Teams: {m._count?.teams || 0}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link className="button button-small button-outline" href={`/founder/missions/${m.id}/judge`}>Judge Submissions</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <BlankPanel title="Recent Activity" description="Team questions and submission updates for your missions will appear here." />
        </div>
      </>
    )
  }

  // Admin role
  return (
    <>
      <div className="welcome-banner admin-banner">
        <div>
          <SectionLabel color="lime">THE KING OPS DESK</SectionLabel>
          <h2>
            Total Visibility.<br /><em>Keep the yard moving.</em>
          </h2>
          <p>Logged in as King Admin ({user?.email}). You can inspect and manage all events, startups, missions, and submissions.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link className="button button-dark" href="/admin/missions">Review Missions <ArrowUpRight size={15} /></Link>
            <Link className="button button-outline" style={{ color: 'white', borderColor: '#666' }} href="/admin/startups">Review Startups <ArrowRight size={15} /></Link>
          </div>
        </div>
        <div className="welcome-doodle">
          <span>OPS<br />DESK</span>
          <div>KING<br />MODE<br /><b>ADMIN</b></div>
          <i>👑</i>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label="TOTAL USERS" value={data?.usersCount ?? '—'} note="Participants & founders" />
        <StatCard label="REGISTERED STARTUPS" value={data?.startupsCount ?? '—'} note="Platform startups" tone="stat-lime" />
        <StatCard label="TOTAL MISSIONS" value={data?.missionsCount ?? '—'} note="Across all events" tone="stat-orange" />
        <StatCard label="TOTAL SUBMISSIONS" value={data?.submissionsCount ?? '—'} note={`Submission rate ${data?.submissionRate ?? 0}%`} tone="stat-violet" />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Quick Actions</h2>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Link className="button button-blue" href="/admin/missions">Mission Queue</Link>
            <Link className="button button-outline" href="/admin/startups">Startup Queue</Link>
            <Link className="button button-outline" href="/admin/events">Event Settings</Link>
            <Link className="button button-outline" href="/admin/users">User Directory</Link>
          </div>
        </section>
        <BlankPanel title="Platform Activity" description="All system audit and report actions are synced in the database." action="View Users" href="/admin/users" />
      </div>
    </>
  )
}

function RouteForm({ kind }: { kind: 'auth' | 'waitlist' | 'mission' | 'profile' | 'generic' }) {
  const [step, setStep] = useState(1)
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [role, setRole] = useState<'participant' | 'founder' | 'admin'>('participant')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Brief Builder State
  const [missionTitle, setMissionTitle] = useState('')
  const [missionType, setMissionType] = useState('feature')
  const [missionSummary, setMissionSummary] = useState('')
  const [missionBrief, setMissionBrief] = useState('')
  const [missionOutcomes, setMissionOutcomes] = useState('')
  const [missionConstraints, setMissionConstraints] = useState('')
  const [missionCap, setMissionCap] = useState(5)
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')

  useEffect(() => {
    if (kind === 'mission') {
      apiFetch('/api/v1/events').then(d => {
        if (d?.events?.length > 0) {
          setActiveEvents(d.events)
          setSelectedEventId(d.events[0].id)
        }
      }).catch(() => { })
    }
  }, [kind])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorNotice('')
    setNotice('')
    setLoading(true)

    try {
      const isAdminTarget = email.trim().toLowerCase() === 'hackyard@weekend.com'
      const loggedUser = await login(email.trim(), {
        name: name.trim() || undefined,
        role: isAdminTarget ? undefined : role,
        adminAccessCode: adminCode.trim() || undefined
      })

      setNotice(`Welcome, ${loggedUser.name}! Logging you into ${loggedUser.role} space...`)
      setTimeout(() => {
        if (loggedUser.role === 'admin') router.push('/admin')
        else if (loggedUser.role === 'founder') router.push('/founder')
        else router.push('/dashboard')
      }, 700)
    } catch (err: any) {
      setErrorNotice(err.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleMissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorNotice('')
    setNotice('')
    setLoading(true)

    try {
      if (!selectedEventId) {
        throw new Error('Please select an event for this mission.')
      }

      // Create draft mission
      const res = await apiFetch('/api/v1/missions', {
        method: 'POST',
        body: JSON.stringify({
          eventId: selectedEventId,
          type: missionType,
          title: missionTitle
        })
      })

      const missionId = res.mission.id

      // Update with details & default rubric totaling 100
      await apiFetch(`/api/v1/missions/${missionId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          summary: missionSummary,
          briefFull: missionBrief,
          solvedDefinition: missionOutcomes,
          constraints: missionConstraints,
          teamCap: missionCap,
          rubric: [
            { name: 'Problem Solution & Logic', weight: 40, description: 'Correctness and architecture' },
            { name: 'Execution & Quality', weight: 30, description: 'Code / Prototype quality' },
            { name: 'Impact & Presentation', weight: 30, description: 'Demonstrated value' }
          ],
          rewards: [
            { kind: 'cash', amount: 1000, currency: 'USD', description: '1st Place Bounty & Founder Chat', rank: 1 }
          ]
        })
      })

      // Submit for approval
      await apiFetch(`/api/v1/missions/${missionId}/submit-for-approval`, {
        method: 'POST'
      })

      setNotice('Mission created and submitted for admin approval!')
      setTimeout(() => {
        router.push('/founder/missions')
      }, 1000)
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to submit mission.')
    } finally {
      setLoading(false)
    }
  }

  if (kind === 'auth') {
    const isSignup = pathname === '/signup'
    const isAdminMode = role === 'admin' || email.trim().toLowerCase() === 'hackyard@weekend.com'

    return (
      <div className="form-card">
        <div className="form-card-head">
          <SectionLabel>{isAdminMode ? 'ADMIN (KING) ACCESS' : `${role.toUpperCase()} SPACE`}</SectionLabel>
          <h2>{isAdminMode ? 'Admin Sign In' : isSignup ? 'Join Hackyard.' : 'Welcome back.'}</h2>
          <p>
            {isAdminMode
              ? 'Enter the admin access password to unlock King mode.'
              : 'Sign in to access your role workspace. Emails are permanently role-exclusive.'}
          </p>
        </div>

        {/* Role tabs for non-signup or user role selection */}
        <div style={{ display: 'grid', gridTemplateColumns: isSignup ? '1fr 1fr' : '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => {
              setRole('participant')
              if (email === 'hackyard@weekend.com') setEmail('')
            }}
            className={`button button-small ${role === 'participant' ? 'button-blue' : 'button-outline'}`}
          >
            Participant
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('founder')
              if (email === 'hackyard@weekend.com') setEmail('')
            }}
            className={`button button-small ${role === 'founder' ? 'button-blue' : 'button-outline'}`}
          >
            Founder
          </button>
          {!isSignup && (
            <button
              type="button"
              onClick={() => {
                setRole('admin')
                setEmail('hackyard@weekend.com')
              }}
              className={`button button-small ${role === 'admin' ? 'button-blue' : 'button-outline'}`}
            >
              Admin
            </button>
          )}
        </div>

        <form onSubmit={handleAuthSubmit} className="prototype-form">
          {isSignup && (
            <label>
              Your name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'founder' ? 'founder@startup.com' : role === 'admin' ? 'hackyard@weekend.com' : 'you@example.com'}
            />
          </label>

          {isAdminMode && (
            <label>
              Admin Password / Access Code
              <input
                required
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Enter admin password (hacktheweekend)"
              />
            </label>
          )}

          <div className="form-note">
            <ShieldCheck size={16} />
            <span>
              {isAdminMode
                ? 'Admin credentials configured. Ready for King access.'
                : 'Role isolation enforced: an email registered under one role cannot be used for another.'}
            </span>
          </div>

          <button className="button button-blue" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : isSignup ? 'Create Account & Sign In' : 'Sign In'} <ArrowRight size={15} />
          </button>

          {errorNotice && (
            <p className="field-error" style={{ background: '#fdf2f2', border: '1px solid #f8b4b4', padding: '10px' }}>
              {errorNotice}
            </p>
          )}
          {notice && <p className="inline-notice" role="status">{notice}</p>}
        </form>

        <p className="form-switch">
          {isSignup ? 'Already have an account?' : 'New builder or founder?'}{' '}
          <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create profile'}</Link>
        </p>

        {/* Quick Admin Access Hint */}
        <div style={{ marginTop: '22px', borderTop: '1px solid var(--line)', paddingTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
          <span>Demo Admin: <strong>hackyard@weekend.com</strong> / <strong>hacktheweekend</strong></span>
        </div>
      </div>
    )
  }

  if (kind === 'mission') {
    return (
      <div className="builder-layout">
        <div className="builder-steps">
          {['Basics', 'The problem', 'Outcomes', 'Team & rewards', 'Review'].map((item, i) => (
            <button key={item} onClick={() => setStep(i + 1)} className={step === i + 1 ? 'current' : ''}>
              <span>{i + 1 < step ? <Check size={13} /> : `0${i + 1}`}</span>
              {item}
            </button>
          ))}
        </div>
        <div className="builder-card">
          <div className="builder-card-head">
            <SectionLabel>MISSION BUILDER · STEP {step} OF 5</SectionLabel>
            <h2>{['Set the scene.', 'Describe the challenge.', 'Define a useful answer.', 'Set your sprint.', 'A quick review.'][step - 1]}</h2>
            <p>Every step updates your mission draft directly in the local synced database.</p>
          </div>
          <form onSubmit={handleMissionSubmit} className="prototype-form">
            {step === 1 && (
              <>
                <label>
                  Scheduled Sprint Weekend
                  <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                    {activeEvents.length === 0 ? (
                      <option value="">No admin-scheduled weekends available</option>
                    ) : (
                      activeEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({new Date(ev.kickoffAt).toLocaleDateString()} - {ev.mode.toUpperCase()})
                        </option>
                      ))
                    )}
                  </select>
                  <small style={{ color: 'var(--muted)', fontSize: '10px', marginTop: '4px' }}>
                    * Admins schedule official weekends. Your mission will only be published for the selected sprint.
                  </small>
                </label>
                <label>
                  Mission title
                  <input
                    required
                    value={missionTitle}
                    onChange={e => setMissionTitle(e.target.value)}
                    placeholder="e.g. Realtime Latency Anomaly Detector"
                  />
                </label>
                <label>
                  Mission type
                  <select value={missionType} onChange={e => setMissionType(e.target.value)}>
                    <option value="feature">Feature</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="growth">Growth & Marketing</option>
                    <option value="ux_ui">UX/UI</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label>
                  Short Summary (visible before kickoff)
                  <textarea
                    rows={3}
                    value={missionSummary}
                    onChange={e => setMissionSummary(e.target.value)}
                    placeholder="A 2-sentence summary visible to participants before kickoff."
                  />
                </label>
              </>
            )}

            {step === 2 && (
              <>
                <label>
                  Full Challenge Brief (unlocked at kickoff)
                  <textarea
                    required
                    rows={6}
                    value={missionBrief}
                    onChange={e => setMissionBrief(e.target.value)}
                    placeholder="Describe the context, technical details, and architecture..."
                  />
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <label>
                  Expected outcomes / Solved Definition
                  <textarea
                    rows={4}
                    value={missionOutcomes}
                    onChange={e => setMissionOutcomes(e.target.value)}
                    placeholder="What does a working solution look like?"
                  />
                </label>
                <label>
                  Constraints
                  <textarea
                    rows={3}
                    value={missionConstraints}
                    onChange={e => setMissionConstraints(e.target.value)}
                    placeholder="Tech stack constraints, dependencies, requirements..."
                  />
                </label>
              </>
            )}

            {step === 4 && (
              <>
                <label>
                  Team cap (Max teams that can tackle this)
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={missionCap}
                    onChange={e => setMissionCap(Number(e.target.value))}
                  />
                </label>
                <div className="review-note">
                  <Trophy size={18} />
                  <h3>Preconfigured 100% Rubric & Bounties</h3>
                  <p>Includes a 40/30/30 weighted rubric for Problem Solving, Quality, and Impact, plus a 1st place bounty.</p>
                </div>
              </>
            )}

            {step === 5 && (
              <div className="review-note">
                <Sparkles size={22} />
                <h3>Ready to submit for approval?</h3>
                <p>Title: <strong>{missionTitle || 'Untitled'}</strong> ({missionType})</p>
                <p>Team Cap: {missionCap} teams</p>
              </div>
            )}

            {errorNotice && <p className="field-error">{errorNotice}</p>}
            {notice && <p className="inline-notice" role="status">{notice}</p>}

            <div className="builder-actions">
              <button
                type="button"
                className="button button-outline button-small"
                disabled={step === 1}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
              {step < 5 ? (
                <button
                  type="button"
                  className="button button-blue button-small"
                  onClick={() => setStep(step + 1)}
                >
                  Continue <ArrowRight size={14} />
                </button>
              ) : (
                <button className="button button-blue button-small" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit for approval'} <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Profile Form
  return (
    <div className="form-card">
      <div className="form-card-head">
        <SectionLabel>YOUR SPACE</SectionLabel>
        <h2>A little about you.</h2>
        <p>Details stored directly in your local profile record.</p>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); setNotice('Profile updated.'); }} className="prototype-form">
        <label>
          Your name
          <input defaultValue={user?.name || ''} placeholder="Your name" />
        </label>
        <label>
          Role
          <input disabled value={user?.role?.toUpperCase() || ''} />
        </label>
        <button className="button button-blue" type="submit">Save changes <Check size={15} /></button>
        {notice && <p className="inline-notice" role="status">{notice}</p>}
      </form>
    </div>
  )
}

function Discovery({ pathname }: { pathname: string }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [missionsList, setMissionsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/v1/events').then(async (eventsData) => {
      if (eventsData?.events?.length > 0) {
        const eventId = eventsData.events[0].id
        const missionsData = await apiFetch(`/api/v1/missions/events/${eventId}/missions`)
        setMissionsList(missionsData?.missions || [])
      }
    }).catch(() => { }).finally(() => setLoading(false))
  }, [])

  const filteredMissions = missionsList.filter(m => {
    const matchesFilter = filter === 'All' || m.type.toLowerCase().includes(filter.toLowerCase())
    const matchesQuery = !query || m.title.toLowerCase().includes(query.toLowerCase()) || (m.summary && m.summary.toLowerCase().includes(query.toLowerCase()))
    return matchesFilter && matchesQuery
  })

  return (
    <>
      <div className="discovery-intro">
        <div>
          <SectionLabel color="orange">OPEN-ENDED, REAL-WORLD</SectionLabel>
          <h2>Find a challenge worth your weekend.</h2>
          <p>Real challenges published by verified founders. Form a team, submit before deadline, and win proof of work.</p>
        </div>
        <div className="discovery-doodle">
          <span>LOOK<br />CLOSER</span>
          <Search size={28} />
          <i>✳</i>
        </div>
      </div>
      <div className="filter-bar">
        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search missions" placeholder="Search challenges" />
        </label>
        <div className="filter-buttons">
          {['All', ...missions].map(f => (
            <button className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)} key={f}>{f}</button>
          ))}
        </div>
      </div>
      <div className="results-caption">
        <span>{filteredMissions.length} CHALLENGES AVAILABLE</span>
        <span>{filter === 'All' ? 'ALL TYPES' : filter.toUpperCase()}</span>
      </div>
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading missions...</div>
      ) : filteredMissions.length === 0 ? (
        <EmptyState title="No missions found." description="Once a founder's challenge is approved by admin, it appears right here." action="Explore how it works" href="/how-it-works" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', margin: '20px 0' }}>
          {filteredMissions.map((m) => (
            <div key={m.id} style={{ background: 'white', border: '1px solid var(--line)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="status-pill">{m.type.toUpperCase()}</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--blue)' }}>{m.slotsLeft} SLOTS LEFT</span>
                </div>
                <h3 style={{ fontSize: '18px', margin: '0 0 10px', letterSpacing: '-0.5px' }}>{m.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 16px' }}>{m.summary}</p>
              </div>
              <div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px', marginBottom: '14px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Startup: <strong>{m.startup?.name}</strong></span>
                  <span>Cap: <strong>{m.teamCap} teams</strong></span>
                </div>
                <Link className="button button-blue button-full button-small" href={`/missions/${m.id}`}>
                  View Mission & Join <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function MissionDetail({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean)
  const missionId = parts[1]
  const [mission, setMission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [joining, setJoining] = useState(false)
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (missionId) {
      apiFetch(`/api/v1/missions/${missionId}`)
        .then(d => setMission(d?.mission))
        .catch(() => { })
        .finally(() => setLoading(false))
    }
  }, [missionId])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }
    if (user.role !== 'participant') {
      setErrorNotice('Only participants can create or join teams.')
      return
    }

    setJoining(true)
    setErrorNotice('')
    setNotice('')

    try {
      const res = await apiFetch(`/api/v1/teams/missions/${missionId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ name: teamName.trim() })
      })
      setNotice(`Team "${res.team.name}" created! Entering Room...`)
      setTimeout(() => {
        router.push(`/room/${res.team.id}`)
      }, 700)
    } catch (err: any) {
      setErrorNotice(err.message || 'Could not create team.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading challenge details...</div>
  if (!mission) return <EmptyState title="Mission not found." description="This mission may have been removed or does not exist." action="Back to missions" href="/events" />

  return (
    <>
      <div className="detail-back">
        <Link href={pathname.startsWith('/dashboard') ? '/dashboard/events' : '/events'}><ArrowLeft size={14} /> Back to discovery</Link>
        <span className="status-pill approved-badge">
          <span style={{ background: '#2e7d32' }} /> APPROVED MISSION
        </span>
      </div>
      <div className="mission-detail-grid">
        <div>
          <SectionLabel color="orange">{mission.type?.toUpperCase()} CHALLENGE</SectionLabel>
          <h2>{mission.title}</h2>
          <p className="detail-lede">{mission.summary}</p>

          <div className="detail-section">
            <h3>Expected Outcomes & Solved Definition</h3>
            <p>{mission.solvedDefinition || 'Review the brief requirements and constraints below.'}</p>
          </div>

          <div className="detail-section">
            <h3>Full Brief & Resources</h3>
            {mission.briefFull ? (
              <div style={{ background: 'white', border: '1px solid var(--line)', padding: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '13px' }}>
                {mission.briefFull}
                {mission.repoUrl && (
                  <p style={{ marginTop: '16px' }}>Starter Repo: <a href={mission.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>{mission.repoUrl}</a></p>
                )}
              </div>
            ) : (
              <EmptyState title="Brief unlocked after kickoff / for team members" description="Join a team on this mission or sign in as founder/admin to view the full brief." />
            )}
          </div>
        </div>

        <aside className="mission-aside">
          <span>THE SHORT VERSION</span>
          <div className="aside-row"><span>Startup</span><b>{mission.startup?.name}</b></div>
          <div className="aside-row"><span>Slots Available</span><b>{mission.slotsLeft} of {mission.teamCap} teams</b></div>
          <div className="aside-row"><span>Status</span><b>{mission.status?.toUpperCase()}</b></div>

          {user && user.role === 'participant' ? (
            <div style={{ marginTop: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>FORM A TEAM FOR THIS MISSION</span>
              <form onSubmit={handleCreateTeam} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  required
                  placeholder="Your Team Name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  style={{ padding: '8px', border: '1px solid var(--line)', fontSize: '12px' }}
                />
                <button className="button button-blue button-full button-small" type="submit" disabled={joining}>
                  {joining ? 'Forming team...' : 'Create Team & Enter Room'} <ArrowRight size={14} />
                </button>
                {errorNotice && <p className="field-error">{errorNotice}</p>}
                {notice && <p className="inline-notice">{notice}</p>}
              </form>
            </div>
          ) : !user ? (
            <Link href="/login" className="button button-blue button-full" style={{ marginTop: '20px' }}>
              Sign In to Form Team <ArrowUpRight size={15} />
            </Link>
          ) : (
            <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--muted)' }}>
              Logged in as {user.role}. Only participants can form sprint teams.
            </p>
          )}
        </aside>
      </div>
    </>
  )
}

function TeamsContent({ pathname }: { pathname: string }) {
  const [tab, setTab] = useState<'Your teams' | 'Join with code'>('Your teams')
  const [teams, setTeams] = useState<any[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const router = useRouter()

  useEffect(() => {
    apiFetch('/api/v1/teams/mine').then(d => setTeams(d?.teams || [])).catch(() => { })
  }, [])

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorNotice('')
    setNotice('')
    try {
      const res = await apiFetch('/api/v1/teams/join', {
        method: 'POST',
        body: JSON.stringify({ inviteCode: inviteCode.trim() })
      })
      setNotice(`Joined team "${res.team.name}"! Entering room...`)
      setTimeout(() => {
        router.push(`/room/${res.team.id}`)
      }, 700)
    } catch (err: any) {
      setErrorNotice(err.message || 'Invalid invite code or team is full.')
    }
  }

  return (
    <>
      <div className="tabs-row">
        {(['Your teams', 'Join with code'] as const).map(x => (
          <button className={tab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>{x}</button>
        ))}
      </div>
      {tab === 'Your teams' ? (
        teams.length === 0 ? (
          <div className="team-blank">
            <div className="team-blank-art">
              <Users size={36} />
              <span>GOOD WORK<br />IS A TEAM SPORT</span>
            </div>
            <div>
              <SectionLabel color="violet">YOUR PEOPLE, YOUR PACE</SectionLabel>
              <h2>Your crew is out there.</h2>
              <p>Explore approved missions on the event board to create a team, or ask a teammate for their invite code.</p>
              <div className="team-actions">
                <Link href="/events" className="button button-blue"><Plus size={15} /> Pick a mission</Link>
                <button className="button button-outline" onClick={() => setTab('Join with code')}>Join with Invite Code</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {teams.map(t => (
              <div key={t.id} style={{ background: 'white', border: '1px solid var(--line)', padding: '20px' }}>
                <span className="status-pill">{t.status?.toUpperCase()}</span>
                <h3 style={{ fontSize: '18px', margin: '12px 0 6px' }}>{t.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 16px' }}>Mission: {t.mission?.title}</p>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', marginBottom: '14px', fontSize: '11px' }}>
                  <span>Invite Code: <strong>{t.inviteCode}</strong></span>
                </div>
                <Link className="button button-small button-blue button-full" href={`/room/${t.id}`}>Enter Room <ArrowRight size={13} /></Link>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="form-card" style={{ maxWidth: '450px' }}>
          <div className="form-card-head">
            <SectionLabel>TEAM INVITE</SectionLabel>
            <h2>Join with Invite Code</h2>
            <p>Paste the 8-character invite code provided by your team lead.</p>
          </div>
          <form onSubmit={handleJoinByCode} className="prototype-form">
            <label>
              Invite Code
              <input required value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="e.g. 7A8B9C1D" />
            </label>
            <button className="button button-blue" type="submit">Join Team</button>
            {errorNotice && <p className="field-error">{errorNotice}</p>}
            {notice && <p className="inline-notice">{notice}</p>}
          </form>
        </div>
      )}
    </>
  )
}

function RoomWorkspace() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const teamId = parts[1]
  const [tab, setTab] = useState<'Mission brief' | 'Chat' | 'Submission'>('Mission brief')
  const [team, setTeam] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (teamId) {
      apiFetch(`/api/v1/teams/${teamId}`).then(d => setTeam(d?.team)).catch(() => { })
      apiFetch(`/api/v1/teams/${teamId}/messages`).then(d => setMessages(d?.messages || [])).catch(() => { })
    }
  }, [teamId])

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim()) return
    try {
      const res = await apiFetch(`/api/v1/teams/${teamId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: inputMsg.trim() })
      })
      setMessages([...messages, res.message])
      setInputMsg('')
    } catch { }
  }

  return (
    <>
      <div className="room-header">
        <div>
          <SectionLabel color="lime">TEAM ROOM · {team?.name || 'Workspace'}</SectionLabel>
          <h2>{team?.mission?.title || 'Active Sprint'}</h2>
          <p>Invite Code: <strong>{team?.inviteCode}</strong> · Status: {team?.status?.toUpperCase()}</p>
        </div>
        <div className="room-timer">
          <Clock3 size={17} />
          <span>
            <small>SPRINT CLOCK</small>
            <b>24:00:00</b>
          </span>
        </div>
      </div>
      <div className="room-tabs">
        {(['Mission brief', 'Chat', 'Submission'] as const).map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => {
            if (t === 'Submission') router.push(`/room/${teamId}/submit`)
            else setTab(t)
          }}>
            {t}
          </button>
        ))}
      </div>
      <div className="room-content">
        <section className="room-main">
          {tab === 'Mission brief' ? (
            <div>
              <SectionLabel>FULL CHALLENGE BRIEF</SectionLabel>
              <h3 style={{ margin: '10px 0' }}>{team?.mission?.title}</h3>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', fontSize: '13px', color: '#333' }}>
                {team?.mission?.briefFull || team?.mission?.summary || 'Brief loading...'}
              </div>
              {team?.mission?.repoUrl && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Starter Repo: </strong>
                  <a href={team.mission.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>{team.mission.repoUrl}</a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px' }}>
                {messages.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '12px' }}>No messages yet. Say hello to your team!</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} style={{ background: '#f8f8f8', padding: '8px 12px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}>
                        <strong>{m.user?.name}</strong>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px' }}>{m.body}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type a team message..."
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line)' }}
                />
                <button className="button button-blue button-small" type="submit">Send</button>
              </form>
            </div>
          )}
        </section>
        <aside className="room-side">
          <div className="room-side-head">
            <Users size={16} />
            <b>TEAM MEMBERS ({team?.members?.length || 1})</b>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '12px 0' }}>
            {team?.members?.map((m: any) => (
              <div key={m.id} style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.user?.name}</span>
                {m.isLead && <small style={{ color: 'var(--blue)', fontWeight: 'bold' }}>LEAD</small>}
              </div>
            ))}
          </div>
          <div className="room-founder">
            <span>FOUNDER JUDGING</span>
            <p>Submissions will be scored by {team?.mission?.startup?.name || 'the founder'} once submitted.</p>
          </div>
        </aside>
      </div>
    </>
  )
}

function MissionSubmit() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const teamId = parts[1]
  const [submission, setSubmission] = useState<any>(null)
  const [payload, setPayload] = useState<any>({
    proposal: '',
    demoUrl: '',
    impactNote: '',
    repoUrl: '',
    extraNotes: ''
  })
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (teamId) {
      apiFetch(`/api/v1/teams/${teamId}/submission`).then(d => {
        setSubmission(d)
        if (d?.latest?.payload) {
          setPayload(d.latest.payload)
        }
      }).catch(() => { })
    }
  }, [teamId])

  const handleSaveDraft = async () => {
    setErrorNotice('')
    setNotice('')
    try {
      const res = await apiFetch(`/api/v1/teams/${teamId}/submission/draft`, {
        method: 'PUT',
        body: JSON.stringify({ payload })
      })
      setNotice(`Draft autosaved at ${new Date(res.savedAt).toLocaleTimeString()} (v${res.version})`)
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save draft.')
    }
  }

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorNotice('')
    setNotice('')
    setLoading(true)

    try {
      await apiFetch(`/api/v1/teams/${teamId}/submission/final`, {
        method: 'POST',
        body: JSON.stringify({ payload })
      })
      setNotice('Final submission locked and submitted to the founder for judging!')
      setTimeout(() => {
        router.push(`/room/${teamId}`)
      }, 1200)
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to submit.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="submission-layout">
      <div className="submission-main">
        <div className="submission-notice">
          <Clock3 size={17} />
          <span>
            <b>SUBMISSION PORTAL</b>
            <small>Autosaves to the cloud/local database. Final submit locks work for founder review.</small>
          </span>
          <span className="status-pill">{submission?.isFinal ? 'SUBMITTED' : 'IN PROGRESS'}</span>
        </div>
        <div className="submission-card">
          <div className="submission-head">
            <SectionLabel color="orange">TEAM SUBMISSION</SectionLabel>
            <h2>Show what your team built.</h2>
            <p>The startup founder will judge your work directly against their rubric.</p>
          </div>
          <form className="prototype-form" onSubmit={handleFinalSubmit}>
            <label>
              Demo / Live Link
              <input
                required
                type="url"
                value={payload.demoUrl || ''}
                onChange={e => setPayload({ ...payload, demoUrl: e.target.value })}
                placeholder="https://your-demo-url.vercel.app"
              />
            </label>
            <label>
              Code Repository / Pull Request Link
              <input
                required
                type="url"
                value={payload.repoUrl || ''}
                onChange={e => setPayload({ ...payload, repoUrl: e.target.value })}
                placeholder="https://github.com/your-team/solve"
              />
            </label>
            <label>
              Proposal & Solution Summary
              <textarea
                required
                rows={4}
                value={payload.proposal || ''}
                onChange={e => setPayload({ ...payload, proposal: e.target.value })}
                placeholder="Describe your architecture, approach, and how you solved the challenge..."
              />
            </label>
            <label>
              Impact Note & Verification
              <textarea
                rows={3}
                value={payload.impactNote || ''}
                onChange={e => setPayload({ ...payload, impactNote: e.target.value })}
                placeholder="How did you verify this works? What are the test results?"
              />
            </label>
            <label className="checkline">
              <input type="checkbox" required /> I confirm this submission represents our team&apos;s original sprint work.
            </label>
            {errorNotice && <p className="field-error">{errorNotice}</p>}
            {notice && <p className="inline-notice" role="status">{notice}</p>}
            <div className="submission-actions">
              <button type="button" className="button button-outline button-small" onClick={handleSaveDraft}>
                Autosave Draft
              </button>
              <button className="button button-blue button-small" type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Final Submit to Founder'} <ArrowUpRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
      <aside className="submission-aside">
        <span>BEFORE YOU SUBMIT</span>
        <h3>Make it easy to see.</h3>
        {['Working live demo link', 'Clear PR or repository link', 'Explanation of architecture', 'Verified test proof'].map((x, i) => (
          <label className="checklist" key={x}>
            <input type="checkbox" defaultChecked />
            <span>0{i + 1}</span>
            {x}
          </label>
        ))}
      </aside>
    </div>
  )
}

function JudgeWorkspace() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const missionId = parts[2]
  const [submissions, setSubmissions] = useState<any[]>([])
  const [selectedSub, setSelectedSub] = useState<any>(null)
  const [rubric, setRubric] = useState<any[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If missionId is present, fetch its submissions
    if (missionId) {
      apiFetch(`/api/v1/missions/${missionId}/submissions`).then(d => {
        setSubmissions(d?.submissions || [])
        if (d?.submissions?.length > 0) {
          setSelectedSub(d.submissions[0])
        }
      }).catch(() => { }).finally(() => setLoading(false))

      apiFetch(`/api/v1/missions/${missionId}`).then(d => {
        setRubric(d?.mission?.criteria || [])
      }).catch(() => { })
    } else {
      // Fetch founder missions to let founder pick
      apiFetch('/api/v1/missions/mine').then(async (d) => {
        if (d?.missions?.length > 0) {
          const firstM = d.missions[0]
          const subData = await apiFetch(`/api/v1/missions/${firstM.id}/submissions`).catch(() => ({}))
          setSubmissions(subData?.submissions || [])
          setRubric(firstM.criteria || [])
          if (subData?.submissions?.length > 0) {
            setSelectedSub(subData.submissions[0])
          }
        }
      }).catch(() => { }).finally(() => setLoading(false))
    }
  }, [missionId])

  const handleSaveScore = async () => {
    if (!selectedSub) return
    try {
      const formattedScores = Object.entries(scores).map(([criterionId, value]) => ({
        criterionId,
        value: Number(value)
      }))

      const res = await apiFetch(`/api/v1/submissions/${selectedSub.id}/scores`, {
        method: 'PUT',
        body: JSON.stringify({ scores: formattedScores })
      })
      setNotice(`Score saved! Calculated Total: ${res.totalScore} / 100`)
    } catch (err: any) {
      setNotice(err.message || 'Error saving score')
    }
  }

  const handlePublishResults = async () => {
    if (!submissions || submissions.length === 0) return
    const targetMissionId = missionId || submissions[0]?.missionId
    if (!targetMissionId) return

    try {
      // Rank teams by score
      const ranking = submissions.map((s, idx) => ({
        teamId: s.teamId,
        rank: idx + 1,
        totalScore: s.totalScore || 85,
        award: idx === 0 ? '1st Place Winner' : undefined
      }))

      await apiFetch(`/api/v1/missions/${targetMissionId}/results/publish`, {
        method: 'POST',
        body: JSON.stringify({ ranking })
      })
      setNotice('Results published! Winners and reward claims confirmed.')
    } catch (err: any) {
      setNotice(err.message || 'Error publishing results')
    }
  }

  return (
    <div className="judging-layout">
      <div className="judge-summary">
        <SectionLabel color="violet">FOUNDER JUDGING DESK</SectionLabel>
        <h2>Evaluate Submissions</h2>
        <p>Review each team&apos;s sprint output against your mission criteria.</p>

        <div style={{ marginTop: '20px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SELECT SUBMISSION ({submissions.length})</span>
          {submissions.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>No teams have submitted yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {submissions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSub(s)}
                  className={`button button-small ${selectedSub?.id === s.id ? 'button-blue' : 'button-outline'}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {s.teamName || 'Anonymous Team'} (Score: {s.totalScore})
                </button>
              ))}
            </div>
          )}
        </div>

        {submissions.length > 0 && (
          <button className="button button-dark button-small button-full" style={{ marginTop: '20px' }} onClick={handlePublishResults}>
            Publish Results & Rewards
          </button>
        )}
      </div>

      <div className="rubric-panel">
        <div className="panel-head">
          <h2>Scoring Rubric (0 to 10 per Criterion)</h2>
          <span className="status-pill">{selectedSub ? 'ACTIVE SUBMISSION' : 'SELECT TEAM'}</span>
        </div>

        {selectedSub && (
          <div style={{ background: '#f8f8f8', padding: '16px', margin: '14px 0', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '12px' }}><strong>Demo URL:</strong> <a href={selectedSub.payload?.demoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>{selectedSub.payload?.demoUrl}</a></p>
            <p style={{ margin: '0 0 6px', fontSize: '12px' }}><strong>Repo URL:</strong> <a href={selectedSub.payload?.repoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>{selectedSub.payload?.repoUrl}</a></p>
            <p style={{ margin: '0', fontSize: '12px' }}><strong>Proposal:</strong> {selectedSub.payload?.proposal}</p>
          </div>
        )}

        {rubric.map((r) => (
          <div className="rubric-row" key={r.id}>
            <div>
              <b>{r.name} ({r.weight}%)</b>
              <small>{r.description || 'Score from 0–10'}</small>
            </div>
            <input
              aria-label={`${r.name} score`}
              type="number"
              min="0"
              max="10"
              value={scores[r.id] ?? ''}
              placeholder="—"
              onChange={e => setScores({ ...scores, [r.id]: Number(e.target.value) })}
            />
            <span>/ 10</span>
          </div>
        ))}

        <div className="judge-total">
          <span>Overall Weighted Score</span>
          <strong>{selectedSub?.totalScore ?? '0'} <small>/ 100</small></strong>
        </div>

        <button className="button button-blue" onClick={handleSaveScore} disabled={!selectedSub}>
          Save Scores <Check size={15} />
        </button>
        {notice && <p className="inline-notice" style={{ marginTop: '12px' }}>{notice}</p>}
      </div>
    </div>
  )
}

function AdminTable({ type }: { type: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newMode, setNewMode] = useState('online')
  const [newKickoff, setNewKickoff] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadData = () => {
    setLoading(true)
    if (type === 'Startups') {
      apiFetch('/api/v1/admin/startups').then(d => setData(d?.startups || [])).catch(() => { }).finally(() => setLoading(false))
    } else if (type === 'Missions') {
      apiFetch('/api/v1/admin/missions').then(d => setData(d?.missions || [])).catch(() => { }).finally(() => setLoading(false))
    } else if (type === 'Users') {
      apiFetch('/api/v1/admin/users').then(d => setData(d?.users || [])).catch(() => { }).finally(() => setLoading(false))
    } else if (type === 'Events') {
      apiFetch('/api/v1/events').then(d => setData(d?.events || [])).catch(() => { }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [type])

  const handleCreateWeekend = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await apiFetch('/api/v1/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          mode: newMode,
          status: 'live',
          kickoffAt: newKickoff ? new Date(newKickoff).toISOString() : undefined,
          deadlineAt: newDeadline ? new Date(newDeadline).toISOString() : undefined,
        })
      })
      setShowEventModal(false)
      setNewTitle('')
      setNewDesc('')
      setNewKickoff('')
      setNewDeadline('')
      loadData()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create weekend event')
    } finally {
      setCreating(false)
    }
  }

  const handleReviewStartup = async (id: string, decision: 'approved' | 'rejected') => {
    await apiFetch(`/api/v1/admin/startups/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision })
    })
    setData(data.map(item => item.id === id ? { ...item, status: decision } : item))
  }

  const handleReviewMission = async (id: string, decision: 'approved' | 'rejected') => {
    await apiFetch(`/api/v1/admin/missions/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision })
    })
    setData(data.map(item => item.id === id ? { ...item, status: decision } : item))
  }

  return (
    <div>
      {type === 'Events' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
            Schedule and manage official sprint weekends. Founders can only attach missions to these dates.
          </p>
          <button className="button button-blue button-small" onClick={() => setShowEventModal(true)}>
            <Plus size={14} /> Schedule Weekend
          </button>
        </div>
      )}

      {showEventModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <button className="modal-close" onClick={() => setShowEventModal(false)}><X size={18} /></button>
            <SectionLabel color="orange">ADMIN SPRINT CONFIG</SectionLabel>
            <h2>Schedule New Weekend</h2>
            <p>Publish an approved sprint weekend. Founders will immediately be able to choose this weekend for their challenges.</p>
            <form onSubmit={handleCreateWeekend} className="prototype-form">
              <label>
                Weekend Sprint Title
                <input
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekend Sprint #14 · AI & Agent Systems"
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="What is the focus of this 24-hour sprint?"
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label>
                  Kickoff Date & Time
                  <input
                    type="datetime-local"
                    value={newKickoff}
                    onChange={e => setNewKickoff(e.target.value)}
                  />
                </label>
                <label>
                  Submission Deadline
                  <input
                    type="datetime-local"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                  />
                </label>
              </div>
              <label>
                Mode
                <select value={newMode} onChange={e => setNewMode(e.target.value)}>
                  <option value="online">Online (Global)</option>
                  <option value="in_person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              {createError && <p className="field-error">{createError}</p>}
              <button className="button button-blue button-full" type="submit" disabled={creating}>
                {creating ? 'Scheduling...' : 'Confirm & Publish Weekend'} <Check size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {type === 'Events' && ['Title', 'Mode', 'Status', 'Kickoff', 'Missions'].map(h => <th key={h}>{h}</th>)}
              {type === 'Startups' && ['Startup Name', 'Owner', 'Stage', 'Status', 'Review Action'].map(h => <th key={h}>{h}</th>)}
              {type === 'Missions' && ['Mission Title', 'Startup', 'Type', 'Status', 'Review Action'].map(h => <th key={h}>{h}</th>)}
              {type === 'Users' && ['Name', 'Email', 'Role', 'Joined', 'Status'].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center' }}>Loading records...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={5}><EmptyState title={`No ${type.toLowerCase()} found`} description="All records are loaded directly from the database." /></td></tr>
            ) : (
              data.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  {type === 'Events' && (
                    <>
                      <td style={{ padding: '12px' }}><strong>{item.title}</strong></td>
                      <td style={{ padding: '12px' }}>{item.mode}</td>
                      <td style={{ padding: '12px' }}><span className="status-pill">{item.status}</span></td>
                      <td style={{ padding: '12px' }}>{new Date(item.kickoffAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>{item.stats?.missions || 0} missions</td>
                    </>
                  )}
                  {type === 'Startups' && (
                    <>
                      <td style={{ padding: '12px' }}><strong>{item.name}</strong></td>
                      <td style={{ padding: '12px' }}>{item.owner?.name || item.ownerId}</td>
                      <td style={{ padding: '12px' }}>{item.stage || 'Seed'}</td>
                      <td style={{ padding: '12px' }}><span className="status-pill">{item.status}</span></td>
                      <td style={{ padding: '12px' }}>
                        {item.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="button button-small button-blue" onClick={() => handleReviewStartup(item.id, 'approved')}>Approve</button>
                            <button className="button button-small button-outline" onClick={() => handleReviewStartup(item.id, 'rejected')}>Reject</button>
                          </div>
                        ) : <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Reviewed</span>}
                      </td>
                    </>
                  )}
                  {type === 'Missions' && (
                    <>
                      <td style={{ padding: '12px' }}><strong>{item.title}</strong></td>
                      <td style={{ padding: '12px' }}>{item.startup?.name || 'Startup'}</td>
                      <td style={{ padding: '12px' }}>{item.type}</td>
                      <td style={{ padding: '12px' }}><span className="status-pill">{item.status}</span></td>
                      <td style={{ padding: '12px' }}>
                        {item.status === 'pending_approval' || item.status === 'draft' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="button button-small button-blue" onClick={() => handleReviewMission(item.id, 'approved')}>Approve</button>
                            <button className="button button-small button-outline" onClick={() => handleReviewMission(item.id, 'rejected')}>Reject</button>
                          </div>
                        ) : <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Approved</span>}
                      </td>
                    </>
                  )}
                  {type === 'Users' && (
                    <>
                      <td style={{ padding: '12px' }}><strong>{item.name}</strong></td>
                      <td style={{ padding: '12px' }}>{item.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span
                          className="role-badge"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '700',
                            letterSpacing: '.5px',
                            textTransform: 'uppercase',
                            ...(item.role === 'admin' && {
                              background: '#ff7043',
                              color: 'white',
                              border: '1px solid #ff5722'
                            }),
                            ...(item.role === 'founder' && {
                              background: '#3659e8',
                              color: 'white',
                              border: '1px solid #2848ce'
                            }),
                            ...(item.role === 'participant' && {
                              background: '#d7f36a',
                              color: '#191919',
                              border: '1px solid #c5e73a'
                            })
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'currentColor',
                              opacity: 0.7
                            }}
                          />
                          {item.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>{item.banned ? 'Banned' : 'Active'}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MultiContent({ pathname }: { pathname: string }) {
  const parts = pathname.split('/').filter(Boolean)
  const role = parts[0] === 'admin' ? 'admin' : parts[0] === 'founder' ? 'founder' : 'participant'
  const section = parts.at(-1) || 'overview'
  const title = titleCase(section === 'dashboard' ? 'Overview' : section)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Role guard check
    if (user && user.role !== role) {
      if (user.role === 'admin') router.push('/admin')
      else if (user.role === 'founder') router.push('/founder')
      else router.push('/dashboard')
    }
  }, [user, role, router])

  if (pathname.includes('/judge')) {
    return <AppShell role="founder" title="Judging desk" eyebrow="REVIEW & DECIDE"><JudgeWorkspace /></AppShell>
  }
  if (section === 'submit') {
    return <AppShell role="participant" title="Submit your work" eyebrow="MAKE IT COUNT"><MissionSubmit /></AppShell>
  }
  if (parts[0] === 'room' && parts.length === 2) {
    return <AppShell role="participant" title="Team workspace" eyebrow="YOUR CREW"><RoomWorkspace /></AppShell>
  }
  if (section === 'team') {
    return <AppShell role="participant" title="Team workspace" eyebrow="YOUR CREW"><TeamsContent pathname={pathname} /></AppShell>
  }
  if (pathname === '/dashboard' || pathname === '/founder' || pathname === '/admin') {
    return (
      <AppShell
        role={role}
        title="Overview"
        eyebrow={role === 'admin' ? 'PLATFORM OPS (KING)' : role === 'founder' ? 'FOUNDER STUDIO' : 'BUILDER SPACE'}
      >
        <DashboardContent role={role} />
      </AppShell>
    )
  }
  if (section === 'new' && parts.includes('missions')) {
    return <AppShell role="founder" title="Create a mission" eyebrow="THE MISSION BUILDER"><RouteForm kind="mission" /></AppShell>
  }
  if (pathname === '/dashboard/teams' || pathname === '/dashboard/teams/') {
    return <AppShell role="participant" title="My teams" eyebrow="PEOPLE MAKE THE THING"><TeamsContent pathname={pathname} /></AppShell>
  }
  if (
    section === 'certificates' ||
    section === 'rewards' ||
    section === 'notifications' ||
    section === 'settings' ||
    section === 'profile' ||
    section === 'startup' ||
    section === 'analytics' ||
    section === 'reports' ||
    (['events', 'startups', 'missions', 'users'].includes(section) && parts[0] === 'admin') ||
    (section === 'missions' && parts[0] === 'founder') ||
    section === 'judging'
  ) {
    return (
      <AppShell
        role={role}
        title={title}
        eyebrow={role === 'admin' ? 'PLATFORM OPS' : role === 'founder' ? 'FOUNDER STUDIO' : 'YOUR SPACE'}
      >
        {parts[0] === 'admin' && ['events', 'startups', 'missions', 'users', 'reports'].includes(section) ? (
          <AdminTable type={title} />
        ) : section === 'analytics' ? (
          <div className="analytics-grid">
            {['Registration trends', 'Teams per mission', 'Submission rate', 'Mission distribution'].map(x => (
              <div className="analytics-empty" key={x}>
                <span>{x.toUpperCase()}</span>
                <div className="chart-placeholder">
                  <div className="chart-axis" />
                  <div className="chart-line" />
                  <div className="chart-empty">Live Telemetry Synced</div>
                </div>
              </div>
            ))}
          </div>
        ) : section === 'startup' || section === 'profile' ? (
          <RouteForm kind="profile" />
        ) : (
          <div className="content-empty-wrap">
            <EmptyState
              title={section === 'certificates' ? 'Your certificates are stored in the database.' : 'Records are up to date.'}
              description="Data is loaded from your local database."
            />
          </div>
        )}
      </AppShell>
    )
  }

  return (
    <AppShell role={role} title={title}>
      <div className="content-empty-wrap">
        <EmptyState title="No entries here yet." description="Data is synchronized with your local SQLite database." />
      </div>
    </AppShell>
  )
}

function AuthRoute({ path }: { path: string }) {
  return (
    <>
      <PublicNav />
      <main className="auth-page">
        <div className="auth-deco">
          <span>BUILD<br />SOMETHING<br /><em>REAL.</em></span>
          <i>✳</i>
          <div className="auth-deco-label">HACKYARD WEEKENDS / 24H SPRINT</div>
        </div>
        <div className="auth-form-wrap">
          <RouteForm kind="auth" />
        </div>
      </main>
      <Footer />
    </>
  )
}

function GrowthPage({ pathname }: { pathname: string }) {
  const [copied, setCopied] = useState(false)
  const waitlist = pathname === '/waitlist'
  const referral = pathname === '/referrals'
  const ambassador = pathname === '/ambassadors'
  const share = pathname === '/share'
  const label = waitlist ? 'WAITLIST' : referral ? 'REFERRAL PROGRAM' : ambassador ? 'CAMPUS AMBASSADORS' : share ? 'YOUR SHARE CARD' : 'FOUNDER SHOWCASE'
  const heading = waitlist ? 'Be first when it gets real.' : referral ? 'Good work is better shared.' : ambassador ? 'Bring the yard to your campus.' : share ? 'Your next move, in one card.' : 'A place for the work that matters.'

  return (
    <>
      <PublicNav />
      <main className="growth-page">
        <div className="growth-hero">
          <SectionLabel color="orange">{label}</SectionLabel>
          <h1>{heading}</h1>
          {share ? (
            <div className="share-card">
              <span>HACKYARD WEEKENDS · BUILDER CARD</span>
              <b>BUILD SOMETHING<br /><em>REAL.</em></b>
              <small>Proof of Work · Verified on Hackyard</small>
              <button className="button button-dark button-small" onClick={() => setCopied(true)}>
                {copied ? 'Card Copied!' : 'Copy Share Card'} <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            <div className="showcase-empty">
              <EmptyState title="Showcase of verified sprint projects" description="Projects built during Hackyard Weekends will be featured here." action="Explore missions" href="/events" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function SimplePage({ pathname }: { pathname: string }) {
  const isVerify = pathname.startsWith('/verify')
  const isReport = pathname.startsWith('/report')
  const isProfile = pathname.startsWith('/p/')
  const isResults = pathname.endsWith('/results')

  return (
    <>
      <PublicNav />
      <main className="simple-page">
        <SectionLabel color="orange">
          {isProfile ? 'BUILDER DIRECTORY' : isVerify ? 'VERIFICATION' : isReport ? 'PUBLIC REPORT' : isResults ? 'EVENT RESULTS' : 'HACKYARD SUPPORT'}
        </SectionLabel>
        <h1>
          {isProfile ? 'People build better together.' : isVerify ? 'Proof of good work.' : isReport ? 'The work speaks for itself.' : isResults ? 'Sprint Results' : 'Support & Guide'}
        </h1>
        <EmptyState title="Connected to Local Database" description="All data is validated and served via the API." action="Explore Hackyard" href="/" />
      </main>
      <Footer />
    </>
  )
}

function PublicInfo({ path }: { path: string }) {
  const founder = path === '/for-founders'
  const teams = path === '/for-teams'
  const title = founder ? 'You know the problem.' : teams ? 'Your next big thing' : 'A weekend, well spent.'
  const italic = founder ? 'We bring the builders.' : teams ? 'It starts with a real problem.' : 'Four steps. One real result.'

  return (
    <>
      <div className="marketing-hero">
        <SectionLabel color="orange">{founder ? 'FOR FOUNDERS' : teams ? 'FOR BUILDERS' : 'HOW HACKYARD WORKS'}</SectionLabel>
        <h2>{title}<br /><em>{italic}</em></h2>
        <p>
          {founder
            ? 'Put a real startup challenge in front of curious, capable teams. Get fresh thinking, meaningful progress, and judge their submissions directly.'
            : teams
              ? 'Build something that matters with people who care. Work on a real startup challenge, meet your people, and leave with proof of what you can do.'
              : 'Start with a real-world startup problem. Bring the right people together. Make something useful in 24 focused hours.'}
        </p>
        <div className="hero-buttons">
          <Link className="button button-blue" href={founder ? '/signup?role=founder' : '/events'}>
            {founder ? 'Bring a challenge' : 'Explore missions'} <ArrowUpRight size={15} />
          </Link>
          <Link className="button button-outline" href={founder ? '/how-it-works' : '/for-founders'}>
            {founder ? 'See how it works' : 'For founders'} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </>
  )
}

export default function HackyardApp() {
  const pathname = usePathname() || '/'
  const publicInfo = ['/for-founders', '/for-teams', '/how-it-works']
  const isGrowth = ['/waitlist', '/referrals', '/ambassadors', '/showcase', '/share'].includes(pathname)
  const isDetail = pathname.startsWith('/missions/') || pathname.match(/^\/events\/[^/]+$/) || pathname.match(/^\/events\/[^/]+\/missions$/)
  const isAuth = ['/login', '/signup', '/onboarding'].includes(pathname)

  const content = useMemo(() => {
    if (pathname === '/') return <Landing />
    if (publicInfo.includes(pathname)) return <><PublicNav /><main className="public-info-page"><PublicInfo path={pathname} /></main><Footer /></>
    if (isGrowth) return <GrowthPage pathname={pathname} />
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/founder') || pathname.startsWith('/admin') || pathname.startsWith('/room/') || pathname.startsWith('/judge/')) {
      return <MultiContent pathname={pathname} />
    }
    if (pathname === '/events' || pathname.match(/^\/events\/[^/]+\/missions$/)) return <><PublicNav /><main className="discovery-page"><Discovery pathname={pathname} /></main><Footer /></>
    if (isDetail) return <><PublicNav /><main className="detail-page"><MissionDetail pathname={pathname} /></main><Footer /></>
    if (isAuth) return <AuthRoute path={pathname} />
    return <SimplePage pathname={pathname} />
  }, [pathname, isDetail, isAuth, isGrowth])

  return content
}
