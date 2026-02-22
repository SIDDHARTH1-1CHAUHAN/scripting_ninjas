const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const HS_SERVICE_URL = process.env.NEXT_PUBLIC_HS_SERVICE_URL || 'http://localhost:8001'
const ROUTE_SERVICE_URL = process.env.NEXT_PUBLIC_ROUTE_SERVICE_URL || 'http://localhost:8002'
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
const MOCK_DELAY = 1500
const DEFAULT_TIMEOUT_MS = 30000

export interface AlternativeCode {
  code: string
  description: string
  why_not?: string
}

export interface HSClassification {
  hs_code: string
  confidence: number
  description: string
  chapter?: string
  gir_applied?: string
  reasoning: string
  primary_function?: string
  alternatives?: AlternativeCode[]
  cached?: boolean
  processing_time_ms?: number
}

export interface ImageClassificationResponse {
  classification: HSClassification
  ocr_data: {
    raw_text: string
    detected_fields: Record<string, string>
    source?: string
  }
}

export interface ChatContext {
  role: string
  content: string
}

export interface AssistantUserProfile {
  name?: string
  company?: string
  role?: string
  preferred_lanes?: string[]
  priorities?: string[]
}

export interface ChatResponse {
  response: string
  suggestions: string[]
  agent_actions?: Array<{
    title: string
    route: string
  }>
  profile_applied?: boolean
  profile_summary?: string | null
  provider?: string
  model?: string
  live?: boolean
}

export interface AuthUser {
  id: string
  email: string
  name: string
  picture?: string
  email_verified?: boolean
}

export interface GoogleAuthResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export interface LandedCostRequest {
  hs_code: string
  product_value: number
  quantity: number
  origin_country: string
  destination_country: string
  shipping_mode: string
  incoterm?: string
  currency?: string
}

export interface LandedCostResponse {
  total_landed_cost: number
  cost_per_unit: number
  breakdown: {
    product_value: number
    base_duty: number
    base_duty_rate?: number
    section_301: number
    section_301_rate?: number
    mpf: number
    hmf: number
    freight: number
    insurance: number
    total_duties?: number
    total_freight?: number
  }
  effective_duty_rate: number
  warnings: string[]
}

export interface ComplianceRequest {
  hs_code: string
  origin_country: string
  destination_country: string
  supplier_name?: string
  product_description?: string
  compliance_case_id?: string
}

export interface ComplianceResponse {
  overall_risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  checks: Array<{
    category: string
    status: string
    details: string
    action_required?: string
    documents?: string[]
    checked_entities?: string[]
  }>
  required_documents: Array<{
    name: string
    status: string
    filename?: string
    uploaded_at?: string
  }>
  warnings: string[]
  compliance_case_id?: string
}

export interface ComplianceDocumentStatus {
  name: string
  status: string
  filename?: string
  uploaded_at?: string
}

export interface CargoTrackingResponse {
  shipment: {
    container_id: string
    bill_of_lading: string
    vessel: string
    voyage: string
    carrier: string
    origin_port: string
    origin_country: string
    destination_port: string
    destination_country: string
    departed: string
    eta: string
    cargo_description: string
    hs_code: string
    weight_kg: number
    value_usd: number
  }
  current_position: {
    latitude: number
    longitude: number
    location_name: string
    speed_knots: number
    heading: number
    timestamp: string
  }
  timeline: Array<{
    status: string
    location: string
    timestamp: string
    completed: boolean
    current?: boolean
    estimated?: boolean
  }>
  alerts: Array<{
    type: string
    message: string
    timestamp: string
  }>
  progress_percent: number
  route_points?: Array<{
    lat: number
    lon: number
    name: string
    kind: string
  }>
  reliability_score?: number
  delay_risk?: 'LOW' | 'MEDIUM' | 'HIGH' | string
}

export interface CargoShipmentSummary {
  container_id: string
  vessel: string
  origin: string
  destination: string
  eta: string
  progress_percent: number
  status: string
}

export interface ForexForecastRequest {
  from_currency: string
  to_currency: string
  forecast_days: number
}

export interface ForexForecastPoint {
  date: string
  predicted_rate: number
  lower_bound: number
  upper_bound: number
}

