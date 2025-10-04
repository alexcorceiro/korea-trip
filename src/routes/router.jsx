import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Singin"
import Home from "../pages/Home"
import Profil from "../pages/Profil";
import ProtectedRoute from "./ProtectedRoute";
import Register from "../pages/Register";
import AddActivity from "../pages/AddActivity";
import Planning from "../pages/Planning";
import Explore from "../pages/Explore";


const routes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  // Routes protégées
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <Profil/>
      </ProtectedRoute>
    ),
  },{
    path:"/catalog-add",
    element: <ProtectedRoute>
        <AddActivity/>
    </ProtectedRoute>
  }, {
    path:"/planning",
    element:<ProtectedRoute>
        <Planning/>
    </ProtectedRoute>
  },{
    path:"/explore" ,
    element: <ProtectedRoute>
      <Explore/>
    </ProtectedRoute>
  }
];

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL, // '/' en dev, '/travel-planner/' en prod si base configurée
});