import { FaArrowLeft, FaShieldAlt, FaThLarge } from "react-icons/fa";
import SidebarLayout from "./SidebarLayout";

export default function AdminLayout() {
  return (
    <SidebarLayout
      tag="Admin"
      items={[
        { to: "/admin", label: "Overview", icon: <FaThLarge />, end: true },
        { to: "/admin/team", label: "Admin team", icon: <FaShieldAlt /> },
        { to: "/", label: "Back to app", icon: <FaArrowLeft />, end: true },
      ]}
      footerSub="Admin"
    />
  );
}
