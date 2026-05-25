import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { grantPermissionSchema } from '@/lib/validation/admin';
import { writeAuditLog } from '@/lib/audit/log';
import { revokeUserPermission } from '@/lib/db/admin-permissions';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('roles.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = grantPermissionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await revokeUserPermission(parsed.data.targetUserId, parsed.data.permission);

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'permission.revoke',
    entityType: 'user',
    entityId: parsed.data.targetUserId,
    metadata: { permission: parsed.data.permission }
  });

  return NextResponse.json({ ok: true, revoke: parsed.data });
}
