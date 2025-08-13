import React from 'react'
import { Link } from 'react-router-dom'
import { Home, User } from 'lucide-react'
import { UserAuth } from '../../context/AuthContext'

const Header = () => {
  const { session } = UserAuth();

  return (
    <header className="sticky top-0 z-50 w-full p-4 bg-black flex justify-between items-center">
      <Link to="/" className="text-white hover:text-blue-300">
        <Home size={24} />
      </Link>
      {session && (
        <Link to="/profile" className="text-white hover:text-blue-300">
          <User size={24} />
        </Link>
      )}
    </header>
  )
}

export default Header