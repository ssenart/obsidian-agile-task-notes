import { Notice, TFile } from 'obsidian';
import { Task } from './Task';

export class VaultHelper { 

  private static BOARD_TEMPLATE_START: string = "---\n\nkanban-plugin: basic\n\n---\n\n";
  private static BOARD_TEMPLATE_END: string = "\n%% kanban:settings\n\`\`\`\n{\"kanban-plugin\":\"basic\"}\n\`\`\`%%\"";

  /**
   * Logs an error and notifies user that an error occured
   * @param error - The error message to log
   * @public
   */
  public static logError(error: string): void {
    console.log(error);
    new Notice('Error occured, see console logs for details. (ctrl+shift+i) to open');
  }

  /**
   * Creates all folders in a given path if they are non-existant
   * @param path - The path of folders to creates
   * @public
   */
  public static createFolders(path: string): void {
    if (app.vault.getAbstractFileByPath(path) == null) {
      app.vault.createFolder(path)
      .catch(err => console.log(err));
    }
  }

  /**
   * Will return a filename if the provided id is in the title of a markdown file in the vault
   * @param id - The string to search for in all filenames in the vault
   * @public
   */
  public static getFilenameByTaskId(id: string) : string {
    const files = app.vault.getMarkdownFiles()

    for (let i = 0; i < files.length; i++) {
      if (files[i].path.contains(id)) {
        return files[i].basename
      }
    }

    return "";
  }

  /**
   * Formats a task filename in this format: "{type} - {id}"
   * @param type - The type of task
   * @param id - The ID of the task
   * @public
   */
  public static formatTaskFilename(type: string, id: string): string {
    return `${type} - ${id}`
  }

  /**
   * Creates all task notes given the provided array of Tasks"
   * @param path - The path to create each task at
   * @param tasks - An array of Tasks
   * @public
   */
  public static createTaskNotes(path: string, tasks: Array<Task>, template: string): Promise<TFile>[] {

    let promisesToCreateNotes: Promise<TFile>[] = [];
    tasks.forEach(task => { 
      if (this.getFilenameByTaskId(task.id).length === 0) {
        promisesToCreateNotes.push(this.createTaskNote(path, task, template));
      }
    });

      return promisesToCreateNotes;
  }

   /**
   * Builds up a markdown file that represents a Kanban board for the sprint. Utilizes the format for the Kanban plugin"
   * @param path - The path to create each task at
   * @param tasks - An array of Tasks
   * @param columns - An array of column names to match state of the tasks with
   * @param sprintName - The name of the current sprint
   * @public
   */
  public static createKanbanBoard(path: string, tasks: Array<Task>, columns: Array<string>, sprintName: string): Promise<TFile> {
    const filename = `${sprintName}-Board`;
    const filepath = path + `/${filename}.md`;
    const existingBoard = app.vault.getAbstractFileByPath(filepath);

    if (existingBoard != null) {
      app.vault.delete(existingBoard, true);
    }

    let boardMD = this.BOARD_TEMPLATE_START;
    
    // Create Kanban board with specified columns matching the state of each task
    columns.forEach((column: string) => {
      boardMD += "## ";
      boardMD += column;
      boardMD += "\n";

      tasks.forEach((task: Task) => {
        if (task.state === column) {
          var taskFilename = this.getFilenameByTaskId(task.id);
          boardMD += `- [ ] [[${taskFilename}]] \n ${task.title}\n`
        }
      });

      boardMD += "\n";
    });

    boardMD += this.BOARD_TEMPLATE_END;

    return app.vault.create(filepath, boardMD);
  }

  private static async createTaskNote(path: string, task: Task, template:string): Promise<TFile> {
    const filename = VaultHelper.formatTaskFilename(task.type, task.id);
    const filepath = path + `/${filename}.md`;

    let content = template
            .replace(/{{TASK_ID}}/g, task.id)
            .replace(/{{TASK_TITLE}}/g, task.title)
            .replace(/{{TASK_STATE}}/g, task.state)
            .replace(/{{TASK_TYPE}}/g, task.type.replace(/ /g,''))
            .replace(/{{TASK_ASSIGNEDTO}}/g, task.assignedTo)
            .replace(/{{TASK_LINK}}/g, task.link);

    return app.vault.create(filepath, content);
  }
}