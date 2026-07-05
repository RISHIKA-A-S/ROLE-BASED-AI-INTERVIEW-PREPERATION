import React, { useContext } from 'react'
import { UserContext } from '../../context/userContext'
import Navbar from './Navbar'

const DashboardLayout = ({children}) => {
    const {user} = useContext(UserContext)
    return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,238,244,0.8),_transparent_35%),linear-gradient(135deg,_#fffdfd_0%,_#fff7fa_100%)]'>
        <Navbar/>

        {user && <main className='px-3 py-4 md:px-0'>{children}</main>}
    </div>
  )
}

export default DashboardLayout
