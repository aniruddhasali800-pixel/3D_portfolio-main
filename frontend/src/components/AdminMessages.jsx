import React, { useEffect, useState } from "react";


const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/messages");
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  if (loading) return <div className='p-4'>Loading messages...</div>;

  return (
    <div className='p-4'>
      <h2 className='text-2xl font-semibold mb-6 flex items-center gap-2'>
        <span className='blue-gradient_text drop-shadow'>Contact Messages</span>
      </h2>
      
      {messages.length === 0 ? (
        <p className='text-slate-500'>No messages found.</p>
      ) : (
        <div className='grid gap-6'>
          {messages.map((msg) => (
            <div key={msg.id} className='bg-white p-6 rounded-xl shadow-md border border-slate-100'>
              <div className='flex justify-between items-start mb-4'>
                <div>
                  <h3 className='font-bold text-lg text-black-500'>{msg.name}</h3>
                  <a href={`mailto:${msg.email}`} className='text-blue-500 hover:underline text-sm font-medium'>
                    {msg.email}
                  </a>
                </div>
                <div className='text-xs text-slate-400 font-medium'>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Unknown Date'}
                </div>
              </div>
              <div className='bg-slate-50 p-4 rounded-lg text-slate-700 whitespace-pre-wrap font-medium'>
                {msg.message}
              </div>
              <div className='mt-4 flex justify-end'>
                 <a 
                   href={`mailto:${msg.email}?subject=Reply from Portfolio`}
                   className='btn-back-blue px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 shadow-sm'
                 >
                   Reply via Email
                 </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
