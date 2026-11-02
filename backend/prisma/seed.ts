/**
 * 种子数据：后台管理员 + 演示业务数据
 * 运行：npm run prisma:seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始写入种子数据…');

  // ==================== 清理历史演示数据 ====================
  // 只清理 openid 以 dev-openid- 开头的演示用户（级联删除其旅行册/游记/账本/账单），
  // 不影响通过真实微信登录产生的数据。
  const demoUsers = await prisma.user.findMany({
    where: { openid: { startsWith: 'dev-openid-' } },
    select: { id: true },
  });
  if (demoUsers.length) {
    const ids = demoUsers.map((u) => u.id);
    await prisma.invitation.deleteMany({ where: { creatorId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log(`✓ 已清理 ${ids.length} 个历史演示用户及其内容`);
  }

  // ==================== 后台管理员 ====================
  const admins = [
    { account: 'admin', password: 'admin123', name: '超级管理员', role: 'super' },
    { account: 'reviewer', password: 'reviewer123', name: '内容审核员', role: 'reviewer' },
    { account: 'operator', password: 'operator123', name: '运营管理员', role: 'admin' },
  ];

  for (const a of admins) {
    await prisma.adminUser.upsert({
      where: { account: a.account },
      create: {
        account: a.account,
        passwordHash: await bcrypt.hash(a.password, 10),
        name: a.name,
        role: a.role,
      },
      update: { name: a.name, role: a.role },
    });
  }
  console.log(`✓ 管理员账号 ${admins.length} 个（admin/admin123）`);

  // ==================== 系统配置 ====================
  const configs = [
    { key: 'site_name', value: '途记旅行日记', remark: '站点名称' },
    { key: 'contact_email', value: 'support@trail.cn', remark: '联系邮箱' },
    { key: 'service_phone', value: '400-820-1234', remark: '客服电话' },
    { key: 'audit_journal', value: 'false', remark: '游记发布前需审核' },
    { key: 'audit_image', value: 'false', remark: '游记图片需审核' },
    { key: 'audit_user', value: 'false', remark: '新用户注册需审核' },
  ];
  for (const c of configs) {
    await prisma.systemConfig.upsert({
      where: { key: c.key },
      create: c,
      update: { remark: c.remark },
    });
  }
  console.log(`✓ 系统配置 ${configs.length} 项`);

  // ==================== 演示用户 ====================
  // 注意：首个用户 openid 与小程序「本地降级登录」保持一致（code = local-dev-user），
  // 这样小程序在未配置真实 AppID 时登录后即可看到全部演示数据。
  const usersData = [
    { openid: 'dev-openid-local-dev-user', nickname: '旅行者小王', signature: '把世界装进记忆里', userIdCode: '10086001', phone: '13800005678' },
    { openid: 'dev-openid-u2', nickname: '周同学', signature: '在路上', userIdCode: '10086002', phone: '13900001234' },
    { openid: 'dev-openid-u3', nickname: '陈小姐', signature: '记录每一次出发', userIdCode: '10086003', phone: '13700009999' },
    { openid: 'dev-openid-u4', nickname: '林山', signature: '山不过来，我就过去', userIdCode: '10086004', phone: '13600002211' },
    { openid: 'dev-openid-u5', nickname: '阿哲', signature: '摄影爱好者', userIdCode: '10086005', phone: '13500003344' },
    { openid: 'dev-openid-u6', nickname: '小满', signature: '', userIdCode: '10086006', phone: '13400005566' },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    users[u.nickname] = await prisma.user.upsert({
      where: { openid: u.openid },
      create: u,
      update: { nickname: u.nickname, signature: u.signature },
    });
  }
  const owner = users['旅行者小王'];
  console.log(`✓ 演示用户 ${usersData.length} 个`);

  // 幂等：先清掉该用户历史演示数据
  await prisma.travelBook.deleteMany({ where: { ownerId: owner.id } });

  // ==================== 旅行册 ====================
  const booksData = [
    { name: '川西之旅', startTime: '2025-06-01', endTime: '2025-06-15', bookIsPublic: true },
    { name: '厦门慢时光', startTime: '2025-02-10', endTime: '2025-02-16', bookIsPublic: false },
    { name: '云南之南', startTime: '2024-09-20', endTime: '2024-09-30', bookIsPublic: true },
  ];

  const books: Record<string, any> = {};
  for (const b of booksData) {
    const created = await prisma.travelBook.create({
      data: {
        name: b.name,
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
        bookIsPublic: b.bookIsPublic,
        ownerId: owner.id,
        members: {
          create: [
            { userId: owner.id, role: 'creator' },
            { userId: users['周同学'].id, role: 'member' },
            { userId: users['陈小姐'].id, role: 'member' },
          ],
        },
      },
    });
    books[b.name] = created;
  }
  console.log(`✓ 旅行册 ${booksData.length} 本`);

  // ==================== 标注点 ====================
  const spotsData = [
    { book: '川西之旅', locationName: '色达 · 五明佛学院', province: '四川', city: '甘孜', longitude: 100.33, latitude: 32.27, markStatus: 'visited', visitDate: '2024-10-03' },
    { book: '川西之旅', locationName: '稻城 · 亚丁村', province: '四川', city: '稻城', longitude: 100.3, latitude: 29.03, markStatus: 'visited', visitDate: '2024-10-05' },
    { book: '川西之旅', locationName: '康定 · 木格措', province: '四川', city: '康定', longitude: 101.96, latitude: 30.05, markStatus: 'planned' },
    { book: '川西之旅', locationName: '成都 · 宽窄巷子', province: '四川', city: '成都', longitude: 104.06, latitude: 30.57, markStatus: 'visited', visitDate: '2024-10-01' },
    { book: '川西之旅', locationName: '拉萨 · 布达拉宫', province: '西藏', city: '拉萨', longitude: 91.14, latitude: 29.65, markStatus: 'planned' },
    { book: '云南之南', locationName: '大理 · 洱海', province: '云南', city: '大理', longitude: 100.18, latitude: 25.61, markStatus: 'visited', visitDate: '2024-09-22' },
    { book: '云南之南', locationName: '丽江 · 古城', province: '云南', city: '丽江', longitude: 100.23, latitude: 26.86, markStatus: 'visited', visitDate: '2024-09-24' },
    { book: '云南之南', locationName: '香格里拉 · 独克宗', province: '云南', city: '迪庆', longitude: 99.7, latitude: 27.83, markStatus: 'planned' },
    { book: '厦门慢时光', locationName: '厦门 · 鼓浪屿', province: '福建', city: '厦门', longitude: 118.07, latitude: 24.45, markStatus: 'visited', visitDate: '2025-02-11' },
    { book: '厦门慢时光', locationName: '武夷山 · 九曲溪', province: '福建', city: '南平', longitude: 118.04, latitude: 27.76, markStatus: 'visited', visitDate: '2025-02-14' },
  ];

  const spots: Record<string, any> = {};
  for (const s of spotsData) {
    const created = await prisma.mapSpot.create({
      data: {
        bookId: books[s.book].id,
        locationName: s.locationName,
        province: s.province,
        city: s.city,
        longitude: s.longitude,
        latitude: s.latitude,
        markStatus: s.markStatus,
        visitDate: s.visitDate ? new Date(s.visitDate) : null,
      },
    });
    spots[s.locationName] = created;
  }
  console.log(`✓ 标注点 ${spotsData.length} 个`);

  // ==================== 游记 ====================
  const journalsData = [
    {
      book: '川西之旅', spot: '稻城 · 亚丁村', title: '稻城亚丁，最后的净土',
      travelDate: '2024-10-05', weather: '晴朗', locationName: '四川 · 稻城亚丁',
      content: '牛奶海像一颗蓝宝石嵌在央迈勇雪山之间。清晨的洛绒牛场飘着薄雾，马帮的铃声从远处传来，风把经幡吹得猎猎作响。走了三个小时的山路，海拔四千五百米，每走十几步就要停下来喘气，但当那片碧蓝出现在眼前时，所有的疲惫都值了。',
      isPublic: true, auditStatus: 'pass',
    },
    {
      book: '川西之旅', spot: '色达 · 五明佛学院', title: '色达，信仰的红色之城',
      travelDate: '2024-10-03', weather: '多云', locationName: '四川 · 甘孜色达',
      content: '层层叠叠的红房子，在夕阳里慢慢地发亮。',
      isPublic: false, auditStatus: 'pass',
    },
    {
      book: '川西之旅', spot: null, title: '折多山垭口的云海',
      travelDate: '2024-10-01', weather: '多云', locationName: '四川 · 康定折多山',
      content: '云海在脚下铺开，经幡被风吹得很响。那一刻忽然明白了什么叫「身在云端」。',
      isPublic: false, auditStatus: 'pending',
    },
    {
      book: '云南之南', spot: '大理 · 洱海', title: '洱海边的下午',
      travelDate: '2024-09-22', weather: '晴朗', locationName: '云南 · 大理洱海',
      content: '租了一辆电动车，沿着环海西路慢慢骑。阳光很好，湖面上有细碎的光斑，路边是成片的花海。停在一家咖啡馆门口，点了一杯冰美式，看了一下午的云。',
      isPublic: true, auditStatus: 'pass',
    },
    {
      book: '厦门慢时光', spot: '厦门 · 鼓浪屿', title: '鼓浪屿的旧时光',
      travelDate: '2025-02-11', weather: '小雨', locationName: '福建 · 厦门鼓浪屿',
      content: '岛上没有车，只有弯弯曲曲的小巷和爬满三角梅的老别墅。雨后的石板路亮亮的，走在上面能听见自己的脚步声。',
      isPublic: true, auditStatus: 'pass',
    },
    {
      book: '厦门慢时光', spot: null, title: '初见海海',
      travelDate: '2025-02-13', weather: '多云', locationName: '福建 · 厦门环岛路',
      content: '（待补充）',
      isPublic: false, auditStatus: 'reject',
    },
  ];

  for (const j of journalsData) {
    await prisma.journal.create({
      data: {
        bookId: books[j.book].id,
        spotId: j.spot ? spots[j.spot].id : null,
        userId: owner.id,
        title: j.title,
        travelDate: new Date(j.travelDate),
        weather: j.weather,
        locationName: j.locationName,
        content: j.content,
        isPublic: j.isPublic,
        auditStatus: j.auditStatus,
      },
    });
  }
  console.log(`✓ 游记 ${journalsData.length} 篇`);

  // ==================== 账本 + 账单 ====================
  const ledgersData = [
    { book: '川西之旅', name: '川西之旅账本' },
    { book: '厦门慢时光', name: '厦门慢时光账本' },
    { book: '云南之南', name: '云南之南账本' },
  ];

  // 演示账单日期相对今天生成，保证账本统计（本周/本月/本年）始终有数据
  const dayAgo = (n: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return d;
  };

  const billsByLedger: Record<string, any[]> = {
    川西之旅账本: [
      { category: '餐饮', subCategory: '咖啡', billType: 'expense', amount: 42.0, remark: '观景台手冲', payWay: '微信支付', billDate: dayAgo(0) },
      { category: '交通', subCategory: '停车', billType: 'expense', amount: 20.0, remark: '景区停车场', payWay: '支付宝', billDate: dayAgo(0) },
      { category: '餐饮', subCategory: '晚餐', billType: 'expense', amount: 86.0, remark: '藏式火锅', payWay: '微信支付', billDate: dayAgo(1) },
      { category: '交通', subCategory: '打车', billType: 'expense', amount: 35.5, remark: '客栈到景区', payWay: '微信支付', billDate: dayAgo(1) },
      { category: '其他', subCategory: 'AA收款', billType: 'income', amount: 150.0, remark: '小明分摊', payWay: '', billDate: dayAgo(1) },
      { category: '门票', subCategory: '亚丁景区', billType: 'expense', amount: 270.0, remark: '景区门票 · 2人', payWay: '支付宝', billDate: dayAgo(2) },
      { category: '住宿', subCategory: '理塘酒店', billType: 'expense', amount: 380.0, remark: '含早 · 2晚', payWay: '微信支付', billDate: dayAgo(3) },
      { category: '购物', subCategory: '街角小店', billType: 'expense', amount: 28.0, remark: '手冲 · 1杯', payWay: '微信支付', billDate: dayAgo(5) },
      { category: '餐饮', subCategory: '午餐', billType: 'expense', amount: 62.0, remark: '牦牛肉面', payWay: '微信支付', billDate: dayAgo(6) },
      { category: '交通', subCategory: '大巴', billType: 'expense', amount: 118.0, remark: '康定 → 稻城', payWay: '微信支付', billDate: dayAgo(9) },
    ],
    厦门慢时光账本: [
      { category: '住宿', subCategory: '民宿', billType: 'expense', amount: 680.0, remark: '海边民宿 · 2晚', payWay: '微信支付', billDate: dayAgo(34) },
      { category: '餐饮', subCategory: '海鲜', billType: 'expense', amount: 228.0, remark: '八市海鲜加工', payWay: '支付宝', billDate: dayAgo(35) },
      { category: '交通', subCategory: '轮渡', billType: 'expense', amount: 70.0, remark: '往返鼓浪屿', payWay: '微信支付', billDate: dayAgo(36) },
      { category: '其他', subCategory: 'AA收款', billType: 'income', amount: 400.0, remark: '伙伴分摊', payWay: '', billDate: dayAgo(36) },
    ],
    云南之南账本: [
      { category: '交通', subCategory: '机票', billType: 'expense', amount: 1280.0, remark: '往返昆明', payWay: '支付宝', billDate: dayAgo(65) },
      { category: '住宿', subCategory: '客栈', billType: 'expense', amount: 960.0, remark: '大理 · 4晚', payWay: '微信支付', billDate: dayAgo(66) },
      { category: '门票', subCategory: '洱海游船', billType: 'expense', amount: 142.0, remark: '2人', payWay: '微信支付', billDate: dayAgo(67) },
      { category: '餐饮', subCategory: '白族菜', billType: 'expense', amount: 168.0, remark: '喜洲古镇', payWay: '微信支付', billDate: dayAgo(68) },
      { category: '其他', subCategory: 'AA收款', billType: 'income', amount: 2000.0, remark: '伙伴分摊', payWay: '', billDate: dayAgo(69) },
    ],
  };

  for (const l of ledgersData) {
    const ledger = await prisma.ledger.create({
      data: {
        bookId: books[l.book].id,
        name: l.name,
        ownerId: owner.id,
        members: {
          create: [
            { userId: owner.id, role: 'creator' },
            { userId: users['周同学'].id, role: 'admin' },
            { userId: users['陈小姐'].id, role: 'member' },
          ],
        },
      },
    });

    const bills = billsByLedger[l.name] || [];
    for (const b of bills) {
      await prisma.bill.create({
        data: {
          ledgerId: ledger.id,
          userId: owner.id,
          category: b.category,
          subCategory: b.subCategory,
          billType: b.billType,
          amount: b.amount,
          remark: b.remark,
          payWay: b.payWay,
          billDate: b.billDate instanceof Date ? b.billDate : new Date(b.billDate),
        },
      });
    }
  }
  console.log(`✓ 账本 ${ledgersData.length} 个（含 ${Object.values(billsByLedger).flat().length} 笔账单）`);

  // ==================== 邀请码 ====================
  await prisma.invitation.deleteMany({ where: { creatorId: owner.id } });
  const ledger1 = await prisma.ledger.findFirst({ where: { name: '川西之旅账本' } });
  if (ledger1) {
    await prisma.invitation.create({
      data: {
        code: 'QJ8K26',
        ledgerId: ledger1.id,
        creatorId: owner.id,
        expireAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
  }
  console.log('✓ 邀请码 QJ8K26');

  console.log('\n种子数据写入完成。');
  console.log('后台登录：admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
