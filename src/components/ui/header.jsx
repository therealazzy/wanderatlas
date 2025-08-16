import React from 'react'
import { Link } from 'react-router-dom'
import { Home, User, Globe } from 'lucide-react'
import { UserAuth } from '../../context/AuthContext'

const Header = () => {
  const { session } = UserAuth();

  return (
    <header className="sticky top-0 z-50 w-full p-4 bg-black flex justify-between items-center">
      <Link to="/" className="text-white hover:text-blue-300">
        <Home size={24} />
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/map" className="text-white hover:text-blue-300">
          <Globe size={22} />
        </Link>
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