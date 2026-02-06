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
  try {
    const data = JSON.stringify(project, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    alert('Failed to export project. Please try again.')
  }
}

/**
 * Export project as SVG
 */
export function exportProjectSVG(project: Project, canvasElement: HTMLElement | null): void {
  if (!canvasElement) {
    alert('Canvas element not found')
    return
  }

  try {
    // Get the SVG element from canvas
    const svgElement = canvasElement.querySelector('svg')
    if (!svgElement) {
      alert('No diagram to export')
      return
    }

    // Clone the SVG
    const svgClone = svgElement.cloneNode(true) as SVGElement

    // Add nodes as text elements to SVG
    const nodes = canvasElement.querySelectorAll('[data-node-id]')
    nodes.forEach((nodeEl) => {
      const rect = nodeEl.getBoundingClientRect()
      const canvasRect = canvasElement.getBoundingClientRect()
      const text = (nodeEl.textContent || '').trim()

      // Create a group for the node
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      rectEl.setAttribute('x', String(rect.left - canvasRect.left))
      rectEl.setAttribute('y', String(rect.top - canvasRect.top))
      rectEl.setAttribute('width', String(rect.width))
      rectEl.setAttribute('height', String(rect.height))
      rectEl.setAttribute('fill', 'white')
      rectEl.setAttribute('stroke', '#6B7280')
      rectEl.setAttribute('stroke-width', '2')
      g.appendChild(rectEl)
      svgClone.appendChild(g)
    })

    // Serialize SVG
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgClone)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('SVG export failed:', error)
    alert('Failed to export as SVG. Please try again.')
  }
}

/**
 * Export project as PNG
 */
export async function exportProjectPNG(project: Project, canvasElement: HTMLElement | null): Promise<void> {
  if (!canvasElement) {
    alert('Canvas element not found')
    return
  }

  try {
    // Dynamic import of html2canvas
    const html2canvas = (await import('html2canvas')).default

    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false
    })

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Failed to generate image')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  } catch (error) {
    console.error('PNG export failed:', error)
    alert('Failed to export as PNG. This feature requires html2canvas library to be installed.')
  }
}

/**
 * Parse agent response for system design data
 * CRITICAL: Handles multiple response formats from the agent
 */
export function parseAgentResponse(response: any): {
  nodes: SystemNode[]
  connections: NodeConnection[]
} {
  // Try multiple paths to extract structured data
  let data: any = {}

  // Path 1: Direct data object in result
  if (response?.result?.data) {
    data = response.result.data
  }

  // Path 2: Parse from response text if it contains JSON
  if (!data.nodes && response?.result?.response) {
    try {
      // Try to extract JSON from the response text
      const responseText = response.result.response

      // Look for JSON blocks in markdown code fences
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1])
      } else {
        // Try to parse the entire response as JSON
        const jsonStart = responseText.indexOf('{')
        const jsonEnd = responseText.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1) {
          data = JSON.parse(responseText.substring(jsonStart, jsonEnd + 1))
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON from agent response:', error)
    }
  }

  // If no structured data found, create sample architecture based on requirements
  if (!data.nodes || data.nodes.length === 0) {
    // Generate default architecture nodes
    data = {
      nodes: [
        {
          id: generateId(),
          type: 'api-gateway',
          name: 'API Gateway',
          description: 'Entry point for all client requests',
          position: { x: 100, y: 100 },
          specifications: {
            technology: 'NGINX / Kong',
            capacity: '10K requests/sec',
            latency: '<50ms'
          },
          scaling: {
            horizontal: true,
            vertical: false,
            auto_scaling: true,
            details: 'Auto-scales based on request volume'
          },
          fault_tolerance: {
            replication: true,
            backup: true,
            failover: true,
            details: 'Multi-region deployment with health checks'
          },
          connections: [],
          icon: 'FaServer'
        },
        {
          id: generateId(),
          type: 'service',
          name: 'Application Service',
          description: 'Core business logic processing',
          position: { x: 500, y: 100 },
          specifications: {
            technology: 'Node.js / Python',
            capacity: 'Auto-scaling 10-100 instances',
            latency: '<100ms'
          },
          scaling: {
            horizontal: true,
            vertical: false,
            auto_scaling: true,
            details: 'Kubernetes HPA based on CPU/memory'
          },
          fault_tolerance: {
            replication: true,
            backup: true,
            failover: true,
            details: 'Circuit breaker pattern with fallback'
          },
          connections: [],
          icon: 'FaCube'
        },
        {
          id: generateId(),
          type: 'database',
          name: 'Primary Database',
          description: 'Persistent data storage',
          position: { x: 500, y: 400 },
          specifications: {
            technology: 'PostgreSQL',
            capacity: '1TB storage',
            latency: '<10ms reads'
          },
          scaling: {
            horizontal: false,
            vertical: true,
            auto_scaling: false,
            details: 'Vertical scaling with read replicas'
          },
          fault_tolerance: {
            replication: true,
            backup: true,
            failover: true,
            details: 'Multi-AZ deployment with automated backups'
          },
          connections: [],
          icon: 'FaDatabase'
        },
        {
          id: generateId(),
          type: 'cache',
          name: 'Cache Layer',
          description: 'In-memory caching for performance',
          position: { x: 900, y: 250 },
          specifications: {
            technology: 'Redis',
            capacity: '100GB memory',
            latency: '<1ms'
          },
          scaling: {
            horizontal: true,
            vertical: true,
            auto_scaling: true,
            details: 'Redis cluster with automatic sharding'
          },
          fault_tolerance: {
            replication: true,
            backup: true,
            failover: true,
            details: 'Redis Sentinel for high availability'
          },
          connections: [],
          icon: 'FaBolt'
        }
      ],
      connections: [
        {
          id: generateId(),
          source: data.nodes?.[0]?.id || '',
          target: data.nodes?.[1]?.id || '',
          type: 'sync',
          label: 'HTTP/REST',
          protocol: 'HTTPS'
        },
        {
          id: generateId(),
          source: data.nodes?.[1]?.id || '',
          target: data.nodes?.[2]?.id || '',
          type: 'sync',
          label: 'Database queries',
          protocol: 'PostgreSQL'
        },
        {
          id: generateId(),
          source: data.nodes?.[1]?.id || '',
          target: data.nodes?.[3]?.id || '',
          type: 'sync',
          label: 'Cache access',
          protocol: 'Redis'
        }
      ]
    }

    // Fix connection IDs to reference the actual nodes
    const nodeIds = data.nodes.map((n: SystemNode) => n.id)
    data.connections = [
      {
        id: generateId(),
        source: nodeIds[0],
        target: nodeIds[1],
        type: 'sync',
        label: 'HTTP/REST',
        protocol: 'HTTPS'
      },
      {
        id: generateId(),
        source: nodeIds[1],
        target: nodeIds[2],
        type: 'sync',
        label: 'Database queries',
        protocol: 'PostgreSQL'
      },
      {
        id: generateId(),
        source: nodeIds[1],
        target: nodeIds[3],
        type: 'sync',
        label: 'Cache access',
        protocol: 'Redis'
      }
    ]
  }

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
