import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { OperationLogService } from './operation-log.service';
import type { AdminPayload } from '../../common/decorators/current-admin.decorator';

/** 系统配置默认值（首次读取时自动落库） */
export const DEFAULT_CONFIGS: Record<string, { value: string; remark: string }> = {
  site_name: { value: '途记旅行日记', remark: '站点名称' },
  contact_email: { value: 'support@trail.cn', remark: '联系邮箱' },
  service_phone: { value: '400-820-1234', remark: '客服电话' },
  audit_journal: { value: 'true', remark: '游记发布前需审核' },
  audit_image: { value: 'false', remark: '游记图片需审核' },
  audit_user: { value: 'false', remark: '新用户注册需审核' },
};

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logs: OperationLogService,
  ) {}

  // ==================== 系统配置 ====================

  /** 读取全部配置，缺失的用默认值补齐并落库 */
  async getConfigs() {
    const rows = await this.prisma.systemConfig.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const result: Record<string, string> = {};
    const missing: { key: string; value: string; remark: string }[] = [];

    for (const [key, def] of Object.entries(DEFAULT_CONFIGS)) {
      if (map.has(key)) {
        result[key] = map.get(key)!;
      } else {
        result[key] = def.value;
        missing.push({ key, value: def.value, remark: def.remark });
      }
    }
    // 额外自定义配置也一并返回
    for (const r of rows) {
      if (!(r.key in result)) result[r.key] = r.value;
    }

    if (missing.length) {
      await this.prisma.$transaction(
        missing.map((m) =>
          this.prisma.systemConfig.create({
            data: { key: m.key, value: m.value, remark: m.remark },
          }),
        ),
      );
    }

    return {
      siteName: result.site_name,
      contactEmail: result.contact_email,
      servicePhone: result.service_phone,
      auditJournal: result.audit_journal === 'true',
      auditImage: result.audit_image === 'true',
      auditUser: result.audit_user === 'true',
    };
  }

  /** 批量保存配置 */
  async saveConfigs(admin: AdminPayload, body: Record<string, any>, ip?: string) {
    const mapping: Record<string, string> = {
      siteName: 'site_name',
      contactEmail: 'contact_email',
      servicePhone: 'service_phone',
      auditJournal: 'audit_journal',
      auditImage: 'audit_image',
      auditUser: 'audit_user',
    };

    const ops: { key: string; value: string }[] = [];
    for (const [field, key] of Object.entries(mapping)) {
      if (body[field] === undefined) continue;
      const raw = body[field];
      ops.push({ key, value: typeof raw === 'boolean' ? String(raw) : String(raw) });
    }
    if (!ops.length) throw new BusinessException(1001, '没有需要保存的配置项');

    await this.prisma.$transaction(
      ops.map((op) =>
        this.prisma.systemConfig.upsert({
          where: { key: op.key },
          create: { key: op.key, value: op.value, remark: DEFAULT_CONFIGS[op.key]?.remark },
          update: { value: op.value },
        }),
      ),
    );

    await this.logs.write(admin, {
      module: 'system',
      action: 'update',
      content: `修改系统设置：${ops.map((o) => o.key).join('、')}`,
      ip,
    });

    return this.getConfigs();
  }

  // ==================== 操作日志 ====================

  async listLogs(params: any) {
    return this.logs.list({
      page: Number(params.page) || 1,
      pageSize: Number(params.pageSize) || 20,
      module: params.module,
      keyword: params.keyword,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  // ==================== 管理员账号 ====================

  async listAdmins() {
    const rows = await this.prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((a) => ({
      id: a.id,
      account: a.account,
      name: a.name,
      role: a.role,
      roleText:
        a.role === 'super' ? '超级管理员' : a.role === 'admin' ? '管理员' : '审核员',
      status: a.status,
      statusText: a.status === 'normal' ? '正常' : '禁用',
      lastLoginAt: a.lastLoginAt,
      lastLoginIp: a.lastLoginIp,
      createdAt: a.createdAt,
    }));
  }

  async createAdmin(
    admin: AdminPayload,
    body: { account: string; password: string; name: string; role?: string },
    ip?: string,
  ) {
    if (!body.account || !body.password || !body.name) {
      throw new BusinessException(1001, '账号、密码、姓名均为必填');
    }
    if (body.password.length < 6) {
      throw new BusinessException(1001, '密码至少 6 位');
    }
    const exists = await this.prisma.adminUser.findUnique({ where: { account: body.account } });
    if (exists) throw new BusinessException(1001, '该账号已存在');

    const created = await this.prisma.adminUser.create({
      data: {
        account: body.account,
        passwordHash: await bcrypt.hash(body.password, 10),
        name: body.name,
        role: ['super', 'admin', 'reviewer'].includes(body.role || '') ? body.role! : 'admin',
      },
    });

    await this.logs.write(admin, {
      module: 'system',
      action: 'create',
      targetId: created.id,
      content: `新增管理员「${body.name}（${body.account}）」`,
      ip,
    });

    const { passwordHash: _omit, ...safe } = created;
    return safe;
  }

  async resetPassword(
    admin: AdminPayload,
    id: string,
    password: string,
    ip?: string,
  ) {
    if (!password || password.length < 6) {
      throw new BusinessException(1001, '密码至少 6 位');
    }
    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw new BusinessException(404, '管理员不存在', 404);

    await this.prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });

    await this.logs.write(admin, {
      module: 'system',
      action: 'update',
      targetId: id,
      content: `重置管理员「${target.name}」的密码`,
      ip,
    });
    return { success: true };
  }

  async updateAdminStatus(admin: AdminPayload, id: string, status: string, ip?: string) {
    if (!['normal', 'disabled'].includes(status)) {
      throw new BusinessException(1001, '状态值不合法');
    }
    if (id === admin.id) throw new BusinessException(1001, '不能禁用当前登录的账号');

    const target = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!target) throw new BusinessException(404, '管理员不存在', 404);
    if (target.role === 'super' && status === 'disabled') {
      throw new BusinessException(1001, '不能禁用超级管理员');
    }

    await this.prisma.adminUser.update({ where: { id }, data: { status } });
    await this.logs.write(admin, {
      module: 'system',
      action: status === 'normal' ? 'enable' : 'disable',
      targetId: id,
      content: `${status === 'normal' ? '启用' : '禁用'}管理员「${target.name}」`,
      ip,
    });
    return { id, status };
  }
}
