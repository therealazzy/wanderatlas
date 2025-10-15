import React from 'react'
import { Link } from 'react-router-dom'
import { Home, User, Map } from 'lucide-react'
import { UserAuth } from '../../context/AuthContext'

const Header = ({ children }) => {
  const { session } = UserAuth();

  return (
    <header className="sticky top-0 z-50 w-full p-2 sm:p-3 md:p-4 bg-black flex items-center">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/" className="text-white hover:text-blue-300">
          <Home size={20} className="sm:w-6 sm:h-6" />
        </Link>
      </div>
      <div className="flex-1 flex justify-center items-center px-2 sm:px-4">
        {children}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {session && (
          <>
            <Link to="/map" className="text-white hover:text-blue-300" title="Map">
              <Map size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <Link to="/profile" className="text-white hover:text-blue-300" title="Profile">
              <User size={20} className="sm:w-6 sm:h-6" />
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Header