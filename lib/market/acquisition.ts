import { randomUUID } from "crypto"
import { dbAdapter } from "./db-adapter"
import type {
  AcquisitionBlogger,
  AcquisitionB2BLead,
  AcquisitionVCLead,
  AcquisitionAd,
  AcquisitionBootstrapData,
  UserMarketProfile,
  AdParticipation,
} from "./acquisition-types"

type RawRow = Record<string, any>

const BLOGGERS_TABLE = "acquisition_bloggers"
const B2B_LEADS_TABLE = "acquisition_b2b_leads"
const VC_LEADS_TABLE = "acquisition_vc_leads"
const ADS_TABLE = "acquisition_ads"
const PROFILE_TABLE = "user_market_profiles"
const USERS_TABLE = "users"
const PARTICIPATION_TABLE = "ad_participations"
const SCAFFOLD_PROJECTS_TABLE = "scaffold_projects"

function nowIso() {
  return new Date().toISOString()
}

function safeString(value: unknown, fallback = "") {
  const normalized = String(value ?? "").trim()
  return normalized || fallback
}

// ==========================================
// Row mappers
// ==========================================

function mapBloggerRow(row: RawRow): AcquisitionBlogger {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    platform: safeString(row?.platform),
    followers: safeString(row?.followers),
    email: safeString(row?.email),
    status: safeString(row?.status, "未联系"),
    commission: safeString(row?.commission),
    cost: safeString(row?.cost),
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapB2BLeadRow(row: RawRow): AcquisitionB2BLead {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    source: safeString(row?.source, "手工录入"),
    status: safeString(row?.status, "初步接触"),
    estValue: safeString(row?.est_value || row?.estValue),
    type: (row?.type as "follow" | "publish") || "follow",
    isPublic: !!row?.isPublic,
    publishAt: row?.publishAt ? safeString(row.publishAt) : undefined,
    cooperationCount: Number(row?.cooperationCount || 0),
    description: row?.description ? safeString(row.description) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapVCLeadRow(row: RawRow): AcquisitionVCLead {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    name: safeString(row?.name),
    region: safeString(row?.region),
    contact: safeString(row?.contact),
    email: safeString(row?.email),
    source: safeString(row?.source, "手工录入"),
    status: safeString(row?.status, "待联系"),
    focus: safeString(row?.focus),
    type: (row?.type as "follow" | "publish") || "follow",
    isPublic: !!row?.isPublic,
    publishAt: row?.publishAt ? safeString(row.publishAt) : undefined,
    cooperationCount: Number(row?.cooperationCount || 0),
    fundingAmount: row?.fundingAmount ? safeString(row.fundingAmount) : undefined,
    fundingStage: row?.fundingStage ? safeString(row.fundingStage) : undefined,
    description: row?.description ? safeString(row.description) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapAdRow(row: RawRow): AcquisitionAd {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    brand: safeString(row?.brand),
    type: safeString(row?.type, "视频广告"),
    duration: safeString(row?.duration, "30s"),
    reward: safeString(row?.reward),
    status: safeString(row?.status, "待审核"),
    views: safeString(row?.views, "0"),
    videoUrl: row?.videoUrl ? safeString(row.videoUrl) : undefined,
    createdAt: safeString(row?.created_at || row?.createdAt, nowIso()),
    updatedAt: safeString(row?.updated_at || row?.updatedAt || row?.created_at || row?.createdAt, nowIso()),
  }
}

function mapProfileRow(row: RawRow): UserMarketProfile {
  const id = safeString(row?.id || row?._id)
  // If legacy rows have hard-coded "Demo User", derive nickname from id instead.
  const rawNickname = safeString(row?.nickname, "")
  const derivedNickname =
    id.includes("@") ? id.split("@")[0] : id
  const nickname =
    !rawNickname || rawNickname === "Demo User" ? derivedNickname || "用户" : rawNickname

  return {
    id,
    email: safeString(row?.email) || undefined,
    nickname,
    avatar: safeString(row?.avatar, ""),
    fullName: safeString(row?.fullName),
    idNumber: safeString(row?.idNumber),
    isRealNameVerified: !!row?.isRealNameVerified,
    isInfluencerVerified: !!row?.isInfluencerVerified,
    isMerchantVerified: !!row?.isMerchantVerified,
    isRealInfluencer: !!row?.isRealInfluencer,
    isRealMerchant: !!row?.isRealMerchant,
    totalEarnings: safeString(row?.totalEarnings, "0"),
    balance: safeString(row?.balance, "0"),
    adViewsCount: Number(row?.adViewsCount || 0),
  }
}

function mapParticipationRow(row: RawRow): AdParticipation {
  return {
    id: safeString(row?.id || row?._id),
    userId: safeString(row?.userId),
    adId: safeString(row?.adId),
    status: safeString(row?.status, "进行中"),
    rewardEarned: safeString(row?.rewardEarned, "0"),
    completedAt: row?.completedAt ? safeString(row.completedAt) : undefined,
  }
}

// ==========================================
// Public API
// ==========================================

export async function loadAcquisitionBootstrap(userId: string | null): Promise<AcquisitionBootstrapData> {
  // 如果没有 userId，返回游客视图数据
  if (!userId) {
    const allAdsRows = await dbAdapter.loadRows(ADS_TABLE, { status: "投放中" })
    return {
      bloggers: [],
      b2bLeads: [],
      vcLeads: [],
      ads: allAdsRows.map(mapAdRow),
      profile: undefined,
      participations: [],
      scaffoldProjects: [],
    }
  }

  // 强制重置当前用户的认证状态为未认证（用于演示恢复状态）
  // 在生产环境中，这应该通过数据库管理界面或特定管理接口操作
  // 注释掉以下代码以允许认证状态持久化
  // await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
  //   isRealNameVerified: false,
  //   isInfluencerVerified: false,
  //   isMerchantVerified: false,
  //   fullName: "",
  //   idNumber: "",
  //   balance: "0",
  //   totalEarnings: "0",
  //   adViewsCount: 0
  // })

  // 1. Get user profile (create if not exists)
  // 同时从 users 表获取用户邮箱
  const [profileRows, userRows] = await Promise.all([
    dbAdapter.loadRows(PROFILE_TABLE, { id: userId }),
    dbAdapter.loadRows(USERS_TABLE, { _id: userId })
  ])
  
  // 获取用户邮箱
  const userEmail = userRows.length > 0 ? safeString(userRows[0].email) : undefined
  
  let profile: UserMarketProfile
  if (profileRows.length === 0) {
    const derivedNickname =
      userId.includes("@") ? userId.split("@")[0] : userId
    profile = {
      id: userId,
      email: userEmail,
      nickname: derivedNickname || "用户",
      avatar: "",
      isRealNameVerified: false,
      isInfluencerVerified: false,
      isMerchantVerified: false,
      isRealInfluencer: false,
      isRealMerchant: false,
      totalEarnings: "0",
      balance: "0",
      adViewsCount: 0,
    }
    await dbAdapter.insertRow(PROFILE_TABLE, profile)
  } else {
    profile = mapProfileRow(profileRows[0])
    // 添加 email 到 profile
    profile.email = userEmail
  }

  // 2. Load all available ads for "Task Mode"
  const allAdsRows = await dbAdapter.loadRows(ADS_TABLE, { status: "投放中" })
  
  // 3. Load user's own data for "Influencer" and "Merchant" modes
  const [myBloggerRows, myB2BRows, myVCRows, myAdRows, myParticipations, myScaffoldRows, allBloggerRows] = await Promise.all([
    dbAdapter.loadRows(BLOGGERS_TABLE, { userId }),
    dbAdapter.loadRows(B2B_LEADS_TABLE, { userId }),
    dbAdapter.loadRows(VC_LEADS_TABLE, { userId }),
    dbAdapter.loadRows(ADS_TABLE, { userId }),
    dbAdapter.loadRows(PARTICIPATION_TABLE, { userId }),
    dbAdapter.loadRows(SCAFFOLD_PROJECTS_TABLE, { userId }),
    dbAdapter.loadRows(BLOGGERS_TABLE, {}), // Load all bloggers for the pool
  ])

  // 分离 VC 线索类型
  const allVCLeads = myVCRows.map(mapVCLeadRow)
  const vcFollowLeads = allVCLeads.filter(l => l.type === "follow")
  const vcPublishLeads = allVCLeads.filter(l => l.type === "publish")

  return {
    bloggers: myBloggerRows.map(mapBloggerRow),
    allBloggers: allBloggerRows.map(mapBloggerRow),
    b2bLeads: myB2BRows.map(mapB2BLeadRow),
    vcLeads: allVCLeads, // 保留兼容旧代码
    vcFollowLeads,
    vcPublishLeads,
    ads: (() => {
      // 去重：以 id 为准，myAdRows 优先（包含最新状态）
      const map = new Map<string, any>()
      allAdsRows.map(mapAdRow).forEach(ad => map.set(ad.id, ad))
      myAdRows.map(mapAdRow).forEach(ad => map.set(ad.id, ad))
      return Array.from(map.values())
    })(),
    profile,
    participations: myParticipations.map(mapParticipationRow),
    scaffoldProjects: myScaffoldRows.map((r: RawRow) => ({
      id: safeString(r.id || r._id),
      userId: safeString(r.userId),
      projectName: safeString(r.projectName),
      template: safeString(r.template),
      zipUrl: safeString(r.zipUrl),
      status: safeString(r.status, "completed"),
      createdAt: safeString(r.created_at || r.createdAt, nowIso()),
    })),
  }
}

// ==========================================
// Actions
// ==========================================

export async function insertScaffoldProject(userId: string, data: {
  projectName: string
  template: string
  zipUrl: string
  status?: string
}) {
  const row: RawRow = {
    id: `proj-${randomUUID().slice(0, 8)}`,
    userId,
    projectName: data.projectName,
    template: data.template,
    zipUrl: data.zipUrl,
    status: data.status || "completed",
  }
  return await dbAdapter.insertRow(SCAFFOLD_PROJECTS_TABLE, row)
}

export async function insertBlogger(userId: string, data: {
  name: string
  platform: string
  followers: string
  email: string
  cost: string
  commission: string
}): Promise<AcquisitionBlogger> {
  const row: RawRow = {
    id: `bl-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    platform: data.platform,
    followers: data.followers,
    email: data.email,
    status: "未联系",
    commission: data.commission,
    cost: data.cost,
  }
  const result = await dbAdapter.insertRow(BLOGGERS_TABLE, row)
  return mapBloggerRow(result)
}

export async function insertB2BLead(userId: string, data: {
  name: string
  region: string
  contact: string
  email?: string
  estValue: string
  type?: "follow" | "publish"
  description?: string
}): Promise<AcquisitionB2BLead> {
  const isPublish = data.type === "publish"
  const row: RawRow = {
    id: `b2b-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    region: data.region,
    contact: data.contact,
    email: data.email || "",
    source: "手工录入",
    status: isPublish ? "待发布" : "初步接触",
    est_value: data.estValue,
    type: data.type || "follow",
    isPublic: isPublish ? false : undefined,
    description: data.description || "",
  }
  const result = await dbAdapter.insertRow(B2B_LEADS_TABLE, row)
  return mapB2BLeadRow(result)
}

export async function insertVCLead(userId: string, data: {
  name: string
  region: string
  contact: string
  email?: string
  focus: string
  type?: "follow" | "publish"
  fundingAmount?: string
  fundingStage?: string
  description?: string
}): Promise<AcquisitionVCLead> {
  const isPublish = data.type === "publish"
  const row: RawRow = {
    id: `vc-${randomUUID().slice(0, 8)}`,
    userId,
    name: data.name,
    region: data.region,
    contact: data.contact,
    email: data.email || "",
    source: "手工录入",
    status: isPublish ? "未发布" : "待联系",
    focus: data.focus,
    type: data.type || "follow",
    isPublic: isPublish ? false : undefined,
    fundingAmount: data.fundingAmount || "",
    fundingStage: data.fundingStage || "",
    description: data.description || "",
  }
  const result = await dbAdapter.insertRow(VC_LEADS_TABLE, row)
  return mapVCLeadRow(result)
}

export async function insertAd(userId: string, data: {
  brand: string
  type: string
  duration: string
  reward: string
  videoUrl?: string
}): Promise<AcquisitionAd> {
  const row: RawRow = {
    id: `ad-${randomUUID().slice(0, 8)}`,
    userId,
    brand: data.brand,
    type: data.type,
    duration: data.duration,
    reward: data.reward,
    status: "待审核",
    views: "0",
    videoUrl: data.videoUrl || "",
  }
  const result = await dbAdapter.insertRow(ADS_TABLE, row)
  return mapAdRow(result)
}

export async function participateInAd(userId: string, adId: string, reward: string): Promise<AdParticipation> {
  const row: RawRow = {
    id: `p-${randomUUID().slice(0, 8)}`,
    userId,
    adId,
    status: "进行中",
    rewardEarned: reward,
  }
  const result = await dbAdapter.insertRow(PARTICIPATION_TABLE, row)
  return mapParticipationRow(result)
}

export async function completeAdTask(userId: string, participationId: string): Promise<AdParticipation | null> {
  const result = await dbAdapter.updateRow(PARTICIPATION_TABLE, { id: participationId, userId }, {
    status: "已完成",
    completedAt: nowIso(),
  })
  if (result) {
    // Update profile earnings/views
    const profile = (await dbAdapter.loadRows(PROFILE_TABLE, { id: userId }))[0]
    if (profile) {
      const currentEarnings = parseFloat(profile.totalEarnings || "0")
      const currentBalance = parseFloat(profile.balance || "0")
      const reward = parseFloat(result.rewardEarned || "0")
      
      await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
        totalEarnings: (currentEarnings + reward).toString(),
        balance: (currentBalance + reward).toString(),
        adViewsCount: (profile.adViewsCount || 0) + 1,
      })
    }
  }
  return result ? mapParticipationRow(result) : null
}

