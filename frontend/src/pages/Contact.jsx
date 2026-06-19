import { Canvas } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";

import { Fox } from "../models";
import useAlert from "../hooks/useAlert";
import { Alert, Loader } from "../components";
import { API_BASE_URL } from "../config";

const Contact = () => {
  const formRef = useRef();
  const [activeTab, setActiveTab] = useState("message"); // "message" or "meeting"
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    subject: "Portfolio Project Discussion",
    date: "",
    time: "",
  });
  const [files, setFiles] = useState([]);
  const { alert, showAlert, hideAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState("idle");

  const handleChange = ({ target: { name, value } }) => {
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleFocus = () => setCurrentAnimation("walk");
  const handleBlur = () => setCurrentAnimation("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCurrentAnimation("hit");

    try {
      if (activeTab === "message") {
        // 1. Send Message with optional attachments to Node.js backend
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("email", form.email);
        formData.append("message", form.message);
        
        files.forEach((file) => {
          formData.append("attachments", file);
        });

        const response = await fetch(`${API_BASE_URL}/api/messages`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to send message");

        showAlert({
          show: true,
          text: "Thank you for your message 😃",
          type: "success",
        });
      } else {
        // 2. Schedule Video Call / Meeting
        const response = await fetch(`${API_BASE_URL}/api/meetings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            subject: form.subject,
            date: form.date,
            time: form.time,
          }),
        });

        if (!response.ok) throw new Error("Failed to schedule meeting");

        const data = await response.json();

        showAlert({
          show: true,
          text: `Meeting confirmed! Meet Link: ${data.meeting.meetLink} 📹 Check your email.`,
          type: "success",
        });
      }

      setLoading(false);
      setFiles([]);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      setTimeout(() => {
        hideAlert(false);
        setCurrentAnimation("idle");
        setForm({
          name: "",
          email: "",
          message: "",
          subject: "Portfolio Project Discussion",
          date: "",
          time: "",
        });
      }, 3000);

    } catch (error) {
      setLoading(false);
      console.error(error);
      setCurrentAnimation("idle");

      showAlert({
        show: true,
        text: activeTab === "message" 
          ? "I didn't receive your message 😢" 
          : "Failed to schedule meeting 😢",
        type: "danger",
      });
    }
  };

  return (
    <section className='relative flex lg:flex-row flex-col max-container'>
      {alert.show && <Alert {...alert} />}

      <div className='flex-1 min-w-[50%] flex flex-col'>
        <h1 className='head-text'>Get in Touch</h1>

        {/* Tab Buttons */}
        <div className='flex gap-4 mt-6 mb-2'>
          <button
            onClick={() => setActiveTab("message")}
            type='button'
            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
              activeTab === "message"
                ? "bg-blue-600 text-white shadow-md transform scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            💬 Send Message
          </button>
          <button
            onClick={() => setActiveTab("meeting")}
            type='button'
            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
              activeTab === "meeting"
                ? "bg-blue-600 text-white shadow-md transform scale-105"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📹 Book Video Call
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className='w-full flex flex-col gap-6 mt-6'
        >
          <label className='text-black-500 font-semibold'>
            Name
            <input
              type='text'
              name='name'
              className='input'
              placeholder='John'
              required
              value={form.name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label className='text-black-500 font-semibold'>
            Email
            <input
              type='email'
              name='email'
              className='input'
              placeholder='john@gmail.com'
              required
              value={form.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>

          {activeTab === "message" ? (
            <>
              <label className='text-black-500 font-semibold'>
                Your Message
                <textarea
                  name='message'
                  rows='4'
                  className='textarea'
                  placeholder='Write your thoughts here...'
                  required
                  value={form.message}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </label>
              <label className='text-black-500 font-semibold'>
                Attachments (Images / Files)
                <input
                  type='file'
                  name='attachments'
                  multiple
                  onChange={handleFileChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className='input bg-white pt-2.5 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer'
                />
              </label>
            </>
          ) : (
            <>
              <label className='text-black-500 font-semibold'>
                Subject
                <input
                  type='text'
                  name='subject'
                  className='input'
                  placeholder='Discussion Topic'
                  value={form.subject}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <label className='text-black-500 font-semibold'>
                  Meeting Date
                  <input
                    type='date'
                    name='date'
                    className='input'
                    required
                    value={form.date}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </label>
                <label className='text-black-500 font-semibold'>
                  Preferred Time
                  <input
                    type='time'
                    name='time'
                    className='input'
                    required
                    value={form.time}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </label>
              </div>
            </>
          )}

          <button
            type='submit'
            disabled={loading}
            className='btn'
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {loading ? (activeTab === "message" ? "Sending..." : "Booking...") : "Submit"}
          </button>
        </form>
      </div>

      <div className='lg:w-1/2 w-full lg:h-auto md:h-[550px] h-[350px]'>
        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 75,
            near: 0.1,
            far: 1000,
          }}
        >
          <directionalLight position={[0, 0, 1]} intensity={2.5} />
          <ambientLight intensity={1} />
          <pointLight position={[5, 10, 0]} intensity={2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={2}
          />

          <Suspense fallback={<Loader />}>
            <Fox
              currentAnimation={currentAnimation}
              position={[0.5, 0.35, 0]}
              rotation={[12.629, -0.6, 0]}
              scale={[0.5, 0.5, 0.5]}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
};

export default Contact;
