// Acquisition domain types — bloggers, B2B leads, VC leads, ad inventory

export interface AcquisitionBlogger {
  id: string
  userId?: string // Who created/owns this KOL record
  name: string
  platform: string
  followers: string
  email: string
  status: string // 未联系, 已发邮件, 谈判中, 已签约, 已拒绝
  commission: string
  cost: string
  createdAt: string
  updatedAt: string
}

export interface AcquisitionB2BLead {
  id: string
  userId?: string // Who created/owns this lead
  name: string
  region: string
  contact: string
  email: string
  source: string // 手工录入, BD引荐, 官网注册
  status: string // 初步接触, 跟进中, 合同拟定, 已转化, 已流失
  estValue: string
  type: "follow" | "publish" // 线索类型：follow=我跟进的客户, publish=我发布的需求
  isPublic?: boolean // 是否发布到线索池（仅type=publish时有效）
  publishAt?: string // 发布时间
  cooperationCount?: number // 收到的合作申请数
  description?: string // 需求描述（仅type=publish时使用）
  createdAt: string
  updatedAt: string
}

export interface AcquisitionVCLead {
  id: string
  userId?: string // Who created/owns this connection
  name: string
  region: string
  contact: string
  email: string
  source: string // 手工录入, BD引荐
  status: string // 待联系, 初步沟通, 尽调, 投资 (follow类型) / 已发布/未发布 (publish类型)
  focus: string
  type: "follow" | "publish" // 线索类型：follow=我跟进的VC机构, publish=我发布的融资需求
  isPublic?: boolean // 是否发布到VC线索池（仅type=publish时有效）
  publishAt?: string // 发布时间
  cooperationCount?: number // 收到的对接申请数
  fundingAmount?: string // 融资金额（仅type=publish时使用）
  fundingStage?: string // 融资阶段（仅type=publish时使用）
  description?: string // 需求描述（仅type=publish时使用）
  createdAt: string
  updatedAt: string
}

export interface AcquisitionAd {
  id: string
  userId?: string // Who published this ad (Merchant)
  brand: string
  type: string // 视频广告, 互动广告, 横幅图片
  duration: string
  reward: string
  status: string // 待审核, 投放中, 已暂停, 已下架
  views: string
  videoUrl?: string // 广告视频地址
  createdAt: string
  updatedAt: string
}

// User Profile related to the market/acquisition system
export interface UserMarketProfile {
  id: string
  email?: string // 用户邮箱
  nickname?: string
  avatar?: string
  fullName?: string // 真实姓名
  idNumber?: string // 身份证号
  isRealNameVerified: boolean
  isInfluencerVerified: boolean
  isMerchantVerified: boolean
  isRealInfluencer: boolean // Effective delivery >= 1
  isRealMerchant: boolean // Ad participation >= 1 or spend >= 50
  totalEarnings: string
  balance: string
  adViewsCount: number // For "Real User" status (>= 3)
}

// Participation records for ads
export interface AdParticipation {
  id: string
  userId: string
  adId: string
  status: string // 进行中, 已完成
  rewardEarned: string
  completedAt?: string
}

export interface ScaffoldProject {
  id: string
  userId: string
  projectName: string
  template: string
  zipUrl: string
  status: string
  createdAt: string
}

export interface CooperationApplication {
  id: string
  leadId: string // 关联的B2B线索ID
  leadOwnerId: string // 线索发布者ID
  applicantId: string // 申请人ID
  applicantName: string // 申请人/公司名称
  applicantContact: string // 申请人联系方式
  applicantEmail: string // 申请人邮箱
  message?: string // 申请留言
  status: "pending" | "approved" | "rejected" // 申请状态
  createdAt: string
  updatedAt: string
}

export interface AcquisitionBootstrapData {
  bloggers: AcquisitionBlogger[]
  allBloggers?: AcquisitionBlogger[]
  b2bLeads: AcquisitionB2BLead[]
  vcLeads: AcquisitionVCLead[] // 保留兼容旧代码
  vcFollowLeads?: AcquisitionVCLead[] // 跟进型 VC 线索
  vcPublishLeads?: AcquisitionVCLead[] // 发布型融资需求
  ads: AcquisitionAd[]
  profile?: UserMarketProfile
  bloggerProfile?: AcquisitionBlogger
  participations?: AdParticipation[]
  scaffoldProjects?: ScaffoldProject[]
}
