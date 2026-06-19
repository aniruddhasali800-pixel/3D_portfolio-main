import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const AdminMeetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings`);
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCancelMeeting = async (id) => {
    if (window.confirm("Are you sure you want to cancel this meeting? This will delete the scheduled slot.")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchMeetings();
          alert("Meeting cancelled successfully!");
        } else {
          throw new Error("Failed to cancel meeting");
        }
      } catch (error) {
        console.error("Error cancelling meeting:", error);
        alert("Failed to cancel meeting.");
      }
    }
  };

  const handleReschedule = async (id, currentDate, currentTime) => {
    const newDate = window.prompt("Enter new date (YYYY-MM-DD):", currentDate);
    if (!newDate) return;
    const newTime = window.prompt("Enter new time (HH:MM):", currentTime);
    if (!newTime) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
        }),
      });

      if (response.ok) {
        fetchMeetings();
        alert("Meeting rescheduled successfully!");
      } else {
        throw new Error("Failed to reschedule");
      }
    } catch (error) {
      console.error("Error rescheduling meeting:", error);
      alert("Failed to reschedule meeting.");
    }
  };

  if (loading) return <div className='p-4'>Loading scheduled meetings...</div>;

  return (
    <div className='p-4'>
      <h2 className='text-2xl font-semibold mb-6 flex items-center gap-2'>
        <span className='blue-gradient_text drop-shadow'>Scheduled Meetings / Video Calls</span>
      </h2>

      {meetings.length === 0 ? (
        <p className='text-slate-500'>No meetings scheduled yet.</p>
      ) : (
        <div className='grid gap-6'>
          {meetings.map((meeting) => (
            <div key={meeting._id} className='bg-white p-6 rounded-xl shadow-md border border-slate-100'>
              <div className='flex flex-wrap justify-between items-start mb-4 gap-4'>
                <div>
                  <h3 className='font-bold text-lg text-black-500'>{meeting.name}</h3>
                  <a href={`mailto:${meeting.email}`} className='text-blue-500 hover:underline text-sm font-medium'>
                    {meeting.email}
                  </a>
                </div>
                <div className='text-right'>
                  <div className='text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full inline-block'>
                    📅 {meeting.date} at 🕒 {meeting.time}
                  </div>
                </div>
              </div>

              <div className='bg-slate-50 p-4 rounded-lg text-slate-700 mb-4'>
                <span className='font-semibold text-slate-500 block text-xs uppercase tracking-wider mb-1'>Topic / Subject</span>
                <span className='font-medium text-black-500'>{meeting.subject}</span>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-4 border-t pt-4'>
                <a
                  href={meeting.meetLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm pointer-events-auto'
                >
                  📹 Join Google Meet
                </a>

                <div className='flex gap-2 ml-auto pointer-events-auto'>
                  <button
                    onClick={() => handleReschedule(meeting._id, meeting.date, meeting.time)}
                    className='bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border'
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleCancelMeeting(meeting._id)}
                    className='bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-red-100'
                  >
                    Cancel Meeting
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMeetings;