export async function updateProfileVerification(userId: string, type: "realName" | "influencer" | "merchant", data?: { fullName?: string; idNumber?: string }): Promise<UserMarketProfile | null> {
  const patch: RawRow = {}
  if (type === "realName") {
    patch.isRealNameVerified = true
    if (data?.fullName) patch.fullName = data.fullName
    if (data?.idNumber) patch.idNumber = data.idNumber
  }
  if (type === "influencer") patch.isInfluencerVerified = true
  if (type === "merchant") patch.isMerchantVerified = true
  
  const result = await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, patch)
  return result ? mapProfileRow(result) : null
}

export async function updateB2BLeadStatus(userId: string, id: string, status: string): Promise<AcquisitionB2BLead | null> {
  // First check if lead exists and is type=follow
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id, userId })
  if (leads.length === 0) return null
  
  const lead = leads[0]
  // Only follow type leads can update status
  if (lead.type !== "follow") {
    throw new Error("发布型线索不支持更新跟进进度")
  }
  
  const result = await dbAdapter.updateRow(B2B_LEADS_TABLE, { id, userId }, { status, updated_at: nowIso() })
  return result ? mapB2BLeadRow(result) : null
}

export async function updateVCLeadStatus(userId: string, id: string, status: string): Promise<AcquisitionVCLead | null> {
  // First check if lead exists and is type=follow
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id, userId })
  if (leads.length === 0) return null

  const lead = leads[0]
  // Only follow type leads can update status
  if (lead.type !== "follow") {
    throw new Error("发布型融资需求不支持更新跟进进度")
  }

  const result = await dbAdapter.updateRow(VC_LEADS_TABLE, { id, userId }, { status, updated_at: nowIso() })
  return result ? mapVCLeadRow(result) : null
}

