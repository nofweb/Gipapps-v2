export interface User {
  id?: string | number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  [key: string]: unknown
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  data: {
    access_token: string
    user: User
  }
}
