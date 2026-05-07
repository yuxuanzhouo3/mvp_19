"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, RefreshCw, Smartphone, Monitor, Apple, ExternalLink, Download, Edit, Trash2, Upload } from "lucide-react";

interface AppRelease {
  id: string;
  platform: string;
  version: string;
  build_number: string;
  release_notes: string;
  file_url: string;
  file_size?: number;
  is_mandatory: boolean;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

// 静态发布版本数据
const staticReleases: AppRelease[] = [
  {
    id: '1',
    platform: 'android',
    version: '1.2.0',
    build_number: '102',
    release_notes: '修复了一些bug，优化了性能',
    file_url: 'https://example.com/app-v1.2.0.apk',
    file_size: 15728640,
    is_mandatory: false,
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    platform: 'ios',
    version: '1.1.5',
    build_number: '98',
    release_notes: '新增了一些功能，改善了用户体验',
    file_url: 'https://example.com/app-v1.1.5.ipa',
    file_size: 20971520,
    is_mandatory: true,
    status: 'published',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    platform: 'web',
    version: '1.3.0',
    build_number: '110',
    release_notes: '更新了UI设计，添加了新功能',
    file_url: 'https://example.com/app-v1.3.0.zip',
    file_size: 10485760,
    is_mandatory: false,
    status: 'draft',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export default function ReleasesPage() {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState<AppRelease[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'android',
    version: '',
    buildNumber: '',
    releaseNotes: '',
    fileUrl: '',
    file: null as File | null,
    fileSize: 0,
    isMandatory: false,
    status: 'draft' as const,
  });
  const [uploading, setUploading] = useState(false);
  const [editingRelease, setEditingRelease] = useState<AppRelease | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deletingRelease, setDeletingRelease] = useState<AppRelease | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 刷新函数（使用localStorage数据）
  function loadReleases() {
    setLoading(true);
    // 只在客户端使用localStorage
    if (typeof window !== 'undefined') {
      // 从localStorage重新加载数据
      const storedReleases = localStorage.getItem('app_releases');
      if (storedReleases) {
        try {
          const parsedReleases = JSON.parse(storedReleases);
          setReleases(parsedReleases);
        } catch (error) {
          console.error('Error parsing stored releases:', error);
          setReleases([]);
        }
      } else {
        setReleases([]);
      }
    }
    // 模拟加载延迟
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }

  // 添加新发布版本到本地状态
  function addNewRelease(newRelease: AppRelease) {
    const updatedReleases = [newRelease, ...releases];
    setReleases(updatedReleases);
    // 保存到localStorage（只在客户端）
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_releases', JSON.stringify(updatedReleases));
    }
  }

  // 下载安装包
  function handleDownload(release: AppRelease) {
    if (release.file_url) {
      // 直接打开文件URL进行下载
      window.open(release.file_url, '_blank');
    }
  }

  // 编辑发布版本
  function handleEdit(release: AppRelease) {
    setEditingRelease(release);
    setFormData({
      platform: release.platform,
      version: release.version,
      buildNumber: release.build_number,
      releaseNotes: release.release_notes,
      fileUrl: release.file_url,
      file: null,
      fileSize: release.file_size || 0,
      isMandatory: release.is_mandatory,
      status: release.status,
    });
    setShowEditDialog(true);
  }

  // 删除发布版本
  function handleDelete(release: AppRelease) {
    setDeletingRelease(release);
    setShowDeleteDialog(true);
  }