export async function updateBloggerStatus(userId: string, id: string, status: string): Promise<AcquisitionBlogger | null> {
  const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id, userId }, { status })
  return result ? mapBloggerRow(result) : null
}

export async function updateAd(userId: string, id: string, patch: { duration?: string; reward?: string; status?: string; videoUrl?: string }): Promise<AcquisitionAd | null> {
  const result = await dbAdapter.updateRow(ADS_TABLE, { id, userId }, patch)
  return result ? mapAdRow(result) : null
}

export async function deleteBlogger(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(BLOGGERS_TABLE, { id, userId })
}

export async function deleteB2BLead(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(B2B_LEADS_TABLE, { id, userId })
}

export async function deleteVCLead(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(VC_LEADS_TABLE, { id, userId })
}

export async function deleteAd(userId: string, id: string): Promise<boolean> {
  return await dbAdapter.deleteRow(ADS_TABLE, { id, userId })
}

export async function upsertBloggerProfile(userId: string, data: {
  name: string
  platform: string
  followers: string
  email: string
  cost: string
  commission: string
}): Promise<AcquisitionBlogger> {
  // Check if blogger profile already exists for this user
  const existingRows = await dbAdapter.loadRows(BLOGGERS_TABLE, { userId })
  
  if (existingRows.length > 0) {
    // Update existing profile
    const existingId = safeString(existingRows[0].id || existingRows[0]._id)
    const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id: existingId, userId }, {
      name: data.name,
      platform: data.platform,
      followers: data.followers,
      email: data.email,
      cost: data.cost,
      commission: data.commission,
      updated_at: nowIso(),
    })
    return mapBloggerRow(result!)
  } else {
    // Insert new profile
    const row: RawRow = {
      id: `bl-${randomUUID().slice(0, 8)}`,
      userId,
      name: data.name,
      platform: data.platform,
      followers: data.followers,
      email: data.email,
      status: "未联系",
      commission: data.commission,
      cost: data.cost,
    }
    const result = await dbAdapter.insertRow(BLOGGERS_TABLE, row)
    return mapBloggerRow(result)
  }
}

