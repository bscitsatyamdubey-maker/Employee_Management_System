// src/supabase/functions/server/index.tsx
import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from '@supabase/supabase-js'
import * as kv from './kv_store.tsx'

const app = new Hono()
app.use('*', cors({ origin: '*', allowHeaders: ['*'], allowMethods: ['*'] }))
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const bearer = (c: any) => c.req.header('Authorization')?.split(' ')[1] || ''

const requireAuth = async (c: any, next: any) => {
  const token = bearer(c)
  if (!token) return c.json({ error: 'Authorization required' }, 401)
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return c.json({ error: 'Invalid token' }, 401)
    const userProfile = await kv.get(`user:${user.id}`)
    if (!userProfile) return c.json({ error: 'User profile not found' }, 404)
    c.set('user', userProfile)
    c.set('userId', user.id)
  } catch {
    return c.json({ error: 'Authentication failed' }, 401)
  }
  await next()
}

app.post('/make-server-ea915b54/admin/bootstrap', async (c) => {
  const setup = c.req.header('X-Setup-Token') || ''
  const expected = Deno.env.get('BOOTSTRAP_ADMIN_TOKEN') || ''
  if (!expected || setup !== expected) return c.json({ error: 'Forbidden' }, 403)
  const { email } = await c.req.json().catch(() => ({}))
  if (!email) return c.json({ error: 'email is required' }, 400)
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return c.json({ error: error.message }, 400)
  const admins = (data?.users || []).filter(u => u.user_metadata?.role === 'admin')
  if (admins.length > 0) return c.json({ error: 'Admin already exists' }, 409)
  const u = (data?.users || []).find(x => (x.email || '').toLowerCase() === String(email).toLowerCase())
  if (!u) return c.json({ error: 'User not found' }, 404)
  const { error: upd } = await supabase.auth.admin.updateUserById(u.id, { user_metadata: { ...(u.user_metadata || {}), role: 'admin', department: null } })
  if (upd) return c.json({ error: upd.message }, 400)
  const profile = await kv.get(`user:${u.id}`)
  const updated = { ...(profile || { id: u.id, email: u.email, name: u.user_metadata?.name || '' }), role: 'admin', department: '', updated_at: new Date().toISOString() }
  await kv.set(`user:${u.id}`, updated)
  await kv.del(`employee:${u.id}`)
  return c.json({ success: true, id: u.id, email: u.email })
})

app.post('/make-server-ea915b54/auth/signup', async (c) => {
  try {
    const { email, password, name, role: attemptedRole, department } = await c.req.json()
    const cleanEmail = String(email || '').trim().toLowerCase()
    const cleanName = String(name || '').trim()
    if (!cleanEmail || !password || !cleanName) return c.json({ error: 'Missing required fields' }, 400)
    if (attemptedRole && attemptedRole !== 'employee') return c.json({ error: 'Role escalation not allowed at signup' }, 400)
    if (!department) return c.json({ error: 'Department is required for employees' }, 400)
    const { data, error } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      user_metadata: { name: cleanName, role: 'employee', department },
      email_confirm: true
    })
    if (error) return c.json({ error: error.message }, 400)
    const userProfile = {
      id: data.user.id,
      email: cleanEmail,
      name: cleanName,
      role: 'employee' as const,
      department,
      hire_date: new Date().toISOString().split('T')[0],
      leave_balance: 20,
      created_at: new Date().toISOString()
    }
    await kv.set(`user:${data.user.id}`, userProfile)
    await kv.set(`employee:${data.user.id}`, userProfile)
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.get('/make-server-ea915b54/user/profile', requireAuth, async (c) => c.json(c.get('user')))

app.put('/make-server-ea915b54/user/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const updates = await c.req.json()
    const currentUser = c.get('user')
    if ('role' in updates) delete updates.role
    const updatedUser = { ...currentUser, ...updates, id: userId }
    await kv.set(`user:${userId}`, updatedUser)
    if (currentUser.role === 'employee' || currentUser.role === 'hod') {
      await kv.set(`employee:${userId}`, updatedUser)
    } else if (currentUser.role === 'admin') {
      const employee = await kv.get(`employee:${userId}`)
      if (employee) await kv.set(`employee:${userId}`, updatedUser)
    }
    return c.json(updatedUser)
  } catch {
    return c.json({ error: 'Failed to update profile' }, 500)
  }
})