export interface ForexForecastResponse {
  from_currency: string
  to_currency: string
  forecast_days: number
  generated_at: string
  historical: Array<{
    date: string
    rate: number
  }>
  forecast: Array<{
    date: string
    predicted_rate: number
    lower_bound: number
    upper_bound: number
    is_future: boolean
  }>
  future_forecast: ForexForecastPoint[]
  minimum_predicted_rate: {
    date: string
    rate: number
  }
  maximum_predicted_rate: {
    date: string
    rate: number
  }
  recommendation: {
    strategy: 'pay_on_min_receive_on_max'
    explanation: string
    payment_date: string
    payment_rate: number
    bill_receive_date: string
    bill_receive_rate: number
  }
  model_used?: string
  model_warning?: string | null
}

export interface RouteCompareRequest {
  origin_port: string
  destination_port: string
  cargo_weight_kg: number
  cargo_value_usd: number
  hs_code?: string
  origin_location?: string
  destination_location?: string
}

export interface RouteCompareResponse {
  origin: string
  destination: string
  recommended_route_id: string | null
  routes: Array<{
    id: string
    name: string
    carrier: string
    transit_days: number
    cost_usd: number
    emissions_kg_co2: number
    congestion_risk: string
    recommended: boolean
    savings?: number
    waypoints: Array<{
      port?: string
      type?: string
      lat?: number
      lon?: number
      name?: string
    }>
  }>
}

export interface AnalyticsDashboardResponse {
  summary: {
    total_classifications: number
    total_shipments: number
    total_value_usd: number
    duties_paid_usd: number
    duties_saved_usd: number
    compliance_score: number
    period: string
  }
  classifications_by_chapter: Array<{
    chapter: string
    count: number
    percentage: number
  }>
  monthly_trend: Array<{
    month: string
    classifications: number
    shipments: number
    value: number
  }>
  top_trade_routes: Array<{
    route: string
    shipments: number
    value: number
  }>
  ai_accuracy: {
    overall: number
    by_confidence: Array<{
      range: string
      accuracy: number
      count: number
    }>
  }
  recent_activity: Array<Record<string, string | number>>
}

export interface AnalyticsClassificationStatsResponse {
  total_today: number
  total_week: number
  total_month: number
  avg_confidence: number
  avg_processing_time_ms: number
  cache_hit_rate: number
  top_chapters: Array<{
    chapter: string
    name: string
    count: number
  }>
}

export interface AnalyticsCostSavingsResponse {
  period: string
  total_imports_value: number
  total_duties_paid: number
  optimized_duties: number
  total_savings: number
  savings_percentage: number
  optimization_methods: Array<{
    method: string
    savings: number
    count: number
  }>
  recommendations: string[]
}

export interface AnalyticsExportResponse {
  generated_at: string
  format: string
  analytics: AnalyticsDashboardResponse
  cost_savings: AnalyticsCostSavingsResponse
  export_note: string
}

export interface BusinessModelResponse {
  product: string
  positioning: string
  pricing: Array<{
    tier: string
    price_monthly_usd: number
    price_yearly_usd?: number
    who_for: string
  includes: string[]
  }>
  revenue_model: string[]
  competitive_edge: string[]
  usp?: string[]
  overage_pricing?: Array<{
    feature: string
    unit: string
    price_usd: number
  }>
  membership_addon?: {
    name: string
    price_monthly_usd: number
    includes: string[]
  }
  revenue_scenarios?: Array<{
    name: string
    mix: string
    mrr_usd: number
    arr_usd: number
  }>
  north_star_metric: string
  hackathon_pitch?: {
    one_liner: string
    problem: string[]
    solution: string[]
    demo_story: string[]
    business_model_summary: string[]
    why_we_win: string[]
    ask: string
  }
}

export interface BusinessPitchResponse {
  pitch: string
  provider: string
  model: string
  live: boolean
  error?: string
}

export interface PaymentCheckoutOrderRequest {
  plan_tier: string
  billing_cycle: 'monthly' | 'yearly'
  customer_name: string
  customer_email: string
}

export interface PaymentCheckoutOrderResponse {
  key_id: string
  order_id: string
  amount: number
  currency: string
  plan_tier: string
  billing_cycle: 'monthly' | 'yearly'
  customer: {
    name: string
    email: string
  }
  gateway: string
}

