export interface AppError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class ErrorHandler {
  static handle(error: any): AppError {
    // API errors
    if (error.name === "ApiError") {
      return {
        message: error.message,
        status: error.status,
        details: error.details,
      }
    }

    // Network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        message: "Network error. Please check your connection.",
        status: 0,
        code: "NETWORK_ERROR",
      }
    }

    // Validation errors
    if (error.name === "ValidationError") {
      return {
        message: "Please check your input and try again.",
        status: 400,
        code: "VALIDATION_ERROR",
        details: error.details,
      }
    }

    // Generic error
    return {
      message: error.message || "An unexpected error occurred",
      status: 500,
      code: "UNKNOWN_ERROR",
    }
  }

  static getErrorMessage(error: any): string {
    const appError = this.handle(error)
    return appError.message
  }

  static isNetworkError(error: any): boolean {
    return this.handle(error).code === "NETWORK_ERROR"
  }

  static isValidationError(error: any): boolean {
    return this.handle(error).code === "VALIDATION_ERROR"
  }
}

export const handleApiError = (error: any, fallbackMessage = "An error occurred") => {
  const appError = ErrorHandler.handle(error)

  return {
    title:
      appError.status === 400
        ? "Validation Error"
        : appError.status === 401
          ? "Authentication Error"
          : appError.status === 404
            ? "Not Found"
            : appError.status === 0
              ? "Network Error"
              : "Error",
    description: appError.message || fallbackMessage,
    variant: "destructive" as const,
  }
}
