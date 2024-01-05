class APIError {
  public message: string | null = null
  public code: number | null = null
  public reason: string | null = null
  constructor(message: string, code: number = 500, reason: string | null = null) {
    this.message = message
    this.code = code
    this.reason = reason
  }
}

export default APIError