export async function deleteBloggerSoft(userId: string, id: string): Promise<boolean> {
  // Soft delete by updating status to "已删除"
  const result = await dbAdapter.updateRow(BLOGGERS_TABLE, { id, userId }, { 
    status: "已删除",
    updated_at: nowIso(),
  })
  return !!result
}

export async function submitUnifiedForm(userId: string, data: any): Promise<any> {
  // Store form submission in a generic form submissions table or process based on form type
  const row: RawRow = {
    id: `form-${randomUUID().slice(0, 8)}`,
    userId,
    formType: data?.formType || "unknown",
    formData: JSON.stringify(data),
    status: "待处理",
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  // For now, just return success - actual implementation would save to database
  return { success: true, id: row.id, message: "Form submitted successfully" }
}

export async function loadUserTransactions(userId: string): Promise<any[]> {
  // Return empty array for now - actual implementation would load from transactions table
  return []
}

export async function requestWithdrawal(userId: string, amount: string): Promise<{ success: boolean; message: string }> {
  // Validate amount
  const withdrawalAmount = parseFloat(amount)
  if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
    return { success: false, message: "Invalid withdrawal amount" }
  }
  
  // Get user profile to check balance
  const profileRows = await dbAdapter.loadRows(PROFILE_TABLE, { id: userId })
  if (profileRows.length === 0) {
    return { success: false, message: "User profile not found" }
  }
  
  const currentBalance = parseFloat(profileRows[0].balance || "0")
  if (currentBalance < withdrawalAmount) {
    return { success: false, message: "Insufficient balance" }
  }
  
  // Update balance
  const newBalance = currentBalance - withdrawalAmount
  await dbAdapter.updateRow(PROFILE_TABLE, { id: userId }, {
    balance: newBalance.toString(),
    updated_at: nowIso(),
  })
  
  return { success: true, message: "Withdrawal request submitted successfully" }
}

