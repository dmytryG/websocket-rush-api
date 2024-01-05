class APIError {
  public message: string | null
  public code: number | null
  public reason: string | null
  constructor(message: string, code: number = 500, reason: string | null = null) {
    this.reason = reason
    this.code = code
    this.reason = reason
  }
}

export default APIError
