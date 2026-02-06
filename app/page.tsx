'use client'

/**
 * System Design Documentation Agent - Dashboard
 * Screen 1: Project Dashboard with grid of project cards
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaPlus, FaSearch, FaClock, FaFolder } from 'react-icons/fa'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProjectStorage, formatDate } from '@/lib/utils'
import { Project } from '@/lib/types'

export default function Dashboard() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  // Load projects from localStorage
  useEffect(() => {
    const loadedProjects = ProjectStorage.getAll()
    setProjects(loadedProjects)
    setFilteredProjects(loadedProjects)
  }, [])

  // Filter projects based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects)
    } else {
      const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.requirements.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredProjects(filtered)
    }
  }, [searchQuery, projects])

  const handleCreateProject = () => {
    const project = ProjectStorage.create('Untitled Project')
    router.push(`/project/${project.id}`)
  }

  const handleOpenProject = (projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#6B7280] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#F5C518] rounded-lg flex items-center justify-center">
              <FaFolder className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Design Studio</h1>
              <p className="text-sm text-[#6B7280]">Create and manage architecture documentation</p>
            </div>
          </div>
          <Button
            onClick={handleCreateProject}
            className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900 font-medium"
          >
            <FaPlus className="mr-2" />
            New Project
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 && projects.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-[#F9FAFB] rounded-full flex items-center justify-center mb-6">
              <FaFolder className="text-[#6B7280] text-4xl" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No projects yet</h2>
            <p className="text-[#6B7280] mb-6">Create your first system design documentation project</p>
            <Button
              onClick={handleCreateProject}
              className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900 font-medium"
            >
              <FaPlus className="mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          // No Search Results
          <div className="flex flex-col items-center justify-center py-20">
            <FaSearch className="text-[#6B7280] text-4xl mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h2>
            <p className="text-[#6B7280]">Try adjusting your search query</p>
          </div>
        ) : (
          // Project Cards Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="border-[#6B7280] hover:border-[#F5C518] hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => handleOpenProject(project.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#F5C518] transition-colors mb-1">
                        {project.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
                        <FaClock className="text-xs" />
                        <span>{formatDate(project.updated_at)}</span>
                      </div>
                    </div>
                    {project.status === 'generating' && (
                      <div className="w-2 h-2 bg-[#F5C518] rounded-full animate-pulse" />
                    )}
                  </div>

                  {project.requirements && (
                    <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">
                      {project.requirements}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <div className="flex items-center space-x-4">
                      <span>{project.nodes.length} components</span>
                      <span>{project.connections.length} connections</span>
                    </div>
                    <span className="capitalize px-2 py-1 bg-[#F9FAFB] rounded">
                      {project.audience}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
