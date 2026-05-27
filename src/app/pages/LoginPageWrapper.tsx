import { useNavigate } from "react-router";
import LoginPage from "./LoginPage";

export default function LoginPageWrapper() {
  const navigate = useNavigate();
  return <LoginPage onLogin={() => navigate("/workspace")} />;
}