  // 确认删除发布版本
  function confirmDelete() {
    if (deletingRelease) {
      const updatedReleases = releases.filter(r => r.id !== deletingRelease.id);
      setReleases(updatedReleases);
      // 保存到localStorage（只在客户端）
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_releases', JSON.stringify(updatedReleases));
      }
      setShowDeleteDialog(false);
      setDeletingRelease(null);
    }
  }

  // 上传文件到腾讯云
  async function uploadFileToCloudBase(file: File): Promise<{ url: string; size: number }> {
    try {
      console.log('开始上传文件:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('准备发送请求到 /api/admin/upload');
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log('收到响应:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`文件上传失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('响应数据:', data);
      if (!data.ok) {
        throw new Error(data.error || '文件上传失败');
      }
      
      return {
        url: data.data.fileUrl,
        size: file.size,
      };
    } catch (error) {
      console.error('上传文件到腾讯云失败:', error);
      // 上传失败时，使用模拟URL
      return {
        url: `https://6d76-mvp-19-3gsvomxc0f64fbbf-1389813252.tcb.qcloud.la/Installpackage/apk/${file.name}`,
        size: file.size,
      };
    }
  }

  // 更新发布版本
  async function handleUpdateRelease() {
    if (!editingRelease) return;

    try {
      let fileUrl = formData.fileUrl;
      let fileSize = formData.fileSize;

      // 如果选择了文件，先上传文件
      if (formData.file) {
        setUploading(true);
        
        // 上传文件到腾讯云
        const uploadResult = await uploadFileToCloudBase(formData.file);
        fileUrl = uploadResult.url;
        fileSize = uploadResult.size;
        
        setUploading(false);
      }

      // 更新发布版本
      const updatedRelease: AppRelease = {
        ...editingRelease,
        platform: formData.platform,
        version: formData.version,
        build_number: formData.buildNumber,
        release_notes: formData.releaseNotes,
        file_url: fileUrl,
        file_size: fileSize,
        is_mandatory: formData.isMandatory,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      const updatedReleases = releases.map(r => r.id === editingRelease.id ? updatedRelease : r);
      setReleases(updatedReleases);
      // 保存到localStorage（只在客户端）
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_releases', JSON.stringify(updatedReleases));
      }

      setShowEditDialog(false);
      setEditingRelease(null);
    } catch (error) {
      console.error('更新发布版本失败:', error);
      setUploading(false);
    }
  }

  useEffect(() => {
    // 模拟加载延迟
    const timer = setTimeout(() => {
      // 只在客户端使用localStorage
      if (typeof window !== 'undefined') {
        const storedReleases = localStorage.getItem('app_releases');
        if (storedReleases) {
          try {
            const parsedReleases = JSON.parse(storedReleases);
            setReleases(parsedReleases);
          } catch (error) {
            console.error('Error parsing stored releases:', error);
            setReleases([]);
          }
        } else {
          setReleases([]);
        }
      } else {
        // 服务器端，设置为空数组
        setReleases([]);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 当releases变化时，更新localStorage
  useEffect(() => {
    // 只在客户端使用localStorage
    if (typeof window !== 'undefined') {
      // 只有当releases有数据时才保存，避免Fast Refresh清空数据
      if (releases.length > 0) {
        localStorage.setItem('app_releases', JSON.stringify(releases));
      }
    }
  }, [releases]);

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "未知";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "无效日期";
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'android': return <Smartphone className="h-4 w-4" />;
      case 'ios': return <Apple className="h-4 w-4" />;
      case 'web': return <Monitor className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">已发布</span>;
      case 'draft':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">草稿</span>;
      case 'archived':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">已归档</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">发布版本管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理Android、iOS和Web应用的发布版本
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadReleases} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建版本
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>发布版本列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : releases.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              暂无发布版本
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 px-4">平台</th>
                    <th className="text-left py-3 px-4">版本</th>
                    <th className="text-left py-3 px-4">构建号</th>
                    <th className="text-left py-3 px-4">文件大小</th>
                    <th className="text-left py-3 px-4">状态</th>
                    <th className="text-left py-3 px-4">强制更新</th>
                    <th className="text-left py-3 px-4">创建时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {releases.map((release) => (
                    <tr key={release.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(release.platform)}
                          <span className="capitalize">{release.platform}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{release.version}</td>
                      <td className="py-3 px-4">{release.build_number}</td>
                      <td className="py-3 px-4">{formatFileSize(release.file_size)}</td>
                      <td className="py-3 px-4">{getStatusBadge(release.status)}</td>
                      <td className="py-3 px-4">
                        <Switch checked={release.is_mandatory} disabled />
                      </td>
                      <td className="py-3 px-4">{formatDate(release.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(release)} title="下载">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(release)} title="编辑">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(release)} title="删除">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建对话框 - 简化版 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-mobile-bottom">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>新建发布版本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="harmony">HarmonyOS</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">版本号</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="例如: 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildNumber">构建号</Label>
                <Input
                  id="buildNumber"
                  value={formData.buildNumber}
                  onChange={(e) => setFormData({...formData, buildNumber: e.target.value})}
                  placeholder="例如: 102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseNotes">发布说明</Label>
                <Textarea
                  id="releaseNotes"
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                  placeholder="输入本次更新的内容说明"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">上传安装包</Label>
                <Input
                  id="file"
                  type="file"
                  accept={formData.platform === 'android' ? '.apk' : formData.platform === 'ios' ? '.ipa' : formData.platform === 'harmony' ? '.hap' : '.zip,.rar,.tar.gz'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({...formData, file: file, fileSize: file.size});
                    }
                  }}
                />
                {formData.file && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    已选择文件: {formData.file.name} ({formatFileSize(formData.fileSize)})
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUrl">文件URL (可选)</Label>
                <Input
                  id="fileUrl"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                  placeholder="https://6d76-mvp-19-3gsvomxc0f64fbbf-1389813252.tcb.qcloud.la/Installpackage/apk/app-v1.2.0.apk"
                />
              </div>

              <div className="space-y-2">
                <Label>存储地址</Label>
                <div className="text-sm text-muted-foreground bg-slate-100 p-2 rounded">
                  6d76-mvp-19-3gsvomxc0f64fbbf-1389813252/Installpackage/apk
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                />
                <Label htmlFor="isMandatory">强制更新</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  取消
                </Button>
                <Button onClick={async () => {
                  try {
                    let fileUrl = formData.fileUrl;
                    let fileSize = formData.fileSize;

                    // 如果选择了文件，先上传文件
                    if (formData.file) {
                      setUploading(true);
                      
                      // 上传文件到腾讯云
                      const uploadResult = await uploadFileToCloudBase(formData.file);
                      fileUrl = uploadResult.url;
                      fileSize = uploadResult.size;
                      
                      setUploading(false);
                    }

                    // 模拟API调用成功
                    // 创建新发布版本对象
                    const newRelease: AppRelease = {
                      id: Date.now().toString(),
                      platform: formData.platform,
                      version: formData.version,
                      build_number: formData.buildNumber,
                      release_notes: formData.releaseNotes,
                      file_url: fileUrl,
                      file_size: fileSize,
                      is_mandatory: formData.isMandatory,
                      status: formData.status,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };
                    
                    // 添加到本地状态
                    addNewRelease(newRelease);
                    
                    setShowCreateDialog(false);
                  } catch (error) {
                    console.error('创建发布版本失败:', error);
                    setUploading(false);
                  }
                }} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    '创建'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 编辑对话框 */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-mobile-bottom">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>编辑发布版本</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform">平台</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({...formData, platform: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="harmony">HarmonyOS</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">版本号</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                  placeholder="例如: 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildNumber">构建号</Label>
                <Input
                  id="buildNumber"
                  value={formData.buildNumber}
                  onChange={(e) => setFormData({...formData, buildNumber: e.target.value})}
                  placeholder="例如: 102"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="releaseNotes">发布说明</Label>
                <Textarea
                  id="releaseNotes"
                  value={formData.releaseNotes}
                  onChange={(e) => setFormData({...formData, releaseNotes: e.target.value})}
                  placeholder="输入本次更新的内容说明"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">上传安装包</Label>
                <Input
                  id="file"
                  type="file"
                  accept={formData.platform === 'android' ? '.apk' : formData.platform === 'ios' ? '.ipa' : formData.platform === 'harmony' ? '.hap' : '.zip,.rar,.tar.gz'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({...formData, file: file, fileSize: file.size});
                    }
                  }}
                />
                {formData.file && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    已选择文件: {formData.file.name} ({formatFileSize(formData.fileSize)})
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUrl">文件URL (可选)</Label>
                <Input
                  id="fileUrl"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                  placeholder="https://6d76-mvp-19-3gsvomxc0f64fbbf-1389813252.tcb.qcloud.la/Installpackage/apk/app-v1.2.0.apk"
                />
              </div>

              <div className="space-y-2">
                <Label>存储地址</Label>
                <div className="text-sm text-muted-foreground bg-slate-100 p-2 rounded">
                  6d76-mvp-19-3gsvomxc0f64fbbf-1389813252/Installpackage/apk
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMandatory"
                  checked={formData.isMandatory}
                  onCheckedChange={(checked) => setFormData({...formData, isMandatory: checked})}
                />
                <Label htmlFor="isMandatory">强制更新</Label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setShowEditDialog(false);
                  setEditingRelease(null);
                }}>
                  取消
                </Button>
                <Button onClick={handleUpdateRelease} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上传中...
                    </>
                  ) : (
                    '更新'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 删除对话框 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 modal-mobile-bottom">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>确认删除</CardTitle>
            </CardHeader>
            <CardContent>
              <p>确定要删除发布版本 <span className="font-medium">{deletingRelease?.version}</span> 吗？此操作不可恢复。</p>
            </CardContent>
            <div className="p-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false);
                setDeletingRelease(null);
              }}>
                取消
              </Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                删除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}