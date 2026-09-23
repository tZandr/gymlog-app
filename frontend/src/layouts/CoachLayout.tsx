import { FaArrowLeft, FaClipboardList, FaUsers } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import { CoachPaywall } from "../components/platform/CoachPaywall";
import SidebarLayout from "./SidebarLayout";

export default function CoachLayout() {
  const { access } = useAuth();
  const locked = !access.coach;

  return (
    <SidebarLayout
      items={[
        { to: "/coach/clients", label: "Clients", icon: <FaUsers />, locked },
        { to: "/coach/programs", label: "Programs", icon: <FaClipboardList />, locked },
        { to: "/", label: "Back to app", icon: <FaArrowLeft />, end: true },
      ]}
      footerSub={locked ? "No coach plan" : "Coach plan active"}
      gate={locked ? <CoachPaywall /> : undefined}
    />
  );
}
