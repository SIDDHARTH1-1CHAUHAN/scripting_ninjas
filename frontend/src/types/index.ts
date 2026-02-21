// Common types for the application

export interface HSClassification {
  code: string
  description: string
  confidence: number
  chapter: string
  section: string
}

export interface LandedCost {
  productValue: number
  dutyRate: number
  dutyAmount: number
  taxes: number
  fees: number
  total: number
}

export interface ComplianceCheck {
  status: 'PASS' | 'FAIL' | 'WARNING'
  ofacMatch: boolean
  section301: boolean
  message: string
}

export interface Route {
  id: string
  origin: string
  destination: string
  carrier: string
  duration: number
  cost: number
  emissions: number
}

export interface ChatMessage {
  id: string
  type: 'ai' | 'user'
  content: string
  timestamp: Date
  suggestions?: string[]
}
