import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import { Footer, Navbar } from "./components";
import { About, Contact, Home, Projects, Admin, Login } from "./pages";

const App = () => {
  return (
    <AuthProvider>
      <main className='bg-slate-300/20'>
          <Router>
            <Navbar />
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='/login' element={<Login />} />
              <Route path='/admin' element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route
                path='/*'
                element={
                  <>
                    <Routes>
                      <Route path='/about' element={<About />} />
                      <Route path='/projects' element={<Projects />} />
                      <Route path='/contact' element={<Contact />} />
                    </Routes>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </Router>
      </main>
    </AuthProvider>
  );
};

export default App;
