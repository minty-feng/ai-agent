'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const mockQuestions = [
  {
    id: 1,
    tag: '行为面',
    question: '请描述一个你在项目中遇到的技术难题，以及你是如何解决的？包括具体的技术方案和最终结果。'
  },
  {
    id: 2,
    tag: '项目深挖',
    question: '在你负责的项目中，如何保证代码质量和团队协作效率？请具体说明你采用的工具和流程。'
  },
  {
    id: 3,
    tag: '技能',
    question: '请解释React Hooks的工作原理，以及你在实际项目中是如何使用它们优化性能的？'
  },
  {
    id: 4,
    tag: '行为面',
    question: '描述一次你需要在紧迫的deadline下完成任务的经历，你是如何平衡质量和速度的？'
  },
  {
    id: 5,
    tag: '项目深挖',
    question: '如果让你重新设计之前做过的一个项目，你会做哪些改进？为什么？'
  },
  {
    id: 6,
    tag: '技能',
    question: '请描述你对前端性能优化的理解，并举例说明你在实际项目中做过的优化工作。'
  },
  {
    id: 7,
    tag: '行为面',
    question: '在团队中遇到技术方案分歧时，你是如何处理的？请举一个具体例子。'
  },
  {
    id: 8,
    tag: '项目深挖',
    question: '请介绍你参与过的最复杂的项目，重点说明你的角色和解决的关键问题。'
  },
  {
    id: 9,
    tag: '技能',
    question: '请解释浏览器的事件循环机制，以及它如何影响前端应用的性能。'
  },
  {
    id: 10,
    tag: '行为面',
    question: '描述一次你主动发现并解决的问题，这个问题对团队或项目产生了什么影响？'
  }
];

const getTagVariant = (tag: string): 'gray' | 'blue' | 'green' => {
  if (tag === '行为面') return 'blue';
  if (tag === '项目深挖') return 'green';
  return 'gray';
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = mockQuestions[currentIndex];
  const totalQuestions = mockQuestions.length;

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      // Auto-save logic would go here
      console.log('Auto-saved');
    }, 3000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [answers[currentIndex]]);

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentIndex]: value
    });
  };

  const handleSkip = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question - show summary
      setShowSummary(true);
    }
  };

  const handleViewReport = () => {
    router.push(`/r/${params.sid}`);
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar title="模拟面试完成" backUrl={`/jobs/${params.id}`} />
        
        <div className="container-content py-6">
          <Card>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">72</div>
                <div className="text-sm text-text-secondary">总分</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">贴合度</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '80%' }} />
                    </div>
                    <span className="text-sm font-medium">4.0</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">清晰度</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '64%' }} />
                    </div>
                    <span className="text-sm font-medium">3.2</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">证据力</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '42%' }} />
                    </div>
                    <span className="text-sm font-medium">2.1</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">结构性</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm font-medium">3.0</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3">Top3 建议：</h4>
                <ol className="space-y-2 text-sm text-text-primary">
                  <li>1) 证据力不足：缺少具体指标和影响范围的量化数据</li>
                  <li>2) 结构性可改进：建议使用"背景-行动-结果"三段式回答</li>
                  <li>3) 深度不够：部分技术问题回答偏浅，可以更深入展开</li>
                </ol>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={handleViewReport} fullWidth>
                  查看复盘报告
                </Button>
                <Button variant="secondary" fullWidth onClick={() => router.push(`/jobs/${params.id}`)}>
                  再练一轮
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title={`模拟面试 ${currentIndex + 1}/${totalQuestions}`}
        backUrl={`/jobs/${params.id}`}
      />

      <div className="container-content py-6 space-y-6">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={getTagVariant(currentQuestion.tag)}>
                {currentQuestion.tag}
              </Badge>
            </div>

            <div>
              <div className="text-xs text-text-secondary mb-2">题目</div>
              <p className="text-sm md:text-base text-text-primary leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            <Textarea
              rows={12}
              placeholder="在此输入你的回答..."
              value={answers[currentIndex] || ''}
              onChange={handleAnswerChange}
            />

            <div className="text-xs text-text-secondary">
              每3秒自动保存草稿
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSkip} className="flex-1">
            跳过
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {currentIndex === totalQuestions - 1 ? '提交' : '下一题'}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1">
          {mockQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full ${
                idx === currentIndex ? 'bg-primary' :
                idx < currentIndex ? 'bg-gray-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
