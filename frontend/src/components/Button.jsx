export const Button = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`font-semibold transition duration-200 ${className}`}
    >
      {children}
    </button>
  );
};
