import React from 'react'
import { Link } from 'react-router-dom'
import { Home, User } from 'lucide-react'
import { UserAuth } from '../../context/AuthContext'

const Header = ({ children }) => {
  const { session } = UserAuth();

  return (
    <header className="sticky top-0 z-50 w-full p-4 bg-black flex items-center">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-white hover:text-blue-300">
          <Home size={24} />
        </Link>
      </div>
      <div className="flex-1 flex justify-center items-center">
        {children}
      </div>
      <div className="flex items-center gap-3">
        {session && (
          <Link to="/profile" className="text-white hover:text-blue-300">
            <User size={24} />
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header