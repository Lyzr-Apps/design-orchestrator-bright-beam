/**
 * TypeScript Interfaces for System Design Documentation Agent
 */

// Agent Response Types (from response schema)
export interface DesignOrchestratorResponse {
  status: 'success' | 'error'
  result: {
    response: string
    action_taken?: string
    data?: {
      nodes?: SystemNode[]
      connections?: NodeConnection[]
      metadata?: Record<string, any>
      [key: string]: any
    }
    suggestions?: string[]
  }
  metadata?: {
    agent_name: string
    timestamp: string
  }
}

// System Design Node Types
export interface SystemNode {
  id: string
  type: 'api-gateway' | 'database' | 'cache' | 'queue' | 'service' | 'custom'
  name: string
  description: string
  position: { x: number; y: number }
  specifications?: {
    technology?: string
    capacity?: string
    latency?: string
    [key: string]: any
  }
  scaling?: {
    horizontal?: boolean
    vertical?: boolean
    auto_scaling?: boolean
    details?: string
  }
  fault_tolerance?: {
    replication?: boolean
    backup?: boolean
    failover?: boolean
    details?: string
  }
  connections?: string[] // IDs of connected nodes
  icon?: string
  color?: string
}

export interface NodeConnection {
  id: string
  source: string // node ID
  target: string // node ID
  type: 'sync' | 'async' | 'bidirectional'
  label?: string
  description?: string
  protocol?: string
}

// Project Types
export interface Project {
  id: string
  name: string
  requirements: string
  audience: 'technical' | 'executive' | 'adaptive'
  nodes: SystemNode[]
  connections: NodeConnection[]
  status: 'draft' | 'generating' | 'completed'
  created_at: string
  updated_at: string
  versions: ProjectVersion[]
}

export interface ProjectVersion {
  id: string
  version: number
  timestamp: string
  nodes: SystemNode[]
  connections: NodeConnection[]
  snapshot_name?: string
}

// UI State Types
export interface CanvasState {
  zoom: number
  pan: { x: number; y: number }
  selectedNodeId: string | null
  isDragging: boolean
  showGrid: boolean
  showMinimap: boolean
}

export interface EditorState {
  leftSidebarOpen: boolean
  rightPanelOpen: boolean
  activeTab: 'overview' | 'specifications' | 'scaling' | 'fault-tolerance' | 'connections'
}

// Export Types
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  highResolution: boolean
  includeLegend: boolean
}

// Component Library Templates
export interface ComponentTemplate {
  id: string
  type: SystemNode['type']
  name: string
  description: string
  icon: string
  defaultSpecs: SystemNode['specifications']
}