// ==========================================
// B2B Leads Pool - Publish/Unpublish
// ==========================================

const COOPERATION_APPLICATIONS_TABLE = "cooperation_applications"

export async function publishB2BLead(userId: string, leadId: string, isPublic: boolean): Promise<AcquisitionB2BLead | null> {
  // First check if lead exists and is type=publish
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: leadId, userId })
  if (leads.length === 0) return null
  
  const lead = leads[0]
  // Only publish type leads can be published to pool
  if (lead.type !== "publish") {
    throw new Error("跟进型线索不能发布到线索池")
  }
  
  const updateData: RawRow = {
    isPublic,
    updated_at: nowIso(),
  }
  
  if (isPublic) {
    updateData.publishAt = nowIso()
  }
  
  const result = await dbAdapter.updateRow(B2B_LEADS_TABLE, { id: leadId, userId }, updateData)
  return result ? mapB2BLeadRow(result) : null
}

export async function loadPublicB2BLeads(filters: {
  region?: string
  status?: string
  minEstValue?: number
  maxEstValue?: number
  sortBy?: "newest" | "highestValue"
} = {}): Promise<AcquisitionB2BLead[]> {
  // Load all public leads (only type=publish and isPublic=true)
  const allPublicLeads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { type: "publish", isPublic: true })
  
  let leads = allPublicLeads.map(mapB2BLeadRow)
  
  // Apply filters
  if (filters.region) {
    leads = leads.filter(l => l.region.includes(filters.region!))
  }
  
  if (filters.status) {
    leads = leads.filter(l => l.status === filters.status)
  }
  
  // Sort
  if (filters.sortBy === "newest") {
    leads.sort((a, b) => new Date(b.publishAt || b.createdAt).getTime() - new Date(a.publishAt || a.createdAt).getTime())
  } else if (filters.sortBy === "highestValue") {
    leads.sort((a, b) => {
      const valueA = parseFloat(a.estValue.replace(/[^0-9.]/g, "")) || 0
      const valueB = parseFloat(b.estValue.replace(/[^0-9.]/g, "")) || 0
      return valueB - valueA
    })
  }
  
  return leads
}

