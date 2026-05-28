import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { STORAGE_KEYS } from "./utils/storageKeys";
import { setCredentials, setLoading } from "./features/authSlice";
import type { AuthUser } from "./types";
import Router from "./router/Router";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.accessToken);
    const userStr = localStorage.getItem(STORAGE_KEYS.user);

    if (token && userStr) {
      try {
        dispatch(setCredentials(JSON.parse(userStr) as AuthUser));
      } catch {
        dispatch(setLoading(false));
      }
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  return <Router />;
}

export default App;
