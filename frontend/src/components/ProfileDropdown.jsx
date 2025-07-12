import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate(); // ⬅️ navigation hook

  const handleLogout = async () => {
    await logout();         // logout logic from context
    setOpen(false);         // close dropdown
    navigate("/");          // ⬅️ redirect to landing page
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="absolute top-4 right-4 z-30 text-white">
      <div
        className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer select-none"
        onClick={() => setOpen((prev) => !prev)}
        title="Profile"
      >
        {user.username[0].toUpperCase()}
      </div>

      {open && (
        <div className="mt-2 absolute right-0 bg-white text-black rounded-lg shadow-lg py-2 w-56">
          <div className="px-4 py-2 border-b">
            <p className="font-semibold">{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};
