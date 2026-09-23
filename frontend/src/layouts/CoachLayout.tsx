import { NavLink, Outlet } from "react-router-dom";
import { FaUsers } from "react-icons/fa";

export default function CoachLayout() {
  return (
    <div className="coach-layout">
      <aside className="coach-sidebar">
        <div className="coach-sidebar__brand">GymLog Coach</div>
        <nav className="coach-sidebar__nav">
          <NavLink
            to="/coach/clients"
            className={({ isActive }) => `coach-sidebar__link${isActive ? " coach-sidebar__link--active" : ""}`}
          >
            <FaUsers /> Clients
          </NavLink>
        </nav>
      </aside>
      <main className="coach-content">
        <Outlet />
      </main>
    </div>
  );
}
