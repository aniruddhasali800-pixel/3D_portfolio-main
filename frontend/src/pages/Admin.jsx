import React, { useState, Suspense } from "react";
import { AdminMessages, AdminProjects } from "../components";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { Canvas } from "@react-three/fiber";
import { Sky, Island } from "../models";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const { logoutDemo } = useAuth();

  const handleLogout = async () => {
    try {
      logoutDemo();
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <section className='w-full min-h-screen relative overflow-hidden'>
      {/* 3D Looping Background */}
      <div className='absolute inset-0 z-0 bg-slate-300'>
        <Canvas
          className='w-full h-full cursor-grab'
          camera={{ near: 0.1, far: 1000 }}
        >
          <Suspense fallback={null}>
            <directionalLight position={[1, 1, 1]} intensity={2} />
            <ambientLight intensity={0.5} />
            <hemisphereLight skyColor='#b1e1ff' groundColor='#000000' intensity={1} />
            <Sky isRotating={true} />
            <Island
              isRotating={true}
              setIsRotating={() => {}} // dummy
              setCurrentStage={() => {}}
              position={[0, -6.5, -43.4]}
              rotation={[0.1, 4.7077, 0]}
              scale={[1, 1, 1]}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Glassmorphism Admin Content */}
      <div className='relative z-10 max-container pt-24 min-h-screen flex flex-col pointer-events-none'>
        <div className='bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-2xl flex-1 mb-8 pointer-events-auto overflow-hidden flex flex-col'>
          <div className='flex justify-between items-center mb-8 border-b border-white/50 pb-4'>
            <h1 className='head-text'>
              Admin <span className='blue-gradient_text drop-shadow'>Dashboard</span>
            </h1>
            <button onClick={handleLogout} className='btn-back-red px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90 shadow-sm'>
              Logout
            </button>
          </div>

          <div className='flex gap-4 mb-2'>
            <button
              onClick={() => setActiveTab("projects")}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                activeTab === "projects" ? "bg-blue-500 text-white shadow-md" : "bg-white/60 text-slate-600 hover:bg-white/80"
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-6 py-2 rounded-full font-semibold transition-colors ${
                activeTab === "messages" ? "bg-blue-500 text-white shadow-md" : "bg-white/60 text-slate-600 hover:bg-white/80"
              }`}
            >
              Messages
            </button>
          </div>

          <div className='flex-1 overflow-y-auto overflow-x-hidden pr-2 rounded-2xl'>
            <div className='bg-white/70 backdrop-blur-sm rounded-2xl mt-4'>
              {activeTab === "messages" ? <AdminMessages /> : <AdminProjects />}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Admin;
