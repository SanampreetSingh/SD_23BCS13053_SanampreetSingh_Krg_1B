import React, { useContext } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import IDEWorkspace from './components/IDEWorkspace';
import { LoginApi } from "./api/auth.jsx";
import { UserContext } from "./context/UserContext.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const { user, setUser } = useContext(UserContext);

  const onSuccess = async (response) => {
    try {
      // 'credential' is the JWT returned by Google
      const { credential } = response;

      // Exchange Google token for your Backend JWT + Cookie
      // NOTE: Ensure the key 'token' matches your backend req.body.token
      const backendUser = await LoginApi({ token: credential });

      // This updates state AND localStorage (via UserProvider)
      setUser(backendUser.user);

    } catch (error) {
      console.error("Login process failed:", error);
      alert("Failed to authenticate with backend.");
    }
  };
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="h-screen w-screen bg-[#1e1e1e] text-white overflow-hidden flex items-center justify-center">
        {!user ? (
          <div className="h-1/2 w-1/2 bg-[#252526] flex flex-col items-center justify-center border border-[#333] rounded-2xl gap-6 shadow-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-blue-400">Cloud IDE</h1>
            <p className="text-gray-400 text-sm">Sign in to launch your workspace</p>
            <GoogleLogin
              onSuccess={onSuccess}
              onError={() => console.log("Login Failed")}
              theme="filled_black"
              shape="pill"
            />
          </div>
        ) : (
          <IDEWorkspace />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;