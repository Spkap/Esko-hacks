class APIError(Exception):
    def __init__(self, status, code, message, details=None, retryable=False):
        self.status, self.code, self.message = status, code, message
        self.details, self.retryable = details or {}, retryable
