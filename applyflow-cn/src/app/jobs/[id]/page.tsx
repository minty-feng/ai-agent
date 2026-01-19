'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomStickyCTA } from '@/components/ui/BottomStickyCTA';

// Mock data
const mockJob = {
  company: '字节跳动',
  position: '前端开发工程师',
  status: '已投',
  description: '负责字节跳动核心产品的前端开发工作...',
};

const mockSessions = [
  { id: 's1', date: '2026-01-19', score: 72 },
  { id: 's2', date: '2026-01-18', score: 65 },
];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [description, setDescription] = useState(mockJob.description);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('已保存');
    }, 500);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setKeywords(['TypeScript', 'React Hooks', '性能优化', '组件设计']);
      setSuggestions([
        '补充具体的性能优化案例，包括优化前后的数据对比（如首屏加载时间从3s降至1.2s）',
        '添加组件库或设计系统的搭建经验，说明规模（如支持20+业务线）',
        '强调跨端技术栈经验，如React Native或小程序开发背景'
      ]);
      setGenerated(true);
      setGenerating(false);
      
      // Scroll to output area
      setTimeout(() => {
        document.getElementById('customization-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制');
  };

  const startInterview = () => {
    const sessionId = Math.random().toString(36).substr(2, 9);
    router.push(`/jobs/${params.id}/sessions/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-20 md:pb-6">
      <TopBar
        title="岗位准备"
        backUrl="/jobs"
      />

      <div className="container-content py-6 space-y-6">
        {/* Job Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg md:text-xl font-medium text-text-primary">
                {mockJob.company} - {mockJob.position}
              </h2>
            </div>
            <Badge variant="gray">{mockJob.status}</Badge>
          </div>
        </div>

        {/* Job Description */}
        <Card title="岗位要求">
          <Textarea
            rows={10}
            value={description}
            onChange={setDescription}
            placeholder="粘贴岗位职责、任职要求..."
          />
          <Button
            variant="secondary"
            onClick={handleSave}
            loading={saving}
            className="mt-3"
          >
            保存
          </Button>
        </Card>

        {/* Customization */}
        <Card title="定制要点">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              生成关键词缺口 + 简历要点建议（更容易过筛）
            </p>

            {!generated && (
              <Button
                onClick={handleGenerate}
                loading={generating}
                disabled={!description.trim() || generating}
                fullWidth
              >
                {!description.trim() ? '先粘贴岗位要求' : '生成定制要点'}
              </Button>
            )}

            {generating && (
              <div>
                <div className="text-sm text-text-secondary mb-3">生成中，预计5–10秒...</div>
                <Skeleton rows={4} />
              </div>
            )}

            {generated && !generating && (
              <div id="customization-output" className="space-y-4 border border-border rounded-md p-4 animate-pulse-once">
                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">关键词缺口：</h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw, idx) => (
                      <Chip key={idx} onClick={() => copyToClipboard(kw)}>
                        {kw}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-text-primary mb-2">要点建议：</h4>
                  <ul className="space-y-2">
                    {suggestions.map((sug, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                        <span className="text-text-secondary">•</span>
                        <span className="flex-1">{sug}</span>
                        <Button
                          variant="secondary"
                          onClick={() => copyToClipboard(sug)}
                          className="text-xs px-2 py-1 flex-shrink-0"
                        >
                          复制
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={startInterview} fullWidth className="hidden md:block">
                  基于该岗位开始模拟面试
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Mock Sessions */}
        <Card title="模拟记录">
          {mockSessions.length === 0 ? (
            <p className="text-sm text-text-secondary">暂无模拟记录</p>
          ) : (
            <div className="space-y-3">
              {mockSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-secondary">{session.date}</span>
                    <span className="text-sm font-medium text-text-primary">总分 {session.score}</span>
                  </div>
                  <Link href={`/r/${session.id}`} className="text-sm text-primary hover:underline">
                    查看报告
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Sticky CTA for Mobile */}
      <BottomStickyCTA>
        <Button onClick={startInterview} fullWidth>
          开始模拟面试
        </Button>
      </BottomStickyCTA>
    </div>
  );
}
