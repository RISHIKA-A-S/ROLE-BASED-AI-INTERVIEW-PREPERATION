import React, { useEffect, useState } from 'react'
import { LuBadgeCheck, LuPlus, LuSparkles, LuTarget, LuTrendingUp } from "react-icons/lu";
import { CARD_BG } from "../../utils/data";
import toast from "react-hot-toast";
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import SummaryCard from '../../components/Cards/SummaryCard';
import moment from "moment";
import Modal from '../../components/Modal';
import CreateSessionForm from './CreateSessionForm';
import DeleteAlertContent from '../../components/DeleteAlertContent';


const Dashboard = () => {
  const navigate = useNavigate();

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [sessions, setSessions] = useState([]);

  const [openDeleteAlert , setOpenDeleteAlert] = useState({
    ope: false,
    data: null,
  });

  const fetchAllSessions = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.SESSION.GET_ALL);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching session data:", error);
    }

  };

  const deleteSession = async(sessionData) => {
    try {
      await axiosInstance.delete(API_PATHS.SESSION.DELETE(sessionData?._id));

      toast.success("Session Deleted Successfully");
      setOpenDeleteAlert({
        open: false,
        data: null,
      });
      fetchAllSessions();
    } catch (error) {
      console.error("Error deleting session data:", error);
    }
  };

  useEffect(() => {
    fetchAllSessions();
  },[]);

  return (
    <DashboardLayout>
      <div className='container mx-auto w-9/10 pb-4 pt-4'>
        <div className='mb-6 rounded-[28px] border border-[#F1D5E3] bg-gradient-to-br from-[#FFF7FA] via-white to-[#F8EAF2] p-5 shadow-[0_20px_60px_-24px_rgba(103,13,47,0.35)] md:p-7'>
          <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
            <div className='max-w-2xl'>
              <p className='mb-2 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7D1C4A]'>
                Your interview cockpit
              </p>
              <h1 className='text-2xl font-semibold text-[#670D2F] md:text-3xl'>
                Ready to level up your next interview?
              </h1>
              <p className='mt-2 text-sm text-gray-600 md:text-base'>
                Create focused practice sessions, revisit your best answers, and stay on top of your prep with a cleaner workspace.
              </p>
            </div>
            <div className='flex gap-3'>
              <div className='rounded-2xl border border-[#F1D5E3] bg-white/80 px-4 py-3 text-left shadow-sm'>
                <p className='text-sm text-gray-500'>Practice sessions</p>
                <p className='text-2xl font-semibold text-[#670D2F]'>{sessions?.length || 0}</p>
              </div>
              <div className='rounded-2xl border border-[#F1D5E3] bg-white/80 px-4 py-3 text-left shadow-sm'>
                <p className='text-sm text-gray-500'>AI insights</p>
                <p className='text-2xl font-semibold text-[#670D2F]'>On</p>
              </div>
            </div>
          </div>

          <div className='mt-5 grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-gray-200 bg-white/80 p-3'>
              <div className='flex items-center gap-2 text-sm font-semibold text-gray-800'>
                <LuTarget className='text-[#670D2F]' />
                Tailored practice
              </div>
              <p className='mt-1 text-sm text-gray-600'>Create sessions for any role and focus area.</p>
            </div>
            <div className='rounded-2xl border border-gray-200 bg-white/80 p-3'>
              <div className='flex items-center gap-2 text-sm font-semibold text-gray-800'>
                <LuSparkles className='text-[#670D2F]' />
                Instant explanations
              </div>
              <p className='mt-1 text-sm text-gray-600'>Understand why an answer works and improve it fast.</p>
            </div>
            <div className='rounded-2xl border border-gray-200 bg-white/80 p-3'>
              <div className='flex items-center gap-2 text-sm font-semibold text-gray-800'>
                <LuTrendingUp className='text-[#670D2F]' />
                Track momentum
              </div>
              <p className='mt-1 text-sm text-gray-600'>Keep your prep organized with saved sessions and notes.</p>
            </div>
          </div>
        </div>

        {sessions?.length ? (
          <div className='grid grid-cols-1 gap-4 pb-6 pt-1 md:grid-cols-3 md:gap-7'>
            {sessions?.map((data, index) => (
              <SummaryCard
                key={data?._id}
                colors={CARD_BG[index % CARD_BG.length]}
                role={data?.role || ""}
                topicsToFocus={data?.topicsToFocus || ""}
                experience={data?.experience || "-"}
                questions={data?.questions?.length || "-"}
                description={data?.description || ""}
                lastUpdated={
                  data?.updatedAt
                    ? moment(data.updatedAt).format("Do MMM YYYY")
                    : ""

                }
                onSelect={() => navigate(`/interview-prep/${data?._id}`)}
                onDelete={() => setOpenDeleteAlert({ open: true, data })}
              />
            ))}
          </div>
        ) : (
          <div className='rounded-[24px] border border-dashed border-[#E8BED0] bg-white/70 p-8 text-center shadow-sm'>
            <h2 className='text-xl font-semibold text-[#670D2F]'>No sessions yet</h2>
            <p className='mt-2 text-sm text-gray-600'>Create your first practice session and start building interview confidence.</p>
          </div>
        )}

        <button className='fixed bottom-10 right-10 flex h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#7D1C4A] to-[#670D2F] px-7 py-2.5 text-sm font-semibold text-white shadow-2xl shadow-[#670D2F]/30 transition hover:-translate-y-0.5 hover:shadow-[#670D2F]/40 md:bottom-20 md:right-20' onClick={() => setOpenCreateModal(true)}>
          <LuPlus className='text-2xl text-white' />
          Add New
        </button>
      </div>

      <Modal
      isOpen={openCreateModal}
      onClose={() => {
        setOpenCreateModal(false);
      }}
      hideHeader
      >
        <div>
          <CreateSessionForm />
        </div>
      </Modal>

      <Modal
        isOpen={openDeleteAlert?.open}
        onClose={() => {
          setOpenDeleteAlert({open: false, data: null});
        }}
        title="Delete Alert"
      >
        <div className='w-[30vw]'>
          <DeleteAlertContent
            content="Are you sure you want to delete this session detail?"
            onDelete={() => deleteSession(openDeleteAlert.data)}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;
