import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({}); // Stores reply text keyed by message ID
  const [replyingTo, setReplyingTo] = useState(null); // Stores ID of message currently being replied to
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${id}/read`, {
        method: "PUT",
      });
      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this message?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          fetchMessages();
          alert("Message deleted successfully!");
        }
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const handleSendReply = async (e, id) => {
    e.preventDefault();
    const text = replyText[id];
    if (!text || !text.trim()) {
      alert("Please enter a reply message!");
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: text,
          subject: "Response from Portfolio Admin",
        }),
      });

      if (response.ok) {
        setReplyText({ ...replyText, [id]: "" });
        setReplyingTo(null);
        fetchMessages();
        alert("Reply email sent successfully and saved to thread!");
      } else {
        throw new Error("Failed to send reply");
      }
    } catch (error) {
      console.error("Error replying to message:", error);
      alert("Failed to send email reply. Check nodemailer config.");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) return <div className='p-4'>Loading contact messages...</div>;

  return (
    <div className='p-4'>
      <h2 className='text-2xl font-semibold mb-6 flex items-center justify-between'>
        <span className='blue-gradient_text drop-shadow'>Contact Messages</span>
        <span className='text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full'>
          Total: {messages.length} ({messages.filter((m) => !m.isRead).length} Unread)
        </span>
      </h2>

      {messages.length === 0 ? (
        <p className='text-slate-500'>No messages found.</p>
      ) : (
        <div className='grid gap-6'>
          {messages.map((msg) => {
            const msgId = msg._id || msg.id;
            return (
              <div
                key={msgId}
                className={`p-6 rounded-xl shadow-md border transition-all ${
                  msg.isRead 
                    ? "bg-white border-slate-100 opacity-90" 
                    : "bg-blue-50/30 border-blue-100 shadow-blue-50/50"
                }`}
              >
                <div className='flex flex-wrap justify-between items-start mb-4 gap-4'>
                  <div>
                    <h3 className='font-bold text-lg text-black-500 flex items-center gap-2'>
                      {msg.name}
                      {!msg.isRead && (
                        <span className='w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse' title='New Message' />
                      )}
                    </h3>
                    <a href={`mailto:${msg.email}`} className='text-blue-500 hover:underline text-sm font-medium'>
                      {msg.email}
                    </a>
                  </div>
                  <div className='text-xs text-slate-400 font-medium'>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "Unknown Date"}
                  </div>
                </div>

                {/* Message Content */}
                <div className='bg-slate-50 p-4 rounded-lg text-slate-700 whitespace-pre-wrap font-medium border border-slate-100'>
                  {msg.message}
                </div>

                {/* Attachments Section */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className='mt-4'>
                    <span className='text-xs font-semibold text-slate-500 block mb-2'>📎 ATTACHMENTS:</span>
                    <div className='flex flex-wrap gap-2'>
                      {msg.attachments.map((att, idx) => {
                        // Map server path to local API endpoint path
                        const fileUrl = `${API_BASE_URL}/api/uploads/${att.path.split(/[\\/]/).pop()}`;
                        return (
                          <a
                            key={idx}
                            href={fileUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='bg-white border hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1 shadow-sm transition-colors'
                          >
                            📄 {att.filename}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Replies History */}
                {msg.replies && msg.replies.length > 0 && (
                  <div className='mt-4 bg-slate-100/50 p-4 rounded-lg border border-slate-200/50'>
                    <span className='text-xs font-semibold text-slate-500 block mb-2'>💬 REPLY HISTORY:</span>
                    <div className='space-y-3'>
                      {msg.replies.map((rep, idx) => (
                        <div key={idx} className='bg-white p-3 rounded-lg border text-sm text-slate-700 font-medium'>
                          <div className='text-slate-400 text-[10px] mb-1'>
                            Replied on {new Date(rep.repliedAt).toLocaleString()}
                          </div>
                          {rep.body}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='mt-4 flex flex-wrap gap-2 justify-between items-center border-t pt-4 pointer-events-auto'>
                  <div className='flex gap-2'>
                    {!msg.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(msgId)}
                        className='bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-blue-100'
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => setReplyingTo(replyingTo === msgId ? null : msgId)}
                      className='bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border'
                    >
                      {replyingTo === msgId ? "Cancel Reply" : "Reply via Email"}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(msgId)}
                    className='bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-red-100 ml-auto'
                  >
                    Delete Message
                  </button>
                </div>

                {/* Reply Form */}
                {replyingTo === msgId && (
                  <form
                    onSubmit={(e) => handleSendReply(e, msgId)}
                    className='mt-4 border-t pt-4 flex flex-col gap-3 pointer-events-auto'
                  >
                    <label className='text-xs font-semibold text-slate-600'>Send email response to user:</label>
                    <textarea
                      rows='3'
                      placeholder='Type your email reply here...'
                      className='w-full p-3 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium'
                      required
                      value={replyText[msgId] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [msgId]: e.target.value })}
                    />
                    <button
                      type='submit'
                      disabled={submittingReply}
                      className='bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors ml-auto shadow-sm'
                    >
                      {submittingReply ? "Sending Email..." : "Send Response"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
