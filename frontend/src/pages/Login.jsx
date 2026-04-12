import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import useAlert from "../hooks/useAlert";
import { Alert } from "../components";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();
  const navigate = useNavigate();
  const { loginDemo } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email === "admin@gmail.com" && password === "123") {
        loginDemo();
        showAlert({
          show: true,
          text: "Logged in successfully (Demo)!",
          type: "success",
        });
        setTimeout(() => {
          navigate("/admin");
        }, 1500);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showAlert({
          show: true,
          text: "Logged in successfully!",
          type: "success",
        });
        setTimeout(() => {
          navigate("/admin");
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      showAlert({
        show: true,
        text: "Failed to log in. Please check your credentials.",
        type: "danger",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        hideAlert(false);
      }, 3000);
    }
  };

  return (
    <section className='relative flex flex-col max-container'>
      {alert.show && <Alert {...alert} />}

      <div className='flex-1 min-w-[50%] flex flex-col justify-center items-center'>
        <h1 className='head-text'>Admin Login</h1>

        <form
          onSubmit={handleLogin}
          className='w-full max-w-md flex flex-col gap-7 mt-14 bg-white p-8 rounded-xl shadow-lg'
        >
          <label className='text-black-500 font-semibold'>
            Email
            <input
              type='email'
              name='email'
              className='input'
              placeholder='admin@example.com'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className='text-black-500 font-semibold'>
            Password
            <input
              type='password'
              name='password'
              className='input'
              placeholder='******'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button type='submit' disabled={loading} className='btn'>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
