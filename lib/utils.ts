import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Project, SystemNode, NodeConnection, ComponentTemplate } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate unique IDs
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format date strings
 */
export function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Local storage helpers for projects
 */
export const ProjectStorage = {
  STORAGE_KEY: 'system_design_projects',

  getAll(): Project[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },

  getById(id: string): Project | null {
    const projects = this.getAll()
    return projects.find(p => p.id === id) || null
  },

  save(project: Project): void {
    const projects = this.getAll()
    const index = projects.findIndex(p => p.id === project.id)

    if (index >= 0) {
      projects[index] = { ...project, updated_at: new Date().toISOString() }
    } else {
      projects.push(project)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
  },

  delete(id: string): void {
    const projects = this.getAll().filter(p => p.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects))
  },

  create(name: string): Project {
    const project: Project = {
      id: generateId(),
      name,
      requirements: '',
      audience: 'technical',
      nodes: [],
      connections: [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: []
    }
    this.save(project)
    return project
  }
}

/**
 * Component Library Templates
 */
export const componentTemplates: ComponentTemplate[] = [
  {
    id: 'api-gateway',
    type: 'api-gateway',
    name: 'API Gateway',
    description: 'Entry point for client requests with routing and load balancing',
    icon: 'FaServer',
    defaultSpecs: {
      technology: 'NGINX / Kong',
      capacity: '10K requests/sec',
      latency: '<50ms'
    }
  },
  {
    id: 'database',
    type: 'database',
    name: 'Database',
    description: 'Persistent data storage with ACID guarantees',
    icon: 'FaDatabase',
    defaultSpecs: {
      technology: 'PostgreSQL / MySQL',
      capacity: '1TB storage',
      latency: '<10ms reads'
    }
  },
  {
    id: 'cache',
    type: 'cache',
    name: 'Cache Layer',
    description: 'In-memory cache for fast data access',
    icon: 'FaBolt',
    defaultSpecs: {
      technology: 'Redis / Memcached',
      capacity: '100GB memory',
      latency: '<1ms'
    }
  },
  {
    id: 'queue',
    type: 'queue',
    name: 'Message Queue',
    description: 'Async message processing and task distribution',
    icon: 'FaStream',
    defaultSpecs: {
      technology: 'RabbitMQ / Kafka',
      capacity: '100K messages/sec',
      latency: '<5ms'
    }
  },
  {
    id: 'service',
    type: 'service',
    name: 'Microservice',
    description: 'Independent service handling specific business logic',
    icon: 'FaCube',
    defaultSpecs: {
      technology: 'Node.js / Python',
      capacity: 'Auto-scaling',
      latency: '<100ms'
    }
  }
]

/**
 * Create a node from template
 */
export function createNodeFromTemplate(
  template: ComponentTemplate,
  position: { x: number; y: number }
): SystemNode {
  return {
    id: generateId(),
    type: template.type,
    name: template.name,
    description: template.description,
    position,
    specifications: template.defaultSpecs,
    scaling: {
      horizontal: true,
      vertical: false,
      auto_scaling: true,
      details: 'Scales based on CPU/memory usage'
    },
    fault_tolerance: {
      replication: true,
      backup: true,
      failover: true,
      details: 'Multi-region deployment with automated failover'
    },
    connections: [],
    icon: template.icon
  }
}

/**
 * Export project as JSON
 */
export function exportProjectJSON(project: Project): void {
  const data = JSON.stringify(project, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse agent response for system design data
 */
export function parseAgentResponse(response: any): {
  nodes: SystemNode[]
  connections: NodeConnection[]
} {
  // Try to extract structured data from agent response
  const data = response?.result?.data || {}

  return {
    nodes: data.nodes || [],
    connections: data.connections || []
  }
}

/**
 * Canvas utilities
 */
export const CanvasUtils = {
  screenToCanvas(
    screenX: number,
    screenY: number,
    pan: { x: number; y: number },
    zoom: number
  ): { x: number; y: number } {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom
    }
  },

  canvasToScreen(
    canvasX: number,
    canvasY: number,
    pan: { x: number; y: number },
    zoom: number
  ): { x: number; y: number } {
    return {
      x: canvasX * zoom + pan.x,
      y: canvasY * zoom + pan.y
    }
  },

  fitToView(
    nodes: SystemNode[],
    containerWidth: number,
    containerHeight: number,
    padding: number = 50
  ): { zoom: number; pan: { x: number; y: number } } {
    if (nodes.length === 0) {
      return { zoom: 1, pan: { x: 0, y: 0 } }
    }

    const xs = nodes.map(n => n.position.x)
    const ys = nodes.map(n => n.position.y)
    const minX = Math.min(...xs) - padding
    const maxX = Math.max(...xs) + padding + 300 // node width
    const minY = Math.min(...ys) - padding
    const maxY = Math.max(...ys) + padding + 150 // node height

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    const zoomX = containerWidth / contentWidth
    const zoomY = containerHeight / contentHeight
    const zoom = Math.min(zoomX, zoomY, 1)

    const pan = {
      x: (containerWidth - contentWidth * zoom) / 2 - minX * zoom,
      y: (containerHeight - contentHeight * zoom) / 2 - minY * zoom
    }

    return { zoom, pan }
  }
}
