import { Sendable } from '../../models/Sendable';
import { TaskBuilder } from '../../models/TaskBuilder';
import { Parser } from '../Parser';

export class NovaJudgeProblemParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['http://*/*', 'https://*/*'];
  }

  public canHandlePage(): boolean {
    return document.querySelector('meta[name="generator"][content="NovaJudge"]') !== null;
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const task = new TaskBuilder('NovaJudge').setUrl(url);
    const match = html.match(/CC_START(.*?)CC_END/);
    
    if (!match) {
      console.error("未能找到 CC_START 标记，请检查 fetch 是否成功拿到页面。");
      return task.build();
    }

    try {
      const jsonString = decodeURIComponent(match[1]);
      const data = JSON.parse(jsonString);
      
      // 3. 赋值给 Task
      if (data.name) task.setName(data.name);
      if (data.timeLimit) task.setTimeLimit(data.timeLimit);
      if (data.memoryLimit) task.setMemoryLimit(data.memoryLimit);

      if (data.samples && Array.isArray(data.samples)) {
        for (const sample of data.samples) {
          task.addTest(sample.input || "", sample.output || "");
        }
      }
    } catch (e) {
      console.error("解析隐藏 JSON 数据失败", e);
    }

    return task.build();
  }
}