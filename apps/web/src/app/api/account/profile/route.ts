import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '../../../../lib/db'
import { verifyPassword, hashPassword } from '../../../../lib/password'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { name?: string; image?: string | null; email?: string; currentPassword?: string; newPassword?: string }
  const name = typeof body.name === 'string' ? body.name.trim() : undefined
  const image = typeof body.image === 'string' ? body.image.trim() : body.image === null ? null : undefined
  const email = typeof body.email === 'string' ? body.email.trim() : undefined
  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : undefined
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : undefined

  if (name === undefined && image === undefined && email === undefined && newPassword === undefined) {
    // Gracefully no-op: return current user instead of failing
    const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, image: true } })
    return NextResponse.json({ user: current })
  }

  try {
    // Only require verifying current password when changing password
    if (newPassword !== undefined) {
      const existing = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } }) as any
      if (existing?.password) {
        if (!currentPassword) return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 })
        const ok = await verifyPassword(currentPassword, existing.password)
        if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 })
      }
    }

    const data: any = {
      ...(name !== undefined ? { name } : {}),
      ...(image !== undefined ? { image } : {}),
      ...(email !== undefined ? { email } : {}),
    }
    if (newPassword) {
      data.password = await hashPassword(newPassword)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, image: true },
    })
    return NextResponse.json({ user: updated })
  } catch (e) {
    console.error('profile update failed', e)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    // Soft-delete approach: anonymize email, keep referential integrity
    const anon = `deleted_${session.user.id}@example.invalid`
    await prisma.user.update({ where: { id: session.user.id }, data: { email: anon, name: null, image: null, password: null } as any })
    // Optionally: revoke sessions here if session store supports it
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('profile delete failed', e)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}


