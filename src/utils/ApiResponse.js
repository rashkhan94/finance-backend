/**
 * Standardised API response wrapper.
 * Every successful response goes through this so the frontend
 * always gets the same shape: { success, message, data }.
 */
class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  /**
   * Sends the response through Express res object.
   */
  send(res) {
    return res.status(this.success ? 200 : 500).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }

  static ok(res, message, data) {
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  }

  static created(res, message, data) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
