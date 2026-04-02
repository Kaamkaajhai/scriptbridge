import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const BrandLogo = ({ className = "h-10 w-auto", title = "Ckript" }) => {
  const logoSrc = "/ckript.com-logo.png";
  const { user } = useContext(AuthContext);

  const handleLogoClick = (e) => {
    if (!user) return;
    e.preventDefault();
    window.location.reload();
  };

  return (
    <Link to="/" onClick={handleLogoClick} className="inline-flex items-center" aria-label="Go to home page" title={title}>
      <img
        src={logoSrc}
        alt="Ckript"
        className={`${className} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]`}
      />
    </Link>
  );
};

export default BrandLogo;
