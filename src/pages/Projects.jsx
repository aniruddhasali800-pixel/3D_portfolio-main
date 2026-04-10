import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";


import { CTA } from "../components";
import { arrow } from "../assets/icons";
import { projects as defaultProjects } from "../constants";

const Projects = () => {
  const [projectsData, setProjectsData] = useState([...defaultProjects]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/projects");
        const data = await response.json();
        
        // Merge default projects mapped to have IDs with firestore projects to prevent duplicates if imported
        const dbNames = new Set(data.map(p => p.name));
        const filteredDefaults = defaultProjects.filter(p => !dbNames.has(p.name)).map((p, i) => ({ ...p, id: `default-${i}` }));
        
        setProjectsData([...filteredDefaults, ...data]);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <section className='max-container'>
      <h1 className='head-text'>
        My{"Aniruddha "}
        <span className='blue-gradient_text drop-shadow font-semibold'>
          Projects
        </span>
      </h1>

      <p className='text-slate-500 mt-2 leading-relaxed'>
        I've embarked on numerous projects throughout the years, but these are
        the ones I hold closest to my heart. Many of them are open-source, so if
        you come across something that piques your interest, feel free to
        explore the codebase and contribute your ideas for further enhancements.
        Your collaboration is highly valued!
      </p>

      {projectsData.length === 0 && loading ? (
        <div className='my-20 text-center text-slate-500'>Loading projects...</div>
      ) : (
        <div className='flex flex-wrap my-20 gap-16'>
          {projectsData.map((project) => (
            <div className='lg:w-[400px] w-full' key={project.name || project.id}>
              <div className='block-container w-12 h-12'>
                <div className={`btn-back rounded-xl ${project.theme}`} />
                <div className='btn-front rounded-xl flex justify-center items-center overflow-hidden'>
                  <img
                    src={project.iconUrl}
                    alt={project.name}
                    className='w-1/2 h-1/2 object-contain'
                  />
                </div>
              </div>

              <div className='mt-5 flex flex-col'>
                <h4 className='text-2xl font-poppins font-semibold'>
                  {project.name}
                </h4>
                <p className='mt-2 text-slate-500'>{project.description}</p>
                <div className='mt-5 flex items-center gap-2 font-poppins'>
                  <Link
                    to={project.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-semibold text-blue-600'
                  >
                    Live Link
                  </Link>
                  <img
                    src={arrow}
                    alt='arrow'
                    className='w-4 h-4 object-contain'
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className='border-slate-200' />

      <CTA />
    </section>
  );
};

export default Projects;