export interface PaymentVerifyRequest {
  plan_tier: string
  billing_cycle: 'monthly' | 'yearly'
  customer_email: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface PaymentVerifyResponse {
  success: boolean
  message: string
  subscription: {
    customer_email: string
    plan_tier: string
    billing_cycle: 'monthly' | 'yearly'
    status: string
    activated_at: string
    current_period_end: string
    payment_id: string
    order_id: string
  }
}

export interface PaymentSubscriptionResponse {
  customer_email: string
  status: string
  plan_tier: string
  billing_cycle: 'monthly' | 'yearly'
  activated_at?: string
  current_period_end?: string
  payment_id?: string
  order_id?: string
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallbackMessage: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })

    if (!response.ok) {
      let detail = ''
      try {
        const payload = await response.json() as { detail?: string | { message?: string } }
        if (typeof payload.detail === 'string') {
          detail = payload.detail
        } else if (payload.detail && typeof payload.detail === 'object') {
          detail = payload.detail.message || ''
        }
      } catch {
        // Ignore non-json error payloads.
      }
      throw new Error(detail || fallbackMessage)
    }

    return await response.json() as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${fallbackMessage}`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function classifyProduct(description: string, context?: string): Promise<HSClassification> {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY)
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

  return requestJson<HSClassification>(
    `${HS_SERVICE_URL}/api/classify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, context }),
    },
    'Classification failed',
  )
}

export async function classifyFromImage(image: File, additionalContext?: string): Promise<ImageClassificationResponse> {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY)
    return {
      classification: {
        hs_code: '8504.40.95',
        confidence: 91,
        description: 'Static converters',
        chapter: 'Chapter 85 - Electrical machinery',
        gir_applied: 'GIR 1',
        reasoning: 'OCR extracted product details from image',
        primary_function: 'Power conversion',
      },
      ocr_data: {
        raw_text: 'Product detected from image',
        detected_fields: {},
      },
    }
  }

  const formData = new FormData()
  formData.append('image', image)
  if (additionalContext) {
    formData.append('additional_context', additionalContext)
  }

  return requestJson<ImageClassificationResponse>(
    `${HS_SERVICE_URL}/api/classify/image`,
    {
      method: 'POST',
      body: formData,
    },
    'Image classification failed',
  )
}

export async function sendChatMessage(
  message: string,
  context?: ChatContext[],
  userProfile?: AssistantUserProfile,
): Promise<ChatResponse> {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY)
    return {
      response: `Processing your query about: "${message}"\n\nBased on the information provided, I recommend checking the tariff schedule for relevant HS codes.\n\nKey points:\n- Verify the product's primary function\n- Check Section 301 tariff applicability\n- Ensure required documentation is ready`,
      suggestions: ['VIEW_DETAILS', 'CALCULATE_COST', 'CHECK_COMPLIANCE'],
    }
  }

  return requestJson<ChatResponse>(
    `${API_BASE}/api/v1/assistant/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context, user_profile: userProfile }),
    },
    'Chat request failed',
  )
}

export async function googleSignIn(idToken: string): Promise<GoogleAuthResponse> {
  return requestJson<GoogleAuthResponse>(
    `${API_BASE}/api/v1/auth/google`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    },
    'Google sign-in failed',
  )
}

export async function demoSignIn(name?: string, email?: string): Promise<GoogleAuthResponse> {
  return requestJson<GoogleAuthResponse>(
    `${API_BASE}/api/v1/auth/demo`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    },
    'Demo sign-in failed',
  )
}

export async function getCurrentUser(accessToken: string): Promise<{ user: AuthUser }> {
  return requestJson<{ user: AuthUser }>(
    `${API_BASE}/api/v1/auth/me`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
    'Session verification failed',
  )
}

export async function getBusinessModel(): Promise<BusinessModelResponse> {
  return requestJson<BusinessModelResponse>(
    `${API_BASE}/api/v1/business/model`,
    { method: 'GET' },
    'Business model fetch failed',
  )
}

export async function generateBusinessPitch(prompt: string): Promise<BusinessPitchResponse> {
  return requestJson<BusinessPitchResponse>(
    `${API_BASE}/api/v1/business/pitch`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    },
    'Business pitch generation failed',
  )
}

export async function createPaymentCheckoutOrder(
  params: PaymentCheckoutOrderRequest,
): Promise<PaymentCheckoutOrderResponse> {
  return requestJson<PaymentCheckoutOrderResponse>(
    `${API_BASE}/api/v1/payments/checkout-order`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Payment checkout initialization failed',
  )
}

export async function verifyPayment(
  params: PaymentVerifyRequest,
): Promise<PaymentVerifyResponse> {
  return requestJson<PaymentVerifyResponse>(
    `${API_BASE}/api/v1/payments/verify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Payment verification failed',
  )
}

export async function getPaymentSubscription(email: string): Promise<PaymentSubscriptionResponse> {
  return requestJson<PaymentSubscriptionResponse>(
    `${API_BASE}/api/v1/payments/subscription?email=${encodeURIComponent(email)}`,
    { method: 'GET' },
    'Subscription fetch failed',
  )
}

