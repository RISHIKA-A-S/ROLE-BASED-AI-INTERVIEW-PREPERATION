import React from 'react'
import { LuArrowRight, LuBrain, LuClock3, LuTrash2 } from 'react-icons/lu';
import { getInitials } from '../../utils/helper';

const SummaryCard = ({
    colors,
    role,
    topicsToFocus,
    experience,
    questions,
    description,
    lastUpdated,
    onSelect,
    onDelete,
}) => {
    const focusTopics = (topicsToFocus || '').split(',').map(item => item.trim()).filter(Boolean).slice(0, 2);

    return <div className='group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-2 shadow-[0_16px_50px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:shadow-[0_22px_60px_-24px_rgba(103,13,47,0.35)]' onClick={onSelect}>
        <div className='relative cursor-pointer rounded-[16px] p-4' style={{ background: colors.bgcolor }}>
            <div className='flex items-start justify-between gap-3'>
                <div className='flex items-start gap-3'>
                    <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/90 text-lg font-semibold text-black shadow-sm'>
                        {getInitials(role)}
                    </div>

                    <div className='min-w-0'>
                        <h2 className='text-[17px] font-semibold text-gray-900'>
                            {role}
                        </h2>
                        <p className='mt-1 line-clamp-2 text-xs font-medium text-gray-700'>
                            {topicsToFocus || 'Core interview prep'}
                        </p>
                    </div>
                </div>

                <button className='hidden items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600 transition group-hover:flex' 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <LuTrash2 />
                </button>
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
                {focusTopics.length ? focusTopics.map((topic, index) => (
                    <span key={`${topic}-${index}`} className='rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-gray-800'>
                        {topic}
                    </span>
                )) : (
                    <span className='rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-gray-800'>
                        AI guided prep
                    </span>
                )}
            </div>
        </div>

        <div className='px-3 pb-3 pt-3'>
            <div className='flex flex-wrap items-center gap-2'>
                <div className='rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-700'>
                    {experience} {experience == 1 ? 'Year' : 'Years'} exp
                </div>

                <div className='rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-700'>
                    {questions} Q&A
                </div>

                <div className='rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-700'>
                    <span className='mr-1 inline-flex items-center'><LuClock3 size={10} /></span>
                    {lastUpdated || 'Fresh'}
                </div>
            </div>

            <p className='mt-3 line-clamp-2 text-[12px] font-medium text-gray-500'>
                {description || 'Continue your interview prep with tailored questions and explanations.'}
            </p>

            <div className='mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700'>
                <span className='flex items-center gap-2 font-medium'>
                    <LuBrain size={14} className='text-[#670D2F]' />
                    Smart practice ready
                </span>
                <span className='flex items-center gap-1 text-xs font-semibold text-[#670D2F]'>
                    Open <LuArrowRight size={13} />
                </span>
            </div>
        </div>
    </div>
};

export default SummaryCard;
