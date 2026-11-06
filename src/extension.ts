
import * as vscode from 'vscode';

interface CodeNote {
    id: string;
    file: string;
    code: string;
    note: string;
    line: number;
    createdAt: string;
}

export function activate(context: vscode.ExtensionContext) {
    const createNoteCommand = vscode.commands.registerCommand(
        'codeNotes.create',
        async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showWarningMessage(
                    'Сначала откройте файл с исходным кодом!'
                );
                return;
            }

            const selection = editor.selection;

            const selectedText = selection.isEmpty
                ? editor.document.lineAt(selection.active.line).text
                : editor.document.getText(selection);

            const note = await vscode.window.showInputBox({
                prompt: 'Введите текст заметки',
                placeHolder: 'Напишите комментарий к коду...'
            });

            if (!note || !note.trim()) {
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

            if (!workspaceFolder) {
                vscode.window.showWarningMessage(
                    'Сначала откройте папку проекта!'
                );
                return;
            }

            const notesFile = vscode.Uri.joinPath(
                workspaceFolder.uri,
                '.code-notes.json'
            );

            let notes: CodeNote[] = [];

            try {
                const content = await vscode.workspace.fs.readFile(notesFile);
                notes = JSON.parse(Buffer.from(content).toString('utf8'));
            } catch {
                notes = [];
            }

            const newNote: CodeNote = {
                id: Date.now().toString(),
                file: vscode.workspace.asRelativePath(editor.document.uri),
                code: selectedText,
                note: note.trim(),
                line: selection.start.line + 1,
                createdAt: new Date().toISOString()
            };

            notes.push(newNote);

            await vscode.workspace.fs.writeFile(
                notesFile,
                Buffer.from(JSON.stringify(notes, null, 4), 'utf8')
            );

            vscode.window.showInformationMessage(
                'Заметка сохранена!'
            );
        }
    );

    context.subscriptions.push(createNoteCommand);
}

export function deactivate() {}
