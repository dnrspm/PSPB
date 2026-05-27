import { useOutletContext } from "react-router";
import WorkspacePage from "./WorkspacePage";
import type { SessionUser } from "../lib/auth";

export default function WorkspacePageWrapper() {
  const { currentUser } = useOutletContext<{ currentUser: SessionUser }>();
  return <WorkspacePage currentUser={currentUser} />;
}
