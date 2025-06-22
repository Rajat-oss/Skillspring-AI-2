// Global OTP storage that persists across API calls
if (!global.otpStorage) {
  global.otpStorage = new Map();
}

export const otpStorage = global.otpStorage;