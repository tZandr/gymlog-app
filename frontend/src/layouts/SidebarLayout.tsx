import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";

export interface SidebarItem {
  to: string;
  label: string;
  icon: ReactNode;
  locked?: boolean;
  end?: boolean;
}

interface Props {
  items: SidebarItem[];
  /** Small label under the brand, e.g. "Admin". */
  tag?: string;
  footerSub: string;
  /** Replaces the page content, e.g. the paywall. */
  gate?: ReactNode;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-layout__link${isActive ? " sidebar-layout__link--active" : ""}`;

export default function SidebarLayout({ items, tag, footerSub, gate }: Props) {
  const { profile } = useAuth();
  const handle = profile?.username ? `@${profile.username}` : "";

  return (
    <div className="sidebar-layout">
      <aside className="sidebar-layout__sidebar">
        <div className="sidebar-layout__brand">
          <span className="display sidebar-layout__name">Bro Split</span>
          <span className="sidebar-layout__tagline">Coach–Client Platform</span>
          {tag && <span className="chip chip--accent">{tag}</span>}
        </div>
        <nav aria-label="Main" className="sidebar-layout__nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.icon}
              <span className="sidebar-layout__label">{item.label}</span>
              {item.locked && <FaLock className="sidebar-layout__lock" aria-label="Locked" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-layout__user">
          <span className="avatar-initials" aria-hidden="true">{handle.slice(1, 3).toUpperCase()}</span>
          <span className="sidebar-layout__who">
            <strong>{handle}</strong>
            <span>{footerSub}</span>
          </span>
        </div>
      </aside>
      <main className="sidebar-layout__content">{gate ?? <Outlet />}</main>
    </div>
  );
}
