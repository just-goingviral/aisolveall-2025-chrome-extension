/**
 * Aisolveall Assistant - Project Manager
 * 
 * This module handles project-related operations.
 */

const ProjectManager = {
    /**
     * Load existing projects from storage
     */
    loadProjects: function() {
      chrome.storage.local.get({ projects: [] }, (result) => {
        const projects = result.projects;
        const projectSelect = document.getElementById("projectSelect");
        
        if (!projectSelect) {
          console.error("Project select element not found");
          return;
        }
        
        projectSelect.innerHTML = "";
        
        projects.forEach(proj => {
          const opt = document.createElement("option");
          opt.value = proj.id;
          opt.textContent = proj.name;
          projectSelect.appendChild(opt);
        });
        
        if (projects.length > 0) {
          AisolveallApp.state.activeProject = projects[0].id;
          projectSelect.value = AisolveallApp.state.activeProject;
        }
      });
    },
    
    /**
     * Create a new project
     * @param {string} name - The project name
     */
    createNewProject: function(name) {
      const newProject = {
        id: "proj-" + Date.now(),
        name: name,
        chatHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      chrome.storage.local.get({ projects: [] }, (result) => {
        const projects = result.projects;
        projects.push(newProject);
        
        chrome.storage.local.set({ projects: projects }, () => {
          console.log("New project created:", newProject);
          AisolveallApp.state.activeProject = newProject.id;
          this.loadProjects();
        });
      });
    },
    
    /**
     * Get context from project history
     * @param {string} projectId - The project ID
     * @returns {Promise<string>} The context text
     */
    getProjectContext: function(projectId) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          const projects = result.projects;
          const project = projects.find(p => p.id === projectId);
          
          if (project && project.chatHistory && project.chatHistory.length > 0) {
            const context = project.chatHistory.map(item => {
              return `Prompt: ${item.prompt}\nResponse: ${item.response}`;
            }).join("\n\n");
            
            resolve(context);
          } else {
            resolve("");
          }
        });
      });
    },
    
    /**
     * Append chat history to a project
     * @param {string} projectId - The project ID
     * @param {string} prompt - The prompt text
     * @param {string} response - The response text
     */
    appendProjectHistory: function(projectId, prompt, response) {
      chrome.storage.local.get({ projects: [] }, (result) => {
        const projects = result.projects;
        const index = projects.findIndex(p => p.id === projectId);
        
        if (index !== -1) {
          projects[index].chatHistory.push({ 
            prompt, 
            response, 
            timestamp: new Date().toLocaleString() 
          });
          
          // Update the project's updatedAt timestamp
          projects[index].updatedAt = new Date().toISOString();
          
          chrome.storage.local.set({ projects: projects }, () => {
            console.log("Project history updated for project", projectId);
          });
        }
      });
    },
    
    /**
     * Delete a project
     * @param {string} projectId - The project ID
     * @returns {Promise<boolean>} Success status
     */
    deleteProject: function(projectId) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          const projects = result.projects;
          const newProjects = projects.filter(p => p.id !== projectId);
          
          chrome.storage.local.set({ projects: newProjects }, () => {
            console.log("Project deleted:", projectId);
            this.loadProjects();
            resolve(true);
          });
        });
      });
    },
    
    /**
     * Clear project history
     * @param {string} projectId - The project ID
     * @returns {Promise<boolean>} Success status
     */
    clearProjectHistory: function(projectId) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          const projects = result.projects;
          const index = projects.findIndex(p => p.id === projectId);
          
          if (index !== -1) {
            projects[index].chatHistory = [];
            projects[index].updatedAt = new Date().toISOString();
            
            chrome.storage.local.set({ projects: projects }, () => {
              console.log("Project history cleared for project", projectId);
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      });
    },
    
    /**
     * Rename a project
     * @param {string} projectId - The project ID
     * @param {string} newName - The new name
     * @returns {Promise<boolean>} Success status
     */
    renameProject: function(projectId, newName) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          const projects = result.projects;
          const index = projects.findIndex(p => p.id === projectId);
          
          if (index !== -1) {
            projects[index].name = newName;
            projects[index].updatedAt = new Date().toISOString();
            
            chrome.storage.local.set({ projects: projects }, () => {
              console.log("Project renamed:", projectId, newName);
              this.loadProjects();
              resolve(true);
            });
          } else {
            resolve(false);
          }
        });
      });
    },
    
    /**
     * Export a project as JSON
     * @param {string} projectId - The project ID
     * @returns {Promise<Object>} Project data
     */
    exportProject: function(projectId) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          const projects = result.projects;
          const project = projects.find(p => p.id === projectId);
          
          if (project) {
            resolve(project);
          } else {
            reject(new Error("Project not found"));
          }
        });
      });
    },
    
    /**
     * Get all projects
     * @returns {Promise<Array>} Array of projects
     */
    getAllProjects: function() {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get({ projects: [] }, (result) => {
          resolve(result.projects);
        });
      });
    }
  };