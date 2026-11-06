
import * as vscode from 'vscode';

interface CodeNote {
    id: string;
    file: string;
    code: string;
    note: string;
    line: number;
    createdAt: string;
}

async function getNotesFile(): Promise<vscode.Uri | undefined> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
        vscode.window.showWarningMessage('Сначала откройте папку проекта!');
        return undefined;
    }

    return vscode.Uri.joinPath(workspaceFolder.uri, '.code-notes.json');
}

async function readNotes(): Promise<CodeNote[]> {
    const notesFile = await getNotesFile();

    if (!notesFile) {
        return [];
    }

    try {
        const content = await vscode.workspace.fs.readFile(notesFile);
        return JSON.parse(Buffer.from(content).toString('utf8'));
    } catch {
        return [];
    }
}

async function saveNotes(notes: CodeNote[]) {
    const notesFile = await getNotesFile();

    if (!notesFile) {
        return;
    }

    await vscode.workspace.fs.writeFile(
        notesFile,
        Buffer.from(JSON.stringify(notes, null, 4), 'utf8')
    );
}

export function activate(context: vscode.ExtensionContext) {
    const createNoteCommand = vscode.commands.registerCommand(
        'codeNotes.create',
        async () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showWarningMessage('Сначала откройте файл с исходным кодом!');
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

            const notes = await readNotes();

            const newNote: CodeNote = {
                id: Date.now().toString(),
                file: vscode.workspace.asRelativePath(editor.document.uri),
                code: selectedText,
                note: note.trim(),
                line: selection.start.line + 1,
                createdAt: new Date().toISOString()
            };

            notes.push(newNote);
            await saveNotes(notes);

            vscode.window.showInformationMessage('Заметка сохранена!');
        }
    );

    const showNotesCommand = vscode.commands.registerCommand(
        'codeNotes.show',
        async () => {
            const notes = await readNotes();

            if (notes.length === 0) {
                vscode.window.showInformationMessage('Сохранённых заметок пока нет.');
                return;
            }

            const items = notes.map(note => ({
                label: note.note,
                description: `${note.file}:${note.line}`,
                detail: note.code || 'Фрагмент кода не сохранён',
                noteId: note.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Сохранённые заметки'
            });

            if (!selected) {
                return;
            }

            vscode.window.showInformationMessage(
                `${selected.description}: ${selected.label}`
            );
        }
    );

    const deleteNoteCommand = vscode.commands.registerCommand(
        'codeNotes.delete',
        async () => {
            const notes = await readNotes();

            if (notes.length === 0) {
                vscode.window.showInformationMessage('Нет заметок для удаления.');
                return;
            }

            const items = notes.map(note => ({
                label: note.note,
                description: `${note.file}:${note.line}`,
                noteId: note.id
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Выберите заметку для удаления'
            });

            if (!selected) {
                return;
            }

            const updatedNotes = notes.filter(
                note => note.id !== selected.noteId
            );

            await saveNotes(updatedNotes);

            vscode.window.showInformationMessage('Заметка удалена!');
        }
    );

    context.subscriptions.push(
        createNoteCommand,
        showNotesCommand,
        deleteNoteCommand
    );
}

export function deactivate() {}
