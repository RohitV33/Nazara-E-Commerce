import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate(); 

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
    
      localStorage.setItem("token", token);

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        const user = {
          id: payload.id,
          email: payload.email,
          name: payload.name || payload.email.split("@")[0],
          role: payload.role || "user",
        };

        localStorage.setItem("user", JSON.stringify(user));
      } catch (e) {
        console.error("Token decode failed", e);
      }
      navigate("/");

    } else {
      
      navigate("/login");
    }
  }, [navigate]); 

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink-500 text-sm animate-pulse">
        Logging you in...
      </p>
    </div>
  );
}