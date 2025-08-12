import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { UserAuth } from '../../context/AuthContext';
import { Loader2Icon } from "lucide-react";
import Header from '../ui/header';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { session, login } = UserAuth();
  const navigate = useNavigate()

  const emailIsValid = /\S+@\S+\.\S+/.test(email)
  const passwordIsValid = password.length >= 6

  const isButtonDisabled =
    !emailTouched ||
    !passwordTouched ||
    !emailIsValid ||
    !passwordIsValid ||
    loading

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await login({ email, password })
      if (result.success) {
        navigate('/profile')
      } else if (result.error) {
        setError(result.error.message || 'An error occurred during login')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (<>
    <Header />
    <div className='min-h-[calc(100vh-56px)] h-14 bg-linear-65 from-green-500 to-yellow-200 to-95% flex items-center justify-center'>
      <form onSubmit={handleLogin} className='max-w-md m-auto pt-24'>
        <h1 className='text-5xl font-bold text-gray-900 mb-4'>Log in</h1>
        <p className='text-xl text-gray-600'>
          Don&apos;t have an account?{' '}
            <Link to='/signup' className='hover:cursor-pointer font-bold underline'>
              Sign up!
            </Link>
        </p>
        <div className='flex flex-col py-4'>
          <input
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            value={email}
            placeholder='email'
            className='p-3 mt-6'
            type='email'
          />
          {!emailIsValid && emailTouched && (
            <p className='text-red-500 text-sm mt-1'>Please enter a valid email</p>
          )}

          <input
            onChange={(e) => setPass(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            value={password}
            placeholder='password'
            className='p-3 mt-6'
            type='password'
          />
          {!passwordIsValid && passwordTouched && (
            <p className='text-red-500 text-sm mt-1'>
              Password must be at least 6 characters
            </p>
          )}

          <Button
            type="submit"
            disabled={isButtonDisabled}
            className="mt-4 w-full flex items-center justify-center"
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-5 w-5" />}
            {loading ? "Logging in..." : "Log in"}
          </Button>

          {error && <p className='text-red-500 text-center pt-4'>{error}</p>}
        </div>
      </form>
    </div>
    </>
  )
}

export default Login