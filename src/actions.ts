import * as vscode from "vscode";
import NameThatColor from "./name-that-color";

class Actions {
  private _nameThatColor: NameThatColor;

  constructor() {
    this._nameThatColor = new NameThatColor();
  }

  public trigger(type: string): void {
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;

    if (!editor) {
      return; // No open text editor
    }

    editor.edit((builder) => {
      const selections: vscode.Selection[] = editor.selections;
      for (const selection of selections) {
        const hex = editor.document.getText(selection);

        if (!this._checkSelection(hex)) {
          return; // Invalid hex color
        }
        this._dispatchActions(type, hex, selection, builder);
      }
    });
  }

  private _checkSelection(text: string) {
    if (text.charAt(0) === "#") {
      text = text.substr(1);
    }

    const pattern = /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i;
    const output = pattern.test(text);

    if (!output) {
      const message = `Sorry but '#${text}' doesn't seem to be a valid Hex color representation.`;
      vscode.window.showErrorMessage(message);
    }
    return output;
  }

  private _dispatchActions(
    type: string,
    hex: string,
    selection: vscode.Selection,
    builder: vscode.TextEditorEdit
  ) {
    const colorName = this._nameThatColor.getName(hex);

    if (type === "get") {
      const message = `#${colorName[0]} is ${colorName[1]} or even #${colorName[2]}.`;
      vscode.window.showInformationMessage(message);
    } else if (type === "replace") {
      const startOfSelection =
        hex.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
      const endOfSelection = selection.end;
      const extendedSelection = selection.with(
        startOfSelection,
        endOfSelection
      );
      builder.replace(extendedSelection, `${colorName[2]}`);
    } else if (type === "sassVar") {
      const startOfSelection =
        hex.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
      const endOfSelection = selection.end;
      builder.insert(startOfSelection, `$${colorName[2]}: `);
      builder.insert(endOfSelection, ";");
    } else if (type === "cssVar") {
      const startOfSelection =
        hex.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
      const endOfSelection = selection.end;
      builder.insert(startOfSelection, `--${colorName[2]}: `);
      builder.insert(endOfSelection, ";");
    }
  }
}

export default Actions;
