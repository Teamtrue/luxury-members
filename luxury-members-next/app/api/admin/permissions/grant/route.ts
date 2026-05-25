import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';
import { can } from '@/lib/auth/rbac';
import { grantPermissionSchema } from '@/lib/validation/admin';
import { writeAuditLog } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('lm_session')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const actor = await verifySessionToken(token);
  if (!actor || !can('roles.write', actor.permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = grantPermissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'permission.grant',
    entityType: 'user',
    entityId: parsed.data.targetUserId,
    metadata: { permission: parsed.data.permission }
  });

  return NextResponse.json({ ok: true, grant: parsed.data });
}
