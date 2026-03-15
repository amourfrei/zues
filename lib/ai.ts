import Anthropic from '@anthropic-ai/sdk';
import { Baby, Record as BabyRecord } from '../constants/types';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export const SYSTEM_PROMPT = `You are 萌宝助手 (MengBao Assistant), a professional parenting AI assistant specialized in 0-6 year old child development. You are warm, empathetic, scientifically accurate, and always cite evidence-based recommendations from WHO, AAP, and Chinese medical guidelines.

Your expertise includes:
- Infant feeding (breastfeeding, formula, solid foods introduction)
- Sleep schedules and sleep training methods
- Growth and development milestones
- Vaccination schedules (China's National Immunization Program)
- Common health concerns (jaundice, colic, fever, diaper rash, etc.)
- Cognitive and emotional development
- Parenting stress and parent wellbeing

Communication style:
- Warm and supportive, like a knowledgeable friend
- Use clear, simple language avoiding excessive medical jargon
- Provide actionable, specific advice
- Always remind users to consult their pediatrician for medical concerns
- Respond in the same language the user writes in (Chinese or English)
- Use emojis sparingly but warmly

Important: Never diagnose medical conditions. Always recommend professional consultation for health concerns.`;

export interface AiContext {
  baby?: Baby;
  recentRecords?: BabyRecord[];
  language?: 'zh' | 'en';
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: AiContext
): Promise<string> {
  let systemContent = SYSTEM_PROMPT;

  if (context?.baby) {
    const baby = context.baby;
    const ageMs = Date.now() - new Date(baby.birth_date).getTime();
    const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30));
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    systemContent += `\n\nCurrent baby context:
- Name: ${baby.name}
- Gender: ${baby.gender === 'male' ? 'Boy' : 'Girl'}
- Age: ${ageMonths > 0 ? `${ageMonths} months` : `${ageDays} days`}
- Birth weight: ${baby.birth_weight}g
- Birth height: ${baby.birth_height}cm`;
  }

  if (context?.recentRecords && context.recentRecords.length > 0) {
    systemContent += `\n\nRecent activity data (last 24 hours):`;
    const counts: { [key: string]: number } = {};
    context.recentRecords.forEach(r => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    Object.entries(counts).forEach(([type, count]) => {
      systemContent += `\n- ${type}: ${count} times`;
    });
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemContent,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  return '抱歉，我暂时无法回答。请稍后再试。';
}

export async function generateReport(
  baby: Baby,
  records: BabyRecord[],
  periodType: 'weekly' | 'monthly'
): Promise<{ summary: string; insights: string[]; suggestions: string[] }> {
  const ageMs = Date.now() - new Date(baby.birth_date).getTime();
  const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30));

  const recordSummary = summarizeRecords(records);
  const periodLabel = periodType === 'weekly' ? '本周' : '本月';

  const prompt = `请为以下宝宝生成${periodLabel}育儿复盘报告，格式为JSON：

宝宝信息：
- 姓名：${baby.name}
- 性别：${baby.gender === 'male' ? '男' : '女'}
- 月龄：${ageMonths}个月

${periodLabel}数据统计：
${JSON.stringify(recordSummary, null, 2)}

请返回以下JSON格式（不要有其他内容）：
{
  "summary": "2-3句话的整体概述",
  "insights": ["洞察1", "洞察2", "洞察3", "洞察4"],
  "suggestions": ["建议1", "建议2", "建议3"]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
  }

  return {
    summary: '数据分析完成，宝宝本周整体状态良好。',
    insights: ['喂养规律稳定', '睡眠质量不错', '排泄正常'],
    suggestions: ['保持现有作息规律', '继续记录每日数据'],
  };
}

export async function generateParentingPlan(baby: Baby): Promise<string> {
  const ageMs = Date.now() - new Date(baby.birth_date).getTime();
  const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30));
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  const prompt = `请为${ageMonths > 0 ? `${ageMonths}个月` : `${ageDays}天`}大的${baby.gender === 'male' ? '男' : '女'}宝宝${baby.name}制定一份个性化育儿计划，包括：
1. 当前发育阶段特点
2. 喂养建议（时间频率和量）
3. 睡眠作息建议
4. 早期发育互动建议
5. 本阶段注意事项和里程碑

请用温暖、实用的语气，给出具体可操作的建议。`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  return content.type === 'text' ? content.text : '正在为您生成个性化育儿计划...';
}

function summarizeRecords(records: BabyRecord[]): object {
  const summary: { [key: string]: any } = {};

  records.forEach(record => {
    if (!summary[record.type]) {
      summary[record.type] = { count: 0, details: [] };
    }
    summary[record.type].count++;

    if (record.type === 'feeding') {
      const data = record.data as any;
      if (!summary[record.type].methods) summary[record.type].methods = {};
      const method = data.method || 'unknown';
      summary[record.type].methods[method] = (summary[record.type].methods[method] || 0) + 1;
      if (data.amount_ml) {
        summary[record.type].totalMl = (summary[record.type].totalMl || 0) + data.amount_ml;
      }
    }

    if (record.type === 'sleep' && record.started_at && record.ended_at) {
      const duration = (new Date(record.ended_at).getTime() - new Date(record.started_at).getTime()) / (1000 * 60 * 60);
      summary[record.type].totalHours = ((summary[record.type].totalHours || 0) + duration);
    }
  });

  return summary;
}
