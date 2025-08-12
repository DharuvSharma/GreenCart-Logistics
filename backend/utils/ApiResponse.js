class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }

  static success(data, message = "Success", statusCode = 200) {
    return new ApiResponse(statusCode, data, message)
  }

  static error(message, statusCode = 500, data = null) {
    return new ApiResponse(statusCode, data, message)
  }
}

module.exports = ApiResponse