export async function applyForCooperation(
  leadId: string,
  applicantId: string,
  data: {
    applicantName: string
    applicantContact: string
    applicantEmail: string
    message?: string
  }
): Promise<{ success: boolean; message: string }> {
  // Get the lead to verify it exists and is public
  const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: leadId })
  const lead = leads.length > 0 ? leads[0] : null
  if (!lead) {
    return { success: false, message: "线索不存在" }
  }
  
  // Must be publish type
  if (lead.type !== "publish") {
    return { success: false, message: "该线索不支持合作申请" }
  }
  
  if (!lead.isPublic) {
    return { success: false, message: "该需求未公开发布" }
  }
  
  // Cannot apply to own lead
  if (lead.userId === applicantId) {
    return { success: false, message: "不能申请自己的线索" }
  }
  
  // 检查申请次数，最多 15 次
  const existingApplications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, {
    leadId,
    applicantId,
  })

  const MAX_APPLY = 15
  if (existingApplications.length >= MAX_APPLY) {
    return { success: false, message: `您已向该企业发起 ${MAX_APPLY} 次申请，已达上限` }
  }
  
  // Create application
  const row: RawRow = {
    id: `app-${randomUUID().slice(0, 8)}`,
    leadId,
    leadType: "b2b",
    leadOwnerId: lead.userId,
    applicantId,
    applicantName: data.applicantName,
    applicantContact: data.applicantContact,
    applicantEmail: data.applicantEmail,
    message: data.message || "",
    status: "pending",
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  
  await dbAdapter.insertRow(COOPERATION_APPLICATIONS_TABLE, row)
  
  // Increment cooperation count on the lead
  const currentCount = lead.cooperationCount || 0
  await dbAdapter.updateRow(
    B2B_LEADS_TABLE,
    { id: leadId },
    { cooperationCount: currentCount + 1 }
  )
  
  return { success: true, message: "合作申请已提交" }
}

export async function loadMyReceivedApplications(leadOwnerId: string): Promise<any[]> {
  // 只查 B2B 类型，VC 由 loadMyVCReceivedApplications 负责
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { leadOwnerId, leadType: "b2b" })
  
  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId),
    leadOwnerId: safeString(app.leadOwnerId),
    applicantId: safeString(app.applicantId),
    applicantName: safeString(app.applicantName),
    applicantContact: safeString(app.applicantContact),
    applicantEmail: safeString(app.applicantEmail),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function loadMySentApplications(applicantId: string): Promise<any[]> {
  // 只查 B2B 类型
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { applicantId, leadType: "b2b" })
  
  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId),
    leadOwnerId: safeString(app.leadOwnerId),
    applicantId: safeString(app.applicantId),
    applicantName: safeString(app.applicantName),
    applicantContact: safeString(app.applicantContact),
    applicantEmail: safeString(app.applicantEmail),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function updateApplicationStatus(
  leadOwnerId: string,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<{ success: boolean; message: string }> {
  // Verify the application belongs to this owner
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { id: applicationId })
  const application = applications.length > 0 ? applications[0] : null
  
  if (!application) {
    return { success: false, message: "申请记录不存在" }
  }
  
  if (application.leadOwnerId !== leadOwnerId) {
    return { success: false, message: "无权处理此申请" }
  }
  
  await dbAdapter.updateRow(
    COOPERATION_APPLICATIONS_TABLE,
    { id: applicationId },
    { status, updated_at: nowIso() }
  )
  
  // 同意：只录入到 B（线索发布者）的跟进列表，A 只在申请记录里看到已同意状态
  if (status === "approved") {
    try {
      // 获取原始线索信息，补充到 B 的跟进里
      const leads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { id: application.leadId })
      const originalLead = leads[0] || null

      const row: RawRow = {
        id: `b2b-${randomUUID().slice(0, 8)}`,
        userId: leadOwnerId,                    // B 的跟进列表
        name: application.applicantName,
        region: originalLead?.region || "",
        contact: application.applicantContact || "",
        email: application.applicantEmail || "",
        source: "合作申请",
        status: "初步接触",
        est_value: originalLead?.est_value || originalLead?.estValue || "",
        type: "follow",
        fromApplicationId: applicationId,       // 标记来源
        description: `来自合作申请。留言：${application.message || "无"}`,
      }
      await dbAdapter.insertRow(B2B_LEADS_TABLE, row)

      // 在申请记录上标记 applicantVisible，让 A 能在「我的合作」里看到
      await dbAdapter.updateRow(
        COOPERATION_APPLICATIONS_TABLE,
        { id: applicationId },
        { applicantVisible: true }
      )
    } catch (error) {
      console.error("Failed to auto-add to B follow list:", error)
    }
  }
  
  return { success: true, message: status === "approved" ? "已同意合作申请" : "已拒绝合作申请" }
}

