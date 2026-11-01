import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { FolderOpen, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  generations_count: number;
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Marketing Campaign 2024',
      description: 'Content for upcoming product launch campaign',
      created_at: '2024-01-15',
      generations_count: 12,
    },
    {
      id: '2',
      name: 'Blog Content Strategy',
      description: 'Weekly blog posts and SEO content',
      created_at: '2024-01-10',
      generations_count: 8,
    },
    {
      id: '3',
      name: 'Social Media Templates',
      description: 'Reusable templates for social media posts',
      created_at: '2024-01-05',
      generations_count: 15,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      created_at: new Date().toISOString().split('T')[0],
      generations_count: 0,
    };

    setProjects([project, ...projects]);
    setNewProject({ name: '', description: '' });
    setShowCreateForm(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
          <p className="text-gray-600">Organize your AI-generated content into projects</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          icon={Plus}
        >
          New Project
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
          <div className="space-y-4">
            <Input
              label="Project Name"
              placeholder="Enter project name..."
              value={newProject.name}
              onChange={(value) => setNewProject({ ...newProject, name: value })}
              required
            />
            <Textarea
              label="Description"
              placeholder="Describe your project..."
              value={newProject.description}
              onChange={(value) => setNewProject({ ...newProject, description: value })}
              rows={3}
            />
            <div className="flex space-x-3">
              <Button onClick={handleCreateProject} disabled={!newProject.name.trim()}>
                Create Project
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} hover className="relative group">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex space-x-1">
                <button className="p-1 text-gray-400 hover:text-primary-600 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteProject(project.id)}
                  className="p-1 text-gray-400 hover:text-error-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                <FolderOpen className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{project.generations_count} generations</span>
              <span>Created {project.created_at}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full">
                Open Project
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">Create your first project to organize your AI-generated content</p>
          <Button onClick={() => setShowCreateForm(true)} icon={Plus}>
            Create Your First Project
          </Button>
        </div>
      )}
    </div>
  );
}