import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { setCredentials } from "../features/authSlice";
import authService from "../services/authService";
import { getDashboardPath } from "../utils/auth";

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = params.get("token");
    const refresh = params.get("refresh");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem(STORAGE_KEYS.accessToken, token);
    if (refresh) localStorage.setItem(STORAGE_KEYS.refreshToken, refresh);

    authService
      .getProfile()
      .then((user) => {
        const userWithTokens = { ...user, accessToken: token, refreshToken: refresh || "" };
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userWithTokens));
        dispatch(setCredentials(userWithTokens));
        navigate(getDashboardPath(user.roles), { replace: true });
      })
      .catch(() => navigate("/login", { replace: true }));
  }, [params, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Completing sign-in…</p>
    </div>
  );
}
