import React, { useContext, useState } from 'react'
import { UserContext } from '../../context/userContext'
import { useNavigate } from 'react-router-dom';
import { LuChevronDown, LuLogOut, LuSparkles } from 'react-icons/lu';

const ProfileInfoCard = () => {
    const { user, clearUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.clear();
        clearUser();
        navigate("/");
    };

    const getInitials = (name = "") => {
        const parts = name.split(" ").filter(Boolean);
        if (!parts.length) return "U";
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    };

    if (!user) return null;

    return (
        <div className='relative'>
            <button
                type='button'
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className='flex items-center gap-3 rounded-full border border-gray-200 bg-white/90 px-2.5 py-1.5 shadow-sm transition hover:shadow-md'
            >
                {user.profileImageUrl ? (
                    <img
                        src={user.profileImageUrl}
                        alt={user.name || 'User profile'}
                        className='h-10 w-10 rounded-full object-cover ring-2 ring-[#F2D5E2]'
                    />
                ) : (
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7D1C4A] to-[#670D2F] text-sm font-semibold text-white'>
                        {getInitials(user.name || user.email || 'User')}
                    </div>
                )}
                <div className='hidden text-left sm:block'>
                    <div className='text-sm font-semibold text-gray-900'>
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate('/profile');
                            }}
                            className='hover:underline cursor-pointer'
                        >
                            {user.name || 'Your profile'}
                        </span>
                    </div>
                    <div className='text-xs text-gray-500'>
                        {user.email || 'Interview Prep AI'}
                    </div>
                </div>
                <LuChevronDown className='text-gray-500' />
            </button>

                    {isProfileOpen && (
                <div className='absolute right-0 top-14 z-40 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl shadow-gray-200'>
                    <div className='flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#FFF7FA] to-[#F9EAF3] p-3'>
                        {user.profileImageUrl ? (
                            <img
                                src={user.profileImageUrl}
                                alt={user.name || 'User profile'}
                                className='h-14 w-14 rounded-full object-cover ring-2 ring-[#E9B6CA]'
                            />
                        ) : (
                            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7D1C4A] to-[#670D2F] text-lg font-semibold text-white'>
                                {getInitials(user.name || user.email || 'User')}
                            </div>
                        )}
                        <div>
                            <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                                {user.name || 'Your profile'}
                                <LuSparkles className='text-[#670D2F]' />
                            </div>
                            <div className='text-sm text-gray-600'>{user.email || 'Ready for your next interview'}</div>
                        </div>
                    </div>

                    <div className='mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600'>
                        Keep practicing with role-based sessions and polished interview prep.
                    </div>

                    <button
                        type='button'
                        onClick={() => {
                            setIsProfileOpen(false);
                            navigate('/profile');
                        }}
                        className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50'
                    >
                        View Profile
                    </button>

                    <button
                        type='button'
                        onClick={handleLogout}
                        className='mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#670D2F] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7D1C4A]'
                    >
                        <LuLogOut />
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}

export default ProfileInfoCard