// ==========================================
// Load my B2B leads separated by type
// ==========================================

export async function loadMyB2BLeads(userId: string): Promise<{
  followList: AcquisitionB2BLead[]
  publishList: AcquisitionB2BLead[]
}> {
  const allLeads = await dbAdapter.loadRows(B2B_LEADS_TABLE, { userId })
  const leads = allLeads.map(mapB2BLeadRow)

  return {
    followList: leads.filter(l => l.type === "follow"),
    publishList: leads.filter(l => l.type === "publish"),
  }
}

// ==========================================
// VC Leads Pool - Publish/Unpublish
// ==========================================

export async function publishVCLead(userId: string, leadId: string, isPublic: boolean): Promise<AcquisitionVCLead | null> {
  // First check if lead exists and is type=publish
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: leadId, userId })
  if (leads.length === 0) return null

  const lead = leads[0]
  // Only publish type leads can be published to pool
  if (lead.type !== "publish") {
    throw new Error("跟进型VC线索不能发布到线索池")
  }

  const updateData: RawRow = {
    isPublic,
    status: isPublic ? "已发布" : "未发布",
    updated_at: nowIso(),
  }

  if (isPublic) {
    updateData.publishAt = nowIso()
  }

  const result = await dbAdapter.updateRow(VC_LEADS_TABLE, { id: leadId, userId }, updateData)
  return result ? mapVCLeadRow(result) : null
}

export async function loadPublicVCLeads(filters: {
  region?: string
  focus?: string
  minFunding?: number
  maxFunding?: number
  sortBy?: "newest" | "highestFunding"
} = {}): Promise<AcquisitionVCLead[]> {
  // Load all public leads (only type=publish and isPublic=true)
  const allPublicLeads = await dbAdapter.loadRows(VC_LEADS_TABLE, { type: "publish", isPublic: true })

  let leads = allPublicLeads.map(mapVCLeadRow)

  // Apply filters
  if (filters.region) {
    leads = leads.filter(l => l.region.includes(filters.region!))
  }

  if (filters.focus) {
    leads = leads.filter(l => l.focus.includes(filters.focus!))
  }

  // Sort
  if (filters.sortBy === "newest") {
    leads.sort((a, b) => new Date(b.publishAt || b.createdAt).getTime() - new Date(a.publishAt || a.createdAt).getTime())
  } else if (filters.sortBy === "highestFunding") {
    leads.sort((a, b) => {
      const fundingA = parseFloat(a.fundingAmount?.replace(/[^0-9.]/g, "") || "0") || 0
      const fundingB = parseFloat(b.fundingAmount?.replace(/[^0-9.]/g, "") || "0") || 0
      return fundingB - fundingA
    })
  }

  return leads
}

export async function applyForVCCooperation(
  leadId: string,
  applicantId: string,
  data: {
    applicantName: string
    applicantContact: string
    applicantEmail: string
    message?: string
  }
): Promise<{ success: boolean; message: string }> {
  // Get the lead to verify it exists and is public
  const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: leadId })
  const lead = leads.length > 0 ? leads[0] : null
  if (!lead) {
    return { success: false, message: "融资需求不存在" }
  }

  // Must be publish type
  if (lead.type !== "publish") {
    return { success: false, message: "该线索不支持对接申请" }
  }

  if (!lead.isPublic) {
    return { success: false, message: "该融资需求未公开发布" }
  }

  // Cannot apply to own lead
  if (lead.userId === applicantId) {
    return { success: false, message: "不能申请自己的融资需求" }
  }

  // 检查申请次数，最多 15 次
  const existingApplications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, {
    leadId,
    applicantId,
    leadType: "vc",
  })

  const MAX_APPLY = 15
  if (existingApplications.length >= MAX_APPLY) {
    return { success: false, message: `您已向该融资需求发起 ${MAX_APPLY} 次申请，已达上限` }
  }

  // Create application
  const row: RawRow = {
    id: `app-${randomUUID().slice(0, 8)}`,
    leadId,
    leadType: "vc",
    leadOwnerId: lead.userId,
    applicantId,
    applicantName: data.applicantName,
    applicantContact: data.applicantContact,
    applicantEmail: data.applicantEmail,
    message: data.message || "",
    status: "pending",
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  await dbAdapter.insertRow(COOPERATION_APPLICATIONS_TABLE, row)

  // Increment cooperation count on the lead
  const currentCount = lead.cooperationCount || 0
  await dbAdapter.updateRow(
    VC_LEADS_TABLE,
    { id: leadId },
    { cooperationCount: currentCount + 1 }
  )

  return { success: true, message: "对接申请已提交" }
}

