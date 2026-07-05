import React, { useContext, useState, useEffect, useMemo } from 'react'
import { UserContext } from '../../context/userContext'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import toast from 'react-hot-toast'
import { LuCamera, LuPenLine, LuSparkles, LuFlame, LuArrowLeft } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
};

const buildWeeks = (activeDaySet) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - 371);

    const startPad = start.getDay();
    start.setDate(start.getDate() - startPad);

    const end = new Date(today);
    const endPad = 6 - end.getDay();
    end.setDate(end.getDate() + endPad);

    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayTime = toDateKey(d);
        days.push({
            date: new Date(d),
            time: dayTime,
            isFuture: dayTime > toDateKey(today),
            isActive: activeDaySet.has(dayTime),
        });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    return weeks;
};

const computeStreaks = (activeDaySet) => {
    const today = toDateKey(new Date());
    const sortedDays = Array.from(activeDaySet).sort((a, b) => a - b);

    if (!sortedDays.length) {
        return { current: 0, longest: 0, activeDays: 0 };
    }

    let longest = 1;
    let run = 1;
    for (let i = 1; i < sortedDays.length; i++) {
        if (sortedDays[i] - sortedDays[i - 1] === DAY_MS) {
            run += 1;
        } else {
            longest = Math.max(longest, run);
            run = 1;
        }
    }
    longest = Math.max(longest, run);

    let current = 0;
    let cursor = today;
    const hasToday = activeDaySet.has(today);
    if (!hasToday) {
        cursor = today - DAY_MS;
    }
    while (activeDaySet.has(cursor)) {
        current += 1;
        cursor -= DAY_MS;
    }

    return { current, longest, activeDays: sortedDays.length };
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const StreakGraph = ({ sessions }) => {
    const activeDaySet = useMemo(() => {
        const set = new Set();
        (sessions || []).forEach((s) => {
            const dateStr = s?.createdAt || s?.updatedAt;
            if (dateStr) set.add(toDateKey(dateStr));
        });
        return set;
    }, [sessions]);

    const weeks = useMemo(() => buildWeeks(activeDaySet), [activeDaySet]);
    const { current, longest, activeDays } = useMemo(
        () => computeStreaks(activeDaySet),
        [activeDaySet]
    );

    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
        const firstDay = week[0];
        const month = firstDay.date.getMonth();
        if (month !== lastMonth) {
            monthLabels.push({ index: i, label: MONTH_LABELS[month] });
            lastMonth = month;
        }
    });

    return (
        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-gray-900'>Activity Streak</h3>
                <div className='flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600'>
                    <LuFlame className='text-orange-500' />
                    {current} day{current === 1 ? "" : "s"}
                </div>
            </div>

            <div className='mt-5 overflow-x-auto'>
                <div className='min-w-[600px]'>
                    <div className='mb-1 flex pl-8 text-[10px] text-gray-400'>
                        {weeks.map((_, i) => {
                            const label = monthLabels.find((m) => m.index === i);
                            return (
                                <div key={i} style={{ width: 14 }} className='flex-shrink-0'>
                                    {label ? label.label : ""}
                                </div>
                            );
                        })}
                    </div>

                    <div className='flex gap-[3px] pl-8'>
                        {weeks.map((week, wi) => (
                            <div key={wi} className='flex flex-col gap-[3px]'>
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        title={day.date.toDateString()}
                                        className={`h-[11px] w-[11px] rounded-[2px] ${
                                            day.isFuture
                                                ? 'bg-transparent'
                                                : day.isActive
                                                ? 'bg-[#670D2F]'
                                                : 'bg-gray-100'
                                        }`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className='mt-5 grid grid-cols-3 gap-3'>
                <div className='rounded-xl border border-gray-100 bg-gray-50 p-3 text-center'>
                    <p className='text-xl font-semibold text-gray-900'>{current}</p>
                    <p className='text-xs text-gray-500'>Current streak</p>
                </div>
                <div className='rounded-xl border border-gray-100 bg-gray-50 p-3 text-center'>
                    <p className='text-xl font-semibold text-gray-900'>{longest}</p>
                    <p className='text-xs text-gray-500'>Longest streak</p>
                </div>
                <div className='rounded-xl border border-gray-100 bg-gray-50 p-3 text-center'>
                    <p className='text-xl font-semibold text-gray-900'>{activeDays}</p>
                    <p className='text-xs text-gray-500'>Active days</p>
                </div>
            </div>
        </div>
    );
};

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useContext(UserContext);
    const [name, setName] = useState(user?.name || '');
    const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await axiosInstance.get(API_PATHS.SESSION.GET_ALL);
                setSessions(res.data || []);
            } catch (err) {
                console.error("Error fetching sessions for streak:", err);
            }
        };
        fetchSessions();
    }, []);

    const handleImageUpload = async (file) => {
        if(!file) return;
        const form = new FormData();
        form.append('image', file);
        setUploading(true);
        try{
            const res = await axiosInstance.post(API_PATHS.IMAGE.UPLOAD_IMAGE, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfileImageUrl(res.data.imageUrl);
            toast.success('Image uploaded');
        } catch(err){
            console.error(err);
            toast.error('Image upload failed');
        } finally{
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try{
            const res = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, { name, profileImageUrl });
            updateUser(res.data);
            toast.success('Profile updated');
        } catch(err){
            console.error(err);
            toast.error('Profile update failed');
        } finally{
            setSaving(false);
        }
    };

    return (
        <div className='container mx-auto w-9/10 py-8'>
            <button
                onClick={() => navigate(-1)}
                className='flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition mb-4 cursor-pointer'
                aria-label='Go back'
            >
                <LuArrowLeft size={18} />
            </button>

            <div className='mx-auto max-w-6xl rounded-[28px] border border-gray-200 bg-white shadow-[0_20px_60px_-24px_rgba(103,13,47,0.25)]'>
                <div className='rounded-[28px] bg-gradient-to-r from-[#FFF7FA] to-[#F7EAF2] p-6 md:p-8'>
                    <div className='flex items-start gap-4'>
                        <div className='relative'>
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt='profile' className='h-24 w-24 rounded-full object-cover ring-4 ring-white' />
                            ) : (
                                <div className='flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#7D1C4A] to-[#670D2F] text-2xl font-semibold text-white ring-4 ring-white'>
                                    { (name || user?.email || 'U').split(' ').map(n=>n[0]).slice(0,2).join('') }
                                </div>
                            )}
                            <label className='absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#670D2F] text-white shadow-lg'>
                                <LuCamera size={16} />
                                <input type='file' accept='image/*' onChange={(e)=> handleImageUpload(e.target.files?.[0])} className='hidden' />
                            </label>
                        </div>

                        <div>
                            <div className='flex items-center gap-2'>
                                <h2 className='text-2xl font-semibold text-gray-900'>{name || user?.name || 'Your Name'}</h2>
                                <LuSparkles className='text-[#670D2F]' />
                            </div>
                            <p className='mt-1 text-sm text-gray-600'>{user?.email || 'your@email.com'}</p>
                        </div>
                    </div>
                </div>

                <div className='grid gap-6 p-6 md:p-8'>
                    <div className='rounded-2xl border border-gray-200 bg-gray-50 p-5'>
                        <div className='flex items-center justify-between'>
                            <h3 className='text-lg font-semibold text-gray-900'>Edit your public profile</h3>
                            <button onClick={handleSave} disabled={saving} className='rounded-full bg-[#670D2F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7D1C4A]'>
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>

                        <div className='mt-4 space-y-4'>
                            <div>
                                <label className='text-sm font-medium text-gray-700'>Display Name</label>
                                <div className='mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2'>
                                    <LuPenLine className='text-gray-400' />
                                    <input value={name} onChange={(e)=>setName(e.target.value)} className='w-full outline-none' placeholder='Enter your name' />
                                </div>
                            </div>

                            <div>
                                <label className='text-sm font-medium text-gray-700'>Email</label>
                                <div className='mt-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500'>
                                    {user?.email || 'your@email.com'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <StreakGraph sessions={sessions} />
                </div>
            </div>
        </div>
    )
}

export default Profile