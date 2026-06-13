// import { useEffect } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import { setCredentials } from "../features/authSlice";
// import { getMyDetails } from "../services/authService";
// import { STORAGE_KEYS } from "../utils/storageKeys";
// import type { AuthUser } from "../types";

// const OAuthCallback = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   useEffect(() => {
//     const token = searchParams.get("token");
//     const refresh = searchParams.get("refresh");

//     if (token && refresh) {
//       localStorage.setItem(STORAGE_KEYS.accessToken, token);
//       localStorage.setItem(STORAGE_KEYS.refreshToken, refresh);

//       getMyDetails()
//         .then((res) => {
//           const userData = (res?.data ?? res) as AuthUser;

//           // Merge tokens into userData so Redux store has full credentials
//           const fullUser: AuthUser = {
//             ...userData,
//             accessToken: token,
//             refreshToken: refresh,
//           };

//           localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(fullUser));
//           dispatch(setCredentials(fullUser));
//           navigate("/dashboard");
//         })
//         .catch(() => {
//           alert("OAuth authentication failed. Please try again.");
//           navigate("/login");
//         });
//     } else {
//       navigate("/login");
//     }
//   }, [searchParams, dispatch, navigate]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="text-center">
//         <div className="w-10 h-10 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//         <p className="text-sm text-gray-500 font-medium">Signing you in…</p>
//       </div>
//     </div>
//   );
// };

// export default OAuthCallback;