import * as vscode from 'vscode';

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

            vscode.window.showInformationMessage(
                `Заметка создана: ${note}`
            );

            console.log('Выделенный код:', selectedText);
            console.log('Текст заметки:', note);
        }
    );

    context.subscriptions.push(createNoteCommand);
}

export function deactivate() {}