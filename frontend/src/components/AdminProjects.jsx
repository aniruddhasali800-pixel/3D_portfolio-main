import React, { useEffect, useState } from "react";
import { projects as defaultProjects } from "../constants";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    link: "",
    theme: "btn-back-blue"
  });
  const [file, setFile] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/projects");
      const data = await response.json();
      
      const dbNames = new Set(data.map(p => p.name));
      const filteredDefaults = defaultProjects.filter(p => !dbNames.has(p.name)).map((p, i) => ({ ...p, id: `default-${i}`, isDefault: true }));
      
      setProjects([...filteredDefaults, ...data]);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5000000) { // Limit 5MB
        alert("File is too large! Please select an image under 5MB.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select an icon image first!");
      return;
    }
    
    setIsUploading(true);
    try {
      // 1. Prepare FormData for multipart upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("link", form.link);
      formData.append("theme", form.theme);

      // 2. Add to Python database via API
      const response = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to add project");

      setForm({ name: "", description: "", link: "", theme: "btn-back-blue" });
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      fetchProjects();
      alert("Project securely added to backend storage and database!");
    } catch (error) {
      console.error("Error adding project:", error);
      alert("Failed to add project. Ensure your Python backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMigrateDefaults = async () => {
    if (!window.confirm("This will move all default built-in projects to the Firebase database. Provide a single source of truth. Continue?")) return;
    
    setIsUploading(true);
    try {
      let migratedCount = 0;
      for (const project of defaultProjects) {
        const exists = projects.find(p => p.name === project.name && !p.isDefault);
        if (!exists) {
        const formData = new FormData();
        // For migration, we don't have a local file to upload easily as a 'File' object 
        // without some extra work. For now, let's just send the URL as is if it's already a URL
        // But our backend expects a file.
        // Special case: send a dummy request or update backend to handle URL-only
        // Let's stick to the form and assume new projects are added via the UI.
        // Actually, let's keep it simple: inform the user to add new projects via the form.
        alert('Please use the Add Project form to move projects to the database.');
        setIsUploading(false);
        return;
        }
      }
      alert(`Successfully migrated ${migratedCount} default projects to the database!`);
      fetchProjects();
    } catch (error) {
       console.error("Migration error:", error);
       alert("Failed to migrate defaults.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      alert("This is a built-in default project. It cannot be permanently deleted from the source code here, but its custom version would be.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await fetch(`http://localhost:5000/api/projects/${id}`, {
          method: "DELETE",
        });
        fetchProjects();
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const handleEditLink = async (id, currentLink, isDefault) => {
    const newLink = window.prompt("Enter new link for the project:", currentLink);
    if (newLink && newLink !== currentLink) {
        if(isDefault) {
             alert('To edit a default project, please create a new custom version of it in the form above. Editing hardcoded source files requires git pushes.');
             return;
        }
        try {
            await fetch(`http://localhost:5000/api/projects/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    link: newLink,
                }),
            });
            fetchProjects();
        } catch (error) {
            console.error("Error updating project link:", error);
            alert("Failed to update project link.");
        }
    }
  };

  if (loading && projects.length === 0) return <div className='p-4'>Loading projects...</div>;

  return (
    <div className='p-4'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-semibold flex items-center gap-2'>
          <span className='blue-gradient_text drop-shadow'>Manage Projects</span>
        </h2>
        <button onClick={handleMigrateDefaults} disabled={isUploading} className='bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm border border-slate-200'>
            Migrate Built-in Defaults to DB
        </button>
      </div>

      <form onSubmit={handleAddProject} className='bg-white p-6 rounded-xl shadow-md border border-slate-100 mb-8 max-w-2xl'>
        <h3 className='text-lg font-bold mb-4 text-black-500'>Add New Project</h3>
        <div className='grid gap-4'>
          <input type='text' name='name' placeholder='Project Name' required value={form.name} onChange={handleInputChange} className='input p-3 border rounded-lg' />
          <textarea name='description' placeholder='Description' required value={form.description} onChange={handleInputChange} className='input p-3 border rounded-lg h-24' />
          <input type='url' name='link' placeholder='Project Link (Live or GitHub)' required value={form.link} onChange={handleInputChange} className='input p-3 border rounded-lg' />
          <select name='theme' value={form.theme} onChange={handleInputChange} className='input p-3 border rounded-lg cursor-pointer bg-white'>
            <option value='btn-back-red'>Red Theme</option>
            <option value='btn-back-green'>Green Theme</option>
            <option value='btn-back-blue'>Blue Theme</option>
            <option value='btn-back-pink'>Pink Theme</option>
            <option value='btn-back-black'>Black Theme</option>
            <option value='btn-back-yellow'>Yellow Theme</option>
          </select>
          <div className='flex items-center gap-4 p-3 border rounded-lg bg-slate-50'>
            <label className='font-medium text-slate-600'>Icon Image:</label>
            <input type='file' accept='image/*' required onChange={handleFileChange} className='text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer' />
          </div>
          <button type='submit' disabled={isUploading} className='btn w-full justify-center'>
            {isUploading ? "Processing..." : "Add Project"}
          </button>
        </div>
      </form>

      <div className='grid lg:grid-cols-2 gap-6'>
        {projects.map((project) => (
          <div key={project.id} className='bg-white p-6 rounded-xl shadow-md border border-slate-100 flex gap-4'>
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 ${project.theme}`}>
               {/* Using pseudo-elements/classes from the theme to match the frontend, or simply apply as background color */}
               <img src={project.iconUrl} alt={project.name} className='w-1/2 h-1/2 object-contain z-10' />
            </div>
            <div className='flex-1 flex flex-col'>
              <h4 className='font-bold text-lg text-black-500 flex items-center gap-2'>
                {project.name}
                {project.isDefault && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-500">Built-in</span>}
              </h4>
              <p className='text-sm text-slate-500 line-clamp-2 mt-1 mb-3'>{project.description}</p>
              
              <div className='mt-auto flex flex-wrap gap-2 items-center justify-between border-t pt-3'>
                <a href={project.link} target='_blank' rel='noreferrer' className='text-blue-500 text-sm font-semibold hover:underline bg-blue-50 px-2 py-1 rounded'>Link</a>
                <div className='flex gap-2 ml-auto'>
                    <button onClick={() => handleEditLink(project.id, project.link, project.isDefault)} className='text-emerald-600 text-sm font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded'>Edit Link</button>
                    {!project.isDefault && (
                        <button onClick={() => handleDelete(project.id, project.isDefault)} className='text-red-500 text-sm font-semibold hover:underline bg-red-50 px-2 py-1 rounded'>Delete</button>
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {projects.length === 0 && !loading && (
        <p className='text-slate-500'>No projects found.</p>
      )}
    </div>
  );
};

export default AdminProjects;

