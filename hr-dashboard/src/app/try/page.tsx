'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TryPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('请先粘贴岗位要求');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate AI generation
    setTimeout(() => {
      setQuestions([
        '请描述一个你在项目中遇到的技术难题，以及你是如何解决的？包括具体的技术方案和最终结果。',
        '在团队协作中，你如何处理与其他成员意见不一致的情况？请举一个具体的例子。',
        '请分享一个你主导的项目经历，重点说明你的角色、采取的关键行动以及项目的最终成果（最好包含数据）。'
      ]);
      setLoading(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification (simplified)
    alert('已复制');
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="试用：生成3道面试题" />
      
      <div className="container-content py-6 space-y-6">
        {error && (
          <Callout variant="error">
            {error}
          </Callout>
        )}

        <Card>
          <div className="space-y-4">
            <Textarea
              label="粘贴岗位要求/职位描述"
              placeholder="例如：岗位职责、任职要求..."
              rows={8}
              value={jobDescription}
              onChange={setJobDescription}
            />

            <div>
              <button
                onClick={() => setShowResume(!showResume)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                {showResume ? '− 折叠简历' : '+ 粘贴简历（更贴合）'}
              </button>
              {showResume && (
                <Textarea
                  placeholder="粘贴你的简历内容..."
                  rows={6}
                  value={resume}
                  onChange={setResume}
                  className="mt-2"
                />
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              loading={loading}
              fullWidth
            >
              生成3道题
            </Button>
          </div>
        </Card>

        {loading && (
          <Card>
            <div className="text-sm text-text-secondary mb-3">生成中，预计5–10秒...</div>
            <Skeleton rows={3} />
          </Card>
        )}

        {questions.length > 0 && !loading && (
          <>
            <Card title="生成结果">
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-secondary mb-1">Q{idx + 1}</div>
                      <div className="text-sm text-text-primary leading-relaxed">{q}</div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => copyToClipboard(q)}
                      className="text-xs px-2 py-1"
                    >
                      复制
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Callout variant="info">
              <div className="space-y-3">
                <p className="font-medium">想要评分+复盘报告？</p>
                <Link href="/login">
                  <Button fullWidth>登录并完成一次模拟</Button>
                </Link>
              </div>
            </Callout>
          </>
        )}
      </div>
    </div>
  );
}
