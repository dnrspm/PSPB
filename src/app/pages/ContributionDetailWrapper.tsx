import { useOutletContext } from "react-router";
import ContributionDetailPage from "./ContributionDetailPage";
import type { SessionUser } from "../lib/auth";

export default function ContributionDetailWrapper() {
  const { currentUser } = useOutletContext<{ currentUser: SessionUser }>();
  return <ContributionDetailPage currentUser={currentUser} />;
}
