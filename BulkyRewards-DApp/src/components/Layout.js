import { Outlet, NavLink } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <div className="navigation-container">
            <NavLink className={({ isActive }) => (isActive ? "activeLink" : "link")} to="/"><div className="router-button" name="home">Home</div></NavLink>
         
            <NavLink className={({ isActive }) => (isActive ? "activeLink" : "link")} to="/user" ><div className="router-button" name="user">User</div></NavLink>
          
            <NavLink className={({ isActive }) => (isActive ? "activeLink" : "link")} to="/admin" ><div className="router-button" name="admin">Admin</div></NavLink>
      </div>

      <Outlet />
    </>
  )
};

export default Layout;