app.get('/make-server-ea915b54/admin/users', requireAuth, async (c) => {
  const actor = c.get('user')
  if (actor.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  const q = (c.req.query('q') || '').toLowerCase()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return c.json({ error: error.message }, 400)
  const rows = (data?.users || []).map(u => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || '',
    role: u.user_metadata?.role || null,
    department: u.user_metadata?.department || null
  })).filter(r =>
    !q ||
    r.email?.toLowerCase().includes(q) ||
    r.name?.toLowerCase().includes(q) ||
    (r.role || '')?.toLowerCase().includes(q) ||
    (r.department || '')?.toLowerCase().includes(q)
  )
  return c.json(rows)
})

app.put('/make-server-ea915b54/admin/users/:id/role', requireAuth, async (c) => {
  try {
    const actor = c.get('user')
    if (actor.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
    const targetUserId = c.req.param('id')
    const body = await c.req.json()
    const role = body?.role as 'employee' | 'hod' | 'admin'
    const department: string | null = body?.department ?? null
    if (!['employee', 'hod', 'admin'].includes(role)) return c.json({ error: 'Invalid role' }, 400)
    if (role !== 'admin' && (!department || typeof department !== 'string')) return c.json({ error: 'Department required' }, 400)
    const { error: updErr } = await supabase.auth.admin.updateUserById(targetUserId, {
      user_metadata: { role, department: role === 'admin' ? null : department }
    })
    if (updErr) return c.json({ error: updErr.message }, 400)
    const existingUser = await kv.get(`user:${targetUserId}`)
    const updatedProfile = {
      ...(existingUser || {}),
      id: targetUserId,
      role,
      department: role === 'admin' ? '' : (department || ''),
      updated_at: new Date().toISOString()
    }
    await kv.set(`user:${targetUserId}`, updatedProfile)
    if (role === 'admin') await kv.del(`employee:${targetUserId}`); else await kv.set(`employee:${targetUserId}`, updatedProfile)
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Failed to set role' }, 500)
  }
})

app.get('/make-server-ea915b54/employees', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const all = await kv.getByPrefix('employee:')
    if (user.role === 'admin') return c.json(all)
    if (user.role === 'hod') return c.json(all.filter((emp: any) => emp.department === user.department))
    return c.json({ error: 'Access denied' }, 403)
  } catch {
    return c.json({ error: 'Failed to fetch employees' }, 500)
  }
})

app.post('/make-server-ea915b54/employees', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'admin') return c.json({ error: 'Admin access required' }, 403)
    const employeeData = await c.req.json()
    const employeeId = crypto.randomUUID()
    const employee = { id: employeeId, ...employeeData, created_at: new Date().toISOString() }
    await kv.set(`employee:${employeeId}`, employee)
    const userProfile = await kv.get(`user:${employeeId}`)
    if (!userProfile) await kv.set(`user:${employeeId}`, employee)
    return c.json(employee)
  } catch {
    return c.json({ error: 'Failed to add employee' }, 500)
  }
})

app.put('/make-server-ea915b54/employees/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'admin') return c.json({ error: 'Admin access required' }, 403)
    const employeeId = c.req.param('id')
    const updates = await c.req.json()
    const employee = await kv.get(`employee:${employeeId}`)
    const updated = { ...(employee || {}), ...updates, id: employeeId }
    await kv.set(`employee:${employeeId}`, updated)
    const profile = await kv.get(`user:${employeeId}`)
    if (profile) await kv.set(`user:${employeeId}`, { ...profile, ...updates })
    else await kv.set(`user:${employeeId}`, updated)
    return c.json(updated)
  } catch {
    return c.json({ error: 'Failed to update employee' }, 500)
  }
})

app.delete('/make-server-ea915b54/employees/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'admin') return c.json({ error: 'Admin access required' }, 403)
    const employeeId = c.req.param('id')
    await kv.del(`employee:${employeeId}`)
    await kv.del(`user:${employeeId}`)
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Failed to delete employee' }, 500)
  }
})

app.get('/make-server-ea915b54/leave-requests', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const all = await kv.getByPrefix('leave_request:')
    if (user.role === 'admin') {
      const visible = all.filter((r: any) =>
        r.status === 'pending_admin' || r.status === 'approved' || r.status === 'rejected'
      )
      return c.json(visible)
    }
    if (user.role === 'hod') {
      return c.json(all.filter((r: any) => r.department === user.department))
    }
    return c.json(all.filter((r: any) => r.employee_id === user.id))
  } catch {
    return c.json({ error: 'Failed to fetch leave requests' }, 500)
  }
})

