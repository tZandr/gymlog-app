import { NavLink, Outlet } from "react-router-dom";
import { FaArrowLeft, FaUsers } from "react-icons/fa";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `coach-sidebar__link${isActive ? " coach-sidebar__link--active" : ""}`;

export default function CoachLayout() {
  return (
    <div className="coach-layout">
      <aside className="coach-sidebar">
        <div className="coach-sidebar__brand">GymLog Coach</div>
        <nav className="coach-sidebar__nav">
          <NavLink to="/admin/clients" className={linkClass}>
            <FaUsers /> Clients
          </NavLink>
          <NavLink to="/" end className={linkClass}>
            <FaArrowLeft /> Back to app
          </NavLink>
        </nav>
      </aside>
      <main className="coach-content">
        <Outlet />
      </main>
    </div>
  );
}