export async function calculateLandedCost(params: LandedCostRequest): Promise<LandedCostResponse> {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY)
    return {
      total_landed_cost: 81634,
      cost_per_unit: 16.33,
      breakdown: {
        product_value: params.product_value,
        base_duty: 0,
        base_duty_rate: 0,
        section_301: params.product_value * 0.25,
        section_301_rate: 0.25,
        mpf: 216.5,
        hmf: 78.13,
        freight: 1850,
        insurance: 312.5,
      },
      effective_duty_rate: 25.47,
      warnings: ['Section 301 tariff applies: 25%'],
    }
  }

  return requestJson<LandedCostResponse>(
    `${API_BASE}/api/v1/landed-cost/calculate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Landed cost calculation failed',
  )
}

export async function checkCompliance(params: ComplianceRequest): Promise<ComplianceResponse> {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY)
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

  return requestJson<ComplianceResponse>(
    `${API_BASE}/api/v1/compliance/check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Compliance check failed',
  )
}

export async function uploadComplianceDocument(
  complianceCaseId: string,
  documentName: string,
  file: File,
): Promise<{
  compliance_case_id: string
  document: ComplianceDocumentStatus
}> {
  const formData = new FormData()
  formData.append('compliance_case_id', complianceCaseId)
  formData.append('document_name', documentName)
  formData.append('file', file)

  return requestJson<{ compliance_case_id: string; document: ComplianceDocumentStatus }>(
    `${API_BASE}/api/v1/compliance/documents/upload`,
    {
      method: 'POST',
      body: formData,
    },
    'Document upload failed',
  )
}

export async function getComplianceDocuments(
  complianceCaseId: string,
): Promise<{
  compliance_case_id: string
  documents: ComplianceDocumentStatus[]
}> {
  return requestJson<{ compliance_case_id: string; documents: ComplianceDocumentStatus[] }>(
    `${API_BASE}/api/v1/compliance/documents/${encodeURIComponent(complianceCaseId)}`,
    { method: 'GET' },
    'Compliance documents fetch failed',
  )
}

export async function trackShipment(containerId: string): Promise<CargoTrackingResponse> {
  return requestJson<CargoTrackingResponse>(
    `${API_BASE}/api/v1/cargo/track/${encodeURIComponent(containerId)}`,
    { method: 'GET' },
    'Cargo tracking failed',
  )
}

export async function getCargoShipments(): Promise<CargoShipmentSummary[]> {
  return requestJson<CargoShipmentSummary[]>(
    `${API_BASE}/api/v1/cargo/shipments`,
    { method: 'GET' },
    'Cargo shipments fetch failed',
  )
}

export async function getForexForecast(params: ForexForecastRequest): Promise<ForexForecastResponse> {
  return requestJson<ForexForecastResponse>(
    `${API_BASE}/api/v1/forex/forecast`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Forex forecast failed',
    60000,
  )
}

export async function compareRoutes(params: RouteCompareRequest): Promise<RouteCompareResponse> {
  return requestJson<RouteCompareResponse>(
    `${ROUTE_SERVICE_URL}/api/routes/compare`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    },
    'Route comparison failed',
  )
}

export async function getDashboardAnalytics(period: '7d' | '30d' | '90d'): Promise<AnalyticsDashboardResponse> {
  return requestJson<AnalyticsDashboardResponse>(
    `${API_BASE}/api/v1/analytics/dashboard?period=${period}`,
    { method: 'GET' },
    'Dashboard analytics failed',
  )
}

export async function getClassificationStats(): Promise<AnalyticsClassificationStatsResponse> {
  return requestJson<AnalyticsClassificationStatsResponse>(
    `${API_BASE}/api/v1/analytics/classifications`,
    { method: 'GET' },
    'Classification stats failed',
  )
}

export async function getCostSavingsReport(): Promise<AnalyticsCostSavingsResponse> {
  return requestJson<AnalyticsCostSavingsResponse>(
    `${API_BASE}/api/v1/analytics/cost-savings`,
    { method: 'GET' },
    'Cost savings report failed',
  )
}

export async function getAnalyticsExport(format: 'json' | 'csv' = 'json'): Promise<AnalyticsExportResponse> {
  return requestJson<AnalyticsExportResponse>(
    `${API_BASE}/api/v1/analytics/export?format=${format}`,
    { method: 'GET' },
    'Analytics export failed',
  )
}
