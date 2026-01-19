import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      
      <div className="container-content py-10 md:py-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            AI 面试准备平台
          </h1>
          <p className="text-lg text-text-secondary">
            生成定制化面试题 · 模拟真实面试 · 获取专业复盘报告
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link href="/try">
              <Button className="w-full sm:w-auto">免费试用（3题）</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" className="w-full sm:w-auto">登录</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-text-primary">📝 智能生成面试题</h3>
              <p className="text-sm text-text-secondary">
                基于岗位描述和简历，AI 生成贴合的面试题目
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-text-primary">🎯 模拟真实面试</h3>
              <p className="text-sm text-text-secondary">
                完整的面试流程体验，自动保存答题进度
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-text-primary">📊 专业复盘报告</h3>
              <p className="text-sm text-text-secondary">
                四维评分+改进建议，可分享给导师获取反馈
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-medium text-center text-text-primary">快速开始</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link href="/try">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-medium text-text-primary mb-2">免登录体验</h3>
                <p className="text-sm text-text-secondary mb-4">
                  快速生成3道面试题，无需注册
                </p>
                <span className="text-sm text-primary">立即试用 →</span>
              </Card>
            </Link>
            
            <Link href="/jobs">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-lg font-medium text-text-primary mb-2">岗位准备</h3>
                <p className="text-sm text-text-secondary mb-4">
                  管理应聘岗位，定制准备要点，完整模拟面试
                </p>
                <span className="text-sm text-primary">开始准备 →</span>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
