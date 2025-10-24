import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key')

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, secret, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function login(username: string, password: string) {
  const adminUsername = process.env.TIMESHEET_ADMIN_USERNAME
  const adminPassword = process.env.TIMESHEET_ADMIN_PASSWORD

  if (username === adminUsername && password === adminPassword) {
    const user = {
      id: 'admin',
      username: username,
      name: 'Admin User',
      role: 'admin'
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const session = await encrypt({ user, expires })

    return { user, session, expires }
  }

  return null
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession(): Promise<{ user: { id: string; username: string; name: string; role: string } } | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value

  if (!session) return null

  try {
    const payload = await decrypt(session) as any
    return payload
  } catch (error) {
    return null
  }
}
