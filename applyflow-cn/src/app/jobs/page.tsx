'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';

// Mock data
const mockJobs = [
  { id: '1', company: '字节跳动', position: '前端开发', status: '一面', updatedAt: '2天前' },
  { id: '2', company: '阿里巴巴', position: 'Product Manager', status: '已投', updatedAt: '1天前' },
  { id: '3', company: '腾讯', position: 'Java后端', status: 'Offer', updatedAt: '3天前' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '已投', label: '已投' },
  { value: '一面', label: '一面' },
  { value: '二面', label: '二面' },
  { value: '终面', label: '终面' },
  { value: 'Offer', label: 'Offer' },
  { value: '已拒', label: '已拒' },
];

const getStatusVariant = (status: string): 'gray' | 'blue' | 'green' | 'red' => {
  if (status === 'Offer') return 'green';
  if (status === '已拒') return 'red';
  if (status.includes('面')) return 'blue';
  return 'gray';
};

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title="岗位"
        rightAction={
          <Link href="/jobs/new">
            <Button className="hidden md:inline-flex">新增岗位</Button>
          </Link>
        }
      />

      <div className="container-content py-6 space-y-4">
        {/* Mobile: New Job Button */}
        <div className="md:hidden">
          <Link href="/jobs/new">
            <Button fullWidth>新增岗位</Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="搜索公司或岗位..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="md:w-40"
          />
        </div>

        {/* Web: Table */}
        <div className="hidden md:block">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">公司</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">岗位</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">更新于</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-text-primary">{job.company}</td>
                    <td className="px-4 py-3 text-sm text-text-primary">{job.position}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{job.updatedAt}</td>
                    <td className="px-4 py-3">
                      <Link href={`/jobs/${job.id}`} className="text-sm text-primary hover:underline">
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Cards */}
        <div className="md:hidden space-y-3">
          {mockJobs.map((job) => (
            <Card key={job.id}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-text-primary">{job.company}</div>
                    <div className="text-sm text-text-secondary">{job.position}</div>
                  </div>
                  <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                </div>
                <div className="text-xs text-text-secondary">更新：{job.updatedAt}</div>
                <Link href={`/jobs/${job.id}`}>
                  <Button variant="secondary" fullWidth className="mt-2">
                    打开 →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
