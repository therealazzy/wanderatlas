import { createBrowserRouter } from "react-router-dom";
import Signup from "./components/Auth/signup";
import Login from "./components/Auth/login";
import Profile from './components/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import App from './App'
import MapPage from './components/MapPage'

export const router = createBrowserRouter([
    {path: '/', element: <App />},
    {path: '/signup', element: <Signup />},
    {path: '/login', element: <Login />},
    {path: '/profile', element: <ProtectedRoute><Profile /></ProtectedRoute>},
    {path: '/map', element: <MapPage />}
    
])