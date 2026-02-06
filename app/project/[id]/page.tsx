'use client'

/**
 * System Design Documentation Agent - Design Canvas
 * Screen 2: Interactive node-based canvas with full editing capabilities
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  FaSave,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMinus,
  FaExpand,
  FaUndo,
  FaRedo,
  FaTh,
  FaServer,
  FaDatabase,
  FaBolt,
  FaStream,
  FaCube,
  FaTimes,
  FaCheck,
  FaTrash,
  FaHistory,
  FaBook,
  FaLink
} from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { callAIAgent } from '@/lib/aiAgent'
import {
  ProjectStorage,
  componentTemplates,
  createNodeFromTemplate,
  exportProjectJSON,
  parseAgentResponse,
  CanvasUtils,
  generateId
} from '@/lib/utils'
import { Project, SystemNode, NodeConnection, ExportFormat, CanvasState, ComponentTemplate } from '@/lib/types'

const AGENT_ID = '69859abce17e33c11eed1ad0' // Design Orchestrator Manager

// Icon mapping
const iconComponents: Record<string, any> = {
  FaServer,
  FaDatabase,
  FaBolt,
  FaStream,
  FaCube
}

export default function DesignCanvas() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // Project State
  const [project, setProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [requirements, setRequirements] = useState('')
  const [audience, setAudience] = useState<'technical' | 'executive' | 'adaptive'>('technical')

  // Canvas State
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNodeId: null,
    isDragging: false,
    showGrid: true,
    showMinimap: false
  })

  // UI State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'scaling' | 'fault-tolerance' | 'connections'>('overview')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')

  // Connection mode
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionSource, setConnectionSource] = useState<string | null>(null)
  const [selectedConnection, setSelectedConnection] = useState<NodeConnection | null>(null)
  const [connectionEditOpen, setConnectionEditOpen] = useState(false)

  // Drag state
  const [draggedNode, setDraggedNode] = useState<SystemNode | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Load project
  useEffect(() => {
    const loadedProject = ProjectStorage.getById(projectId)
    if (!loadedProject) {
      router.push('/')
      return
    }
    setProject(loadedProject)
    setProjectName(loadedProject.name)
    setRequirements(loadedProject.requirements)
    setAudience(loadedProject.audience)
  }, [projectId, router])

  // Save project
  const saveProject = useCallback(() => {
    if (!project) return

    const updatedProject = {
      ...project,
      name: projectName,
      requirements,
      audience
    }
    ProjectStorage.save(updatedProject)
    setProject(updatedProject)
  }, [project, projectName, requirements, audience])

  // Generate system design from AI agent
  const handleGenerateDesign = async () => {
    if (!requirements.trim()) {
      setGenerationError('Please enter system requirements first')
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const message = `Generate a system design architecture for the following requirements.

Requirements: ${requirements}

Audience: ${audience}

Please provide a comprehensive system design with components (nodes) and their connections. Include specifications, scaling strategies, and fault tolerance measures appropriate for a ${audience} audience.`

      const result = await callAIAgent(message, AGENT_ID)

      if (result.success && result.response.status === 'success') {
        // Parse agent response for structured data
        const { nodes, connections } = parseAgentResponse(result.response)

        if (nodes.length > 0) {
          // Update project with generated nodes and connections
          const updatedProject = {
            ...project!,
            nodes,
            connections,
            status: 'completed' as const
          }
          setProject(updatedProject)
          ProjectStorage.save(updatedProject)
        } else {
          // Agent responded but didn't provide structured data
          setGenerationError('Agent response received but no architecture components were generated. Please try refining your requirements.')
        }
      } else {
        setGenerationError(result.error || 'Failed to generate design. Please try again.')
      }
    } catch (error) {
      setGenerationError('An error occurred while generating the design.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Node operations
  const handleNodeClick = (nodeId: string) => {
    // If in connection mode, handle connection creation
    if (connectionMode) {
      if (!connectionSource) {
        // Select source node
        setConnectionSource(nodeId)
      } else if (connectionSource !== nodeId) {
        // Create connection from source to target
        const newConnection: NodeConnection = {
          id: generateId(),
          source: connectionSource,
          target: nodeId,
          type: 'sync',
          label: 'Connection',
          protocol: 'HTTP'
        }
        const updatedProject = {
          ...project!,
          connections: [...project!.connections, newConnection]
        }
        setProject(updatedProject)
        ProjectStorage.save(updatedProject)

        // Reset connection mode
        setConnectionSource(null)
        setConnectionMode(false)
      }
      return
    }

    // Normal click - open right panel
    setCanvasState(prev => ({ ...prev, selectedNodeId: nodeId }))
    setRightPanelOpen(true)
  }

  const handleNodeDragStart = (e: React.MouseEvent, node: SystemNode) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDraggedNode(node)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleNodeDragMove = (e: React.MouseEvent) => {
    if (!draggedNode || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const canvasPos = CanvasUtils.screenToCanvas(
      e.clientX - rect.left - dragOffset.x,
      e.clientY - rect.top - dragOffset.y,
      canvasState.pan,
      canvasState.zoom
    )

    const updatedNodes = project!.nodes.map(n =>
      n.id === draggedNode.id ? { ...n, position: canvasPos } : n
    )

    setProject(prev => prev ? { ...prev, nodes: updatedNodes } : null)
  }

  const handleNodeDragEnd = () => {
    if (draggedNode) {
      saveProject()
      setDraggedNode(null)
    }
  }

  // Canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggedNode) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasState(prev => ({
        ...prev,
        pan: {
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        }
      }))
    } else if (draggedNode) {
      handleNodeDragMove(e)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
    handleNodeDragEnd()
  }

  // Zoom controls
  const handleZoom = (delta: number) => {
    setCanvasState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(2, prev.zoom + delta))
    }))
  }

  const handleFitToView = () => {
    if (!project || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const { zoom, pan } = CanvasUtils.fitToView(project.nodes, rect.width, rect.height)
    setCanvasState(prev => ({ ...prev, zoom, pan }))
  }

  // Template drag and drop
  const handleTemplateDrop = (template: ComponentTemplate, e: React.MouseEvent) => {
    if (!canvasRef.current || !project) return

    const rect = canvasRef.current.getBoundingClientRect()
    const position = CanvasUtils.screenToCanvas(
      e.clientX - rect.left,
      e.clientY - rect.top,
      canvasState.pan,
      canvasState.zoom
    )

    const newNode = createNodeFromTemplate(template, position)
    const updatedProject = {
      ...project,
      nodes: [...project.nodes, newNode]
    }
    setProject(updatedProject)
    ProjectStorage.save(updatedProject)
  }

  // Update selected node
  const updateSelectedNode = (updates: Partial<SystemNode>) => {
    if (!canvasState.selectedNodeId || !project) return

    const updatedNodes = project.nodes.map(n =>
      n.id === canvasState.selectedNodeId ? { ...n, ...updates } : n
    )

    setProject({ ...project, nodes: updatedNodes })
  }

  const applyNodeChanges = () => {
    saveProject()
    setRightPanelOpen(false)
  }

  const deleteSelectedNode = () => {
    if (!canvasState.selectedNodeId || !project) return

    const updatedProject = {
      ...project,
      nodes: project.nodes.filter(n => n.id !== canvasState.selectedNodeId),
      connections: project.connections.filter(
        c => c.source !== canvasState.selectedNodeId && c.target !== canvasState.selectedNodeId
      )
    }

    setProject(updatedProject)
    ProjectStorage.save(updatedProject)
    setRightPanelOpen(false)
    setCanvasState(prev => ({ ...prev, selectedNodeId: null }))
  }

  // Connection operations
  const handleConnectionClick = (connection: NodeConnection) => {
    setSelectedConnection(connection)
    setConnectionEditOpen(true)
  }

  const updateConnection = (updates: Partial<NodeConnection>) => {
    if (!selectedConnection || !project) return

    const updatedConnections = project.connections.map(c =>
      c.id === selectedConnection.id ? { ...c, ...updates } : c
    )

    setProject({ ...project, connections: updatedConnections })
    setSelectedConnection({ ...selectedConnection, ...updates })
  }

  const applyConnectionChanges = () => {
    saveProject()
    setConnectionEditOpen(false)
    setSelectedConnection(null)
  }

  const deleteConnection = () => {
    if (!selectedConnection || !project) return

    const updatedProject = {
      ...project,
      connections: project.connections.filter(c => c.id !== selectedConnection.id)
    }

    setProject(updatedProject)
    ProjectStorage.save(updatedProject)
    setConnectionEditOpen(false)
    setSelectedConnection(null)
  }

  // Export
  const handleExport = () => {
    if (!project) return

    if (exportFormat === 'json') {
      exportProjectJSON(project)
    } else {
      // For PNG/SVG/PDF, would need html2canvas or similar
      alert(`Export to ${exportFormat.toUpperCase()} will be implemented with html2canvas`)
    }

    setExportModalOpen(false)
  }

  const selectedNode = project?.nodes.find(n => n.id === canvasState.selectedNodeId)

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#F5C518] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Bar */}
      <header className="border-b border-[#6B7280] bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-[#6B7280] hover:text-gray-900"
          >
            <FaChevronLeft className="mr-2" />
            Back
          </Button>

          {isEditingName ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false)
                saveProject()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false)
                  saveProject()
                }
              }}
              className="w-64 border-[#F5C518]"
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-[#F5C518]"
              onClick={() => setIsEditingName(true)}
            >
              {projectName}
            </h1>
          )}

          {project.status === 'generating' && (
            <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
              <div className="w-2 h-2 bg-[#F5C518] rounded-full animate-pulse" />
              <span>Generating...</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={saveProject}
            className="border-[#6B7280] text-gray-900"
          >
            <FaSave className="mr-2" />
            Save
          </Button>

          <Button
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900"
          >
            <FaDownload className="mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Collapsible open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
          <div className={`border-r border-[#6B7280] bg-white transition-all ${leftSidebarOpen ? 'w-80' : 'w-0'}`}>
            {leftSidebarOpen && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Requirements Section */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">
                      System Requirements
                    </Label>
                    <Textarea
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Describe your system requirements..."
                      className="min-h-[120px] border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>

                  {/* Audience Selector */}
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">
                      Target Audience
                    </Label>
                    <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                      <SelectTrigger className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="adaptive">Adaptive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateDesign}
                    disabled={isGenerating || !requirements.trim()}
                    className="w-full bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900 font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full mr-2" />
                        Generating Design...
                      </>
                    ) : (
                      <>
                        <FaCube className="mr-2" />
                        Generate System Design
                      </>
                    )}
                  </Button>

                  {generationError && (
                    <div className="p-3 bg-red-50 border border-[#EF4444] rounded text-sm text-[#EF4444]">
                      {generationError}
                    </div>
                  )}

                  {/* Component Library */}
                  <Accordion type="single" collapsible defaultValue="components">
                    <AccordionItem value="components">
                      <AccordionTrigger className="text-sm font-medium text-gray-900">
                        Component Library
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {componentTemplates.map((template) => {
                            const IconComponent = iconComponents[template.icon]
                            return (
                              <div
                                key={template.id}
                                className="p-3 border border-[#6B7280] rounded hover:border-[#F5C518] cursor-move bg-white"
                                draggable
                                onDragEnd={(e) => handleTemplateDrop(template, e as any)}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  {IconComponent && <IconComponent className="text-[#F5C518]" />}
                                  <span className="text-sm font-medium text-gray-900">{template.name}</span>
                                </div>
                                <p className="text-xs text-[#6B7280]">{template.description}</p>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Project History */}
                    <AccordionItem value="history">
                      <AccordionTrigger className="text-sm font-medium text-gray-900">
                        <div className="flex items-center space-x-2">
                          <FaHistory />
                          <span>Version History</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm text-[#6B7280]">
                          {project.versions.length === 0 ? (
                            <p className="text-xs">No versions saved yet</p>
                          ) : (
                            <div className="space-y-2">
                              {project.versions.map((version) => (
                                <div key={version.id} className="p-2 bg-[#F9FAFB] rounded">
                                  <div className="font-medium">Version {version.version}</div>
                                  <div className="text-xs">{new Date(version.timestamp).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            )}
          </div>

          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-[320px] top-20 z-10 bg-white border border-[#6B7280] hover:bg-[#F9FAFB]"
              style={{ left: leftSidebarOpen ? '320px' : '0' }}
            >
              {leftSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {/* Central Canvas */}
        <div className="flex-1 relative overflow-hidden bg-white">
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-move"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              backgroundImage: canvasState.showGrid
                ? 'radial-gradient(circle, #6B7280 1px, transparent 1px)'
                : 'none',
              backgroundSize: `${20 * canvasState.zoom}px ${20 * canvasState.zoom}px`,
              backgroundPosition: `${canvasState.pan.x}px ${canvasState.pan.y}px`
            }}
          >
            {/* Nodes */}
            {project.nodes.map((node) => {
              const screenPos = CanvasUtils.canvasToScreen(
                node.position.x,
                node.position.y,
                canvasState.pan,
                canvasState.zoom
              )
              const IconComponent = iconComponents[node.icon || 'FaCube']
              const isSelected = canvasState.selectedNodeId === node.id
              const isConnectionSource = connectionSource === node.id

              return (
                <div
                  key={node.id}
                  className={`absolute bg-white rounded-lg p-4 shadow-lg border-2 transition-all cursor-pointer ${
                    isSelected ? 'border-[#F5C518]' : isConnectionSource ? 'border-blue-500 ring-2 ring-blue-300' : 'border-[#6B7280] hover:border-[#F5C518]'
                  }`}
                  style={{
                    left: `${screenPos.x}px`,
                    top: `${screenPos.y}px`,
                    width: `${300 * canvasState.zoom}px`,
                    transform: `scale(${canvasState.zoom})`,
                    transformOrigin: 'top left'
                  }}
                  onClick={() => handleNodeClick(node.id)}
                  onMouseDown={(e) => handleNodeDragStart(e, node)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-[#F5C518] rounded-lg flex items-center justify-center flex-shrink-0">
                      {IconComponent && <IconComponent className="text-white text-lg" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{node.name}</h3>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">{node.description}</p>
                      {node.specifications && (
                        <div className="mt-2 text-xs text-[#6B7280]">
                          <div>{node.specifications.technology}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {project.connections.map((conn) => {
                const sourceNode = project.nodes.find(n => n.id === conn.source)
                const targetNode = project.nodes.find(n => n.id === conn.target)
                if (!sourceNode || !targetNode) return null

                const start = CanvasUtils.canvasToScreen(
                  sourceNode.position.x + 150,
                  sourceNode.position.y + 50,
                  canvasState.pan,
                  canvasState.zoom
                )
                const end = CanvasUtils.canvasToScreen(
                  targetNode.position.x + 150,
                  targetNode.position.y + 50,
                  canvasState.pan,
                  canvasState.zoom
                )

                const midX = (start.x + end.x) / 2
                const midY = (start.y + end.y) / 2

                return (
                  <g key={conn.id}>
                    <path
                      d={`M ${start.x} ${start.y} Q ${midX} ${start.y} ${midX} ${midY} T ${end.x} ${end.y}`}
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeDasharray={conn.type === 'async' ? '5,5' : '0'}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                )
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-4 flex flex-col space-y-2 bg-white border border-[#6B7280] rounded-lg p-2 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConnectionMode(!connectionMode)
                setConnectionSource(null)
              }}
              className={`hover:bg-[#F9FAFB] ${connectionMode ? 'bg-[#F5C518] text-gray-900' : ''}`}
              title="Connect nodes"
            >
              <FaLink />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(0.1)}
              className="hover:bg-[#F9FAFB]"
            >
              <FaPlus />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleZoom(-0.1)}
              className="hover:bg-[#F9FAFB]"
            >
              <FaMinus />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToView}
              className="hover:bg-[#F9FAFB]"
            >
              <FaExpand />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              className="hover:bg-[#F9FAFB]"
            >
              <FaTh />
            </Button>
          </div>

          {/* Connection Mode Indicator */}
          {connectionMode && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
              {connectionSource ? 'Click target node to connect' : 'Click source node to start'}
            </div>
          )}
        </div>

        {/* Right Panel */}
        {rightPanelOpen && selectedNode && (
          <div className="w-96 border-l border-[#6B7280] bg-white overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Node Properties</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(false)}
                  className="hover:bg-[#F9FAFB]"
                >
                  <FaTimes />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="specifications" className="text-xs">Specs</TabsTrigger>
                  <TabsTrigger value="scaling" className="text-xs">Scaling</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Name</Label>
                    <Input
                      value={selectedNode.name}
                      onChange={(e) => updateSelectedNode({ name: e.target.value })}
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Description</Label>
                    <Textarea
                      value={selectedNode.description}
                      onChange={(e) => updateSelectedNode({ description: e.target.value })}
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="specifications" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Technology</Label>
                    <Input
                      value={selectedNode.specifications?.technology || ''}
                      onChange={(e) =>
                        updateSelectedNode({
                          specifications: { ...selectedNode.specifications, technology: e.target.value }
                        })
                      }
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Capacity</Label>
                    <Input
                      value={selectedNode.specifications?.capacity || ''}
                      onChange={(e) =>
                        updateSelectedNode({
                          specifications: { ...selectedNode.specifications, capacity: e.target.value }
                        })
                      }
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Latency</Label>
                    <Input
                      value={selectedNode.specifications?.latency || ''}
                      onChange={(e) =>
                        updateSelectedNode({
                          specifications: { ...selectedNode.specifications, latency: e.target.value }
                        })
                      }
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="scaling" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-2 block">Scaling Details</Label>
                    <Textarea
                      value={selectedNode.scaling?.details || ''}
                      onChange={(e) =>
                        updateSelectedNode({
                          scaling: { ...selectedNode.scaling, details: e.target.value }
                        })
                      }
                      className="border-[#6B7280] focus:border-[#F5C518] focus:ring-[#F5C518]"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex space-x-2">
                <Button
                  onClick={applyNodeChanges}
                  className="flex-1 bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900"
                >
                  <FaCheck className="mr-2" />
                  Apply Changes
                </Button>
                <Button
                  variant="ghost"
                  onClick={deleteSelectedNode}
                  className="text-[#EF4444] hover:bg-red-50"
                >
                  <FaTrash />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-3 block">Format</Label>
              <div className="flex space-x-2">
                {(['png', 'svg', 'pdf', 'json'] as ExportFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      exportFormat === format
                        ? 'bg-[#F5C518] text-gray-900'
                        : 'bg-[#F9FAFB] text-[#6B7280] hover:bg-gray-200'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                className="flex-1 bg-[#F5C518] hover:bg-[#F5C518]/90 text-gray-900"
              >
                <FaDownload className="mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                onClick={() => setExportModalOpen(false)}
                className="text-[#6B7280]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
