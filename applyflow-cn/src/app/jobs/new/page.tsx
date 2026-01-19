'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const sourceOptions = [
  { value: '', label: '选择来源' },
  { value: 'BOSS', label: 'BOSS直聘' },
  { value: '拉勾', label: '拉勾' },
  { value: '内推', label: '内推' },
  { value: '其他', label: '其他' },
];

export default function NewJobPage() {
  const router = useRouter();
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position.trim() || !description.trim()) {
      alert('请填写必填项');
      return;
    }

    setLoading(true);

    // Simulate job creation
    setTimeout(() => {
      // Mock job ID
      const jobId = Math.random().toString(36).substr(2, 9);
      router.push(`/jobs/${jobId}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="新增岗位" backUrl="/jobs" />

      <div className="container-content py-6">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="公司（选填）"
              placeholder="例如：阿里巴巴"
              value={company}
              onChange={setCompany}
            />

            <Input
              label="岗位"
              placeholder="例如：前端开发工程师"
              value={position}
              onChange={setPosition}
              required
            />

            <Textarea
              label="岗位要求/职位描述"
              placeholder="粘贴岗位职责、任职要求等内容..."
              rows={10}
              value={description}
              onChange={setDescription}
              required
            />

            <Select
              label="来源（选填）"
              value={source}
              onChange={setSource}
              options={sourceOptions}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              创建并开始准备
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
