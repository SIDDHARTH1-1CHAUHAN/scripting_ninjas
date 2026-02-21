const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const HS_SERVICE_URL = process.env.NEXT_PUBLIC_HS_SERVICE_URL || 'http://localhost:8001'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const MOCK_DELAY = 1500

// Classification API
export async function classifyProduct(description: string, _image?: File) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    return {
      hs_code: '8504.40.95',
      confidence: 94,
      description: 'Static converters; power supplies',
      chapter: 'Chapter 85 - Electrical machinery',
      gir_applied: 'GIR 3(b) - Essential character',
      reasoning: 'Based on GIR 3(b), the essential character is the charging function.',
      primary_function: 'Charging electronic devices',
      alternatives: [
        { code: '8513.10.40', description: 'Portable flashlights', why_not: 'Secondary feature' },
      ],
      cached: false,
      processing_time_ms: 2340,
    }
  }

  const response = await fetch(`${HS_SERVICE_URL}/api/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  if (!response.ok) throw new Error('Classification failed')
  return response.json()
}

// Image Classification API
export async function classifyFromImage(image: File, additionalContext?: string) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    return {
      classification: {
        hs_code: '8504.40.95',
        confidence: 91,
        description: 'Static converters',
        reasoning: 'OCR extracted product details from image',
      },
      ocr_data: {
        raw_text: 'Product detected from image',
        detected_fields: {},
      },
    }
  }

  const formData = new FormData()
  formData.append('image', image)
  if (additionalContext) formData.append('additional_context', additionalContext)

  const response = await fetch(`${HS_SERVICE_URL}/api/classify/image`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) throw new Error('Image classification failed')
  return response.json()
}

// AI Assistant Chat API
export async function sendChatMessage(message: string, context?: Array<{role: string, content: string}>) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    return {
      response: `Processing your query about: "${message}"\n\nBased on the information provided, I recommend checking the tariff schedule for relevant HS codes.\n\n**Key points:**\n- Verify the product's primary function\n- Check Section 301 tariff applicability\n- Ensure required documentation is ready`,
      suggestions: ['VIEW_DETAILS', 'CALCULATE_COST', 'CHECK_COMPLIANCE']
    }
  }

  const response = await fetch(`${API_BASE}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  if (!response.ok) throw new Error('Chat request failed')
  return response.json()
}

// Landed Cost API
export async function calculateLandedCost(params: {
  hs_code: string
  product_value: number
  quantity: number
  origin_country: string
  destination_country: string
  shipping_mode: string
}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    return {
      total_landed_cost: 81634,
      cost_per_unit: 16.33,
      breakdown: {
        product_value: params.product_value,
        base_duty: 0,
        section_301: params.product_value * 0.25,
        mpf: 216.50,
        hmf: 78.13,
        freight: 1850,
        insurance: 312.50,
      },
      effective_duty_rate: 25.47,
      warnings: ['Section 301 tariff applies: 25%'],
    }
  }

  const response = await fetch(`${API_BASE}/api/v1/landed-cost/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Landed cost calculation failed')
  return response.json()
}

// Compliance Check API
export async function checkCompliance(params: {
  hs_code: string
  origin_country: string
  destination_country: string
  supplier_name?: string
}) {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, MOCK_DELAY))
    return {
      overall_risk_score: 72,
      risk_level: 'MEDIUM',
      checks: [
        { category: 'OFAC Sanctions', status: 'CLEAR', details: 'No matches found' },
        { category: 'Section 301', status: 'WARNING', details: '25% additional duty applies' },
      ],
      required_documents: [
        { name: 'Commercial Invoice', status: 'required' },
        { name: 'Bill of Lading', status: 'required' },
        { name: 'UN38.3 Test Summary', status: 'required' },
      ],
      warnings: ['Section 301 tariffs apply'],
    }
  }

  const response = await fetch(`${API_BASE}/api/v1/compliance/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Compliance check failed')
  return response.json()
}
