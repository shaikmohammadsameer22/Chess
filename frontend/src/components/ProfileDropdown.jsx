import { useAuth } from "../auth/AuthContext";

export const ProfileDropdown = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/"; // or use `useNavigate` if inside router
  };

  if (!user) return null;

  return (
    <div className="bg-[#2c2c2c] text-white p-6 rounded-lg shadow-lg w-64">
      <div className="flex flex-col items-start">
        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold mb-3">
          {user.username[0].toUpperCase()}
        </div>
        <p className="text-lg font-semibold">{user.username}</p>
        <p className="text-sm text-gray-400 mb-1">{user.email}</p>
        <p className="text-sm text-yellow-400 font-medium mb-4">
          Rating: {user.rating || 1000}
        </p>
        <button
          onClick={handleLogout}
          className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};
