import { Sendable } from '../../models/Sendable';
import { Task } from '../../models/Task';
import { htmlToElement } from '../../utils/dom';
import { Parser } from '../Parser';
import { NovaJudgeProblemParser } from '../problem/NovaJudgeProblemParser';

export class NovaJudgeContestParser extends Parser {
  public getMatchPatterns(): string[] {
    return ['http://*/*', 'https://*/*'];
  }

  public canHandlePage(): boolean {
    return document.querySelector('meta[name="generator"][content="NovaJudge Contest"]') !== null;
  }

  public async parse(url: string, html: string): Promise<Sendable> {
    const elem = htmlToElement(html);

    const linkElements = [...elem.querySelectorAll('.novajudge-problem-link > a')] as HTMLAnchorElement[];
    const problemUrls = [...new Set(linkElements.map(link => link.href))];

    const tasks: Task[] = [];
    const problemParser = new NovaJudgeProblemParser();

    for (const problemUrl of problemUrls) {
      try {
        const response = await fetch(problemUrl, {
          credentials: 'include',
        });
        const problemHtml = await response.text();

        const task = (await problemParser.parse(problemUrl, problemHtml)) as Task;
        tasks.push(task);
      } catch (err) {
        console.error(`Failed to parse NovaJudge problem: ${problemUrl}`, err);
      }
    }

    return {
      send: async () => {
        const batchId = 'novajudge-batch-' + Date.now();

        for (const task of tasks) {
          (task as any).batch = {
            id: batchId,
            size: tasks.length,
          };

          await task.send();
        }
      },
    };
  }
}
