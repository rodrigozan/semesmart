import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleIcon } from '../components/common/Icons';

const Login: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center p-1 shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path d="M14.25 8.75C14.25 5.5625 11.6875 3 8.5 3C5.3125 3 2.75 5.5625 2.75 8.75C2.75 11.75 5.0625 14.125 7.9375 14.25C8.125 17.5 9.0625 21 12 21C14.9375 21 15.875 17.5 16.0625 14.25C18.9375 14.125 21.25 11.75 21.25 8.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21C12 19.375 12.4375 16.25 14.25 14.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">SemeSmart</h1>
          </div>
          <p className="text-gray-500 mt-4">Semear o futuro financeiro da sua família.</p>
        </div>

        <button
          onClick={login}
          className="w-full inline-flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <GoogleIcon />
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

export default Login;
