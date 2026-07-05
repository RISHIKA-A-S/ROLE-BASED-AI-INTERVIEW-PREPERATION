import React from 'react'
import ProfileInfoCard from '../Cards/ProfileInfoCard'
import { Link } from "react-router-dom";
import { LuSparkles } from 'react-icons/lu';

const Navbar = () => {
  return (
    <div className='sticky top-0 z-30 border-b border-gray-200/70 bg-white/90 py-3 backdrop-blur-xl'>
        <div className='container mx-auto flex w-9/10 items-center justify-between gap-5'>
            <Link to="/dashboard" className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7D1C4A] to-[#670D2F] text-white shadow-lg shadow-[#F2D5E2]'>
                    <LuSparkles />
                </div>
                <div>
                    <h2 className='text-lg font-semibold leading-5 text-gray-900'>
                        Interview Prep AI
                    </h2>
                    <p className='text-xs text-gray-500'>Practice smarter</p>
                </div>
            </Link>
            <ProfileInfoCard/>
        </div>
    </div>
  )
}

export default Navbar
