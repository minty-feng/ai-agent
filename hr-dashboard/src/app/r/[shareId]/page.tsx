'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ReportPage() {
  const [isOwner, setIsOwner] = useState(true); // Mock: check if current user is owner
  const [shareLink, setShareLink] = useState('');

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setShareLink(link);
    alert('已复制链接\n可发给朋友/导师获取建议');
  };

  const handleRevokeLink = () => {
    if (confirm('确定要撤销分享链接吗？')) {
      alert('链接已撤销');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title="面试复盘报告"
        rightAction={
          <Link href="/try">
            <Button variant="secondary" className="text-xs px-3 py-1">
              我也试试
            </Button>
          </Link>
        }
      />

      <div className="container-content py-6 space-y-6">
        {/* Optional company info (hidden by default) */}
        <div className="text-xs text-text-secondary text-center">
          公司：已隐藏 | 岗位：前端开发
        </div>

        {/* Overall Score */}
        <Card>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-bold text-primary mb-1">72</div>
                <div className="text-sm text-text-secondary">总分</div>
              </div>
              <Badge variant="red">需要加强（证据力）</Badge>
            </div>
            
            <div className="pt-3 border-t border-border">
              <p className="text-sm text-text-primary leading-relaxed">
                你的回答相关性不错，但缺少量化结果与清晰结构。
              </p>
            </div>
          </div>
        </Card>

        {/* Four Dimensions */}
        <Card title="四维评分">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">贴合度</span>
                <span className="text-sm font-medium">4.0</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: '80%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">清晰度</span>
                <span className="text-sm font-medium">3.2</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: '64%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">证据力</span>
                <span className="text-sm font-medium">2.1</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">结构性</span>
                <span className="text-sm font-medium">3.0</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </Card>

        {/* Top 3 Improvements */}
        <Card title="Top 3 改进建议">
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">
                1) 证据力不足：缺指标/缺影响范围
              </h4>
              <div className="text-sm text-text-secondary space-y-1">
                <p>• 改法：用&ldquo;背景-行动-结果&rdquo;三段式，补充X指标</p>
                <p>• 补充：数据/规模/你负责的边界</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">
                2) 结构性可改进：回答较散
              </h4>
              <div className="text-sm text-text-secondary space-y-1">
                <p>• 改法：先总后分，每个要点单独成段</p>
                <p>• 补充：使用&ldquo;首先...其次...最后&rdquo;等连接词</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-text-primary mb-2">
                3) 技术深度不够：部分回答偏浅
              </h4>
              <div className="text-sm text-text-secondary space-y-1">
                <p>• 改法：技术问题要展开原理，不只是列举工具</p>
                <p>• 补充：说明为什么选择这个方案，对比其他方案</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Highlights */}
        <Card title="亮点">
          <p className="text-sm text-text-primary leading-relaxed">
            你在「项目深挖」类问题表达最清晰：能够较好地说明项目背景和你的角色，建议继续保持这种风格，并在其他类型问题中也应用。
          </p>
        </Card>

        {/* Next Training Plan (Growth wedge) */}
        <Card title="下次训练计划">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              建议：下一轮重点练「证据力 + 结构性」
            </p>
            <Link href="/try">
              <Button fullWidth>我也生成一份复盘（免费3题）</Button>
            </Link>
          </div>
        </Card>

        {/* Owner Actions */}
        {isOwner && (
          <Card>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCopyLink} className="flex-1">
                复制链接
              </Button>
              <Button variant="secondary" onClick={handleRevokeLink} className="flex-1">
                撤销链接
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