export async function loadMyVCReceivedApplications(leadOwnerId: string): Promise<any[]> {
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { leadOwnerId, leadType: "vc" })

  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId),
    leadType: safeString(app.leadType, "vc"),
    leadOwnerId: safeString(app.leadOwnerId),
    applicantId: safeString(app.applicantId),
    applicantName: safeString(app.applicantName),
    applicantContact: safeString(app.applicantContact),
    applicantEmail: safeString(app.applicantEmail),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function loadMyVCSentApplications(applicantId: string): Promise<any[]> {
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { applicantId, leadType: "vc" })

  // Sort by newest first
  applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return applications.map(app => ({
    id: safeString(app.id || app._id),
    leadId: safeString(app.leadId),
    leadType: safeString(app.leadType, "vc"),
    leadOwnerId: safeString(app.leadOwnerId),
    applicantId: safeString(app.applicantId),
    applicantName: safeString(app.applicantName),
    applicantContact: safeString(app.applicantContact),
    applicantEmail: safeString(app.applicantEmail),
    message: safeString(app.message),
    status: safeString(app.status, "pending"),
    createdAt: safeString(app.created_at || app.createdAt, nowIso()),
    updatedAt: safeString(app.updated_at || app.updatedAt || app.created_at || app.createdAt, nowIso()),
  }))
}

export async function updateVCApplicationStatus(
  leadOwnerId: string,
  applicationId: string,
  status: "approved" | "rejected"
): Promise<{ success: boolean; message: string }> {
  // Verify the application belongs to this owner
  const applications = await dbAdapter.loadRows(COOPERATION_APPLICATIONS_TABLE, { id: applicationId })
  const application = applications.length > 0 ? applications[0] : null

  if (!application) {
    return { success: false, message: "申请记录不存在" }
  }

  if (application.leadOwnerId !== leadOwnerId) {
    return { success: false, message: "无权处理此申请" }
  }

  await dbAdapter.updateRow(
    COOPERATION_APPLICATIONS_TABLE,
    { id: applicationId },
    { status, updated_at: nowIso() }
  )

  // 同意：只录入到 B（线索发布者）的跟进列表，A 只在申请记录里看到已同意状态
  if (status === "approved") {
    try {
      const leads = await dbAdapter.loadRows(VC_LEADS_TABLE, { id: application.leadId })
      const originalLead = leads[0] || null

      const row: RawRow = {
        id: `vc-${randomUUID().slice(0, 8)}`,
        userId: leadOwnerId,                    // B 的跟进列表
        name: application.applicantName,
        region: originalLead?.region || "",
        contact: application.applicantContact || "",
        email: application.applicantEmail || "",
        source: "对接申请",
        status: "待联系",
        focus: originalLead?.focus || "",
        type: "follow",
        fromApplicationId: applicationId,
        description: `来自对接申请。留言：${application.message || "无"}`,
      }
      await dbAdapter.insertRow(VC_LEADS_TABLE, row)

      await dbAdapter.updateRow(
        COOPERATION_APPLICATIONS_TABLE,
        { id: applicationId },
        { applicantVisible: true }
      )
    } catch (error) {
      console.error("Failed to auto-add to B VC follow list:", error)
    }
  }

  return { success: true, message: status === "approved" ? "已同意对接申请" : "已拒绝对接申请" }
}

// ==========================================
// Load my VC leads separated by type
// ==========================================

export async function loadMyVCLeads(userId: string): Promise<{
  followList: AcquisitionVCLead[]
  publishList: AcquisitionVCLead[]
}> {
  const allLeads = await dbAdapter.loadRows(VC_LEADS_TABLE, { userId })
  const leads = allLeads.map(mapVCLeadRow)

  return {
    followList: leads.filter(l => l.type === "follow"),
    publishList: leads.filter(l => l.type === "publish"),
  }
}