app.post('/make-server-ea915b54/leave-requests', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const reqBody = await c.req.json()
    const start = new Date(reqBody.start_date)
    const end = new Date(reqBody.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
    if (user.leave_balance < days) return c.json({ error: 'Insufficient leave balance' }, 400)
    const holidays = await kv.getByPrefix('holiday:')
    const dates: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0])
    }
    const hitsHoliday = holidays.some((h: any) => dates.includes(h.date))
    if (hitsHoliday) return c.json({ error: 'Cannot request leave on public holidays' }, 400)
    const status: 'pending_hod' | 'pending_admin' = user.role === 'employee' ? 'pending_hod' : 'pending_admin'
    const id = crypto.randomUUID()
    const row = {
      id,
      employee_id: user.id,
      employee_name: user.name,
      department: user.department,
      ...reqBody,
      days_requested: days,
      status,
      created_at: new Date().toISOString()
    }
    await kv.set(`leave_request:${id}`, row)
    return c.json(row)
  } catch {
    return c.json({ error: 'Failed to submit leave request' }, 500)
  }
})

app.put('/make-server-ea915b54/leave-requests/:id/status', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    const id = c.req.param('id')
    const { status } = await c.req.json()
    if (!['approved', 'rejected'].includes(status)) return c.json({ error: 'Invalid status' }, 400)
    const existing = await kv.get(`leave_request:${id}`)
    if (!existing) return c.json({ error: 'Leave request not found' }, 404)
    const now = new Date().toISOString()
    const updated: any = { ...existing }
    if (user.role === 'hod') {
      if (existing.department !== user.department) return c.json({ error: 'Forbidden' }, 403)
      if (existing.status !== 'pending_hod' && existing.status !== 'pending') return c.json({ error: 'Not pending HOD approval' }, 400)
      if (status === 'approved') updated.status = 'pending_admin'; else updated.status = 'rejected'
      updated.hod_reviewed_by = user.name
      updated.hod_reviewed_at = now
    } else if (user.role === 'admin') {
      if (existing.status !== 'pending_admin') return c.json({ error: 'Manager can act only after TL approval' }, 400)
      updated.reviewed_by = user.name
      updated.reviewed_at = now
      if (status === 'approved') {
        updated.status = 'approved'
        const emp = await kv.get(`user:${existing.employee_id}`)
        if (emp) {
          const newBal = (emp.leave_balance || 0) - existing.days_requested
          const updUser = { ...emp, leave_balance: newBal }
          await kv.set(`user:${existing.employee_id}`, updUser)
          const empMirror = await kv.get(`employee:${existing.employee_id}`)
          if (empMirror) await kv.set(`employee:${existing.employee_id}`, { ...empMirror, leave_balance: newBal })
        }
      } else {
        updated.status = 'rejected'
      }
    } else {
      return c.json({ error: 'Forbidden' }, 403)
    }
    await kv.set(`leave_request:${id}`, updated)
    return c.json(updated)
  } catch {
    return c.json({ error: 'Failed to update leave request' }, 500)
  }
})

app.get('/make-server-ea915b54/holidays', requireAuth, async (c) => {
  try {
    const rows = await kv.getByPrefix('holiday:')
  return c.json(rows)
  } catch {
    return c.json({ error: 'Failed to fetch holidays' }, 500)
  }
})

app.post('/make-server-ea915b54/holidays', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'admin') return c.json({ error: 'Admin access required' }, 403)
    const data = await c.req.json()
    const id = crypto.randomUUID()
    const row = { id, ...data, created_at: new Date().toISOString() }
    await kv.set(`holiday:${id}`, row)
    return c.json(row)
  } catch {
    return c.json({ error: 'Failed to add holiday' }, 500)
  }
})

app.delete('/make-server-ea915b54/holidays/:id', requireAuth, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'admin') return c.json({ error: 'Admin access required' }, 403)
    const id = c.req.param('id')
    await kv.del(`holiday:${id}`)
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Failed to delete holiday' }, 500)
  }
})

app.get('/make-server-ea915b54/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

Deno.serve(app.fetch)
