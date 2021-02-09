import * as vscode from "vscode";
import { ColorType } from "./models";
import { NameThatColor } from "./name-that-color";

class Actions {
  private nameThatColor: NameThatColor;

  constructor() {
    this.nameThatColor = new NameThatColor();
  }

  public trigger(type: string): void {
    const editor: vscode.TextEditor = vscode.window.activeTextEditor;

    if (!editor) {
      return; // No open text editor
    }

    editor.edit((builder) => {
      const selections: vscode.Selection[] = editor.selections;
      for (const selection of selections) {
        const userInput = editor.document.getText(selection);
        const colorType = this.getColorType(userInput);

        if (colorType === ColorType.UNKNOW) {
          const message = `Sorry but '${userInput}' doesn't seem to be a valid color representation. Only possible values are hex, RGB or HSL.`;
          vscode.window.showErrorMessage(message);
          return; // Invalid hex color
        }
        this.dispatchActions(type, userInput, colorType, selection, builder);
      }
    });
  }

  private getColorType(input: string): ColorType {
    const hexPattern = /(^#?[a-f\d]{6}$)|(^#?[a-f\d]{3}$)/i;
    const rgbPattern = /^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d),(0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/i;
    const hslPattern = /^hsl\((0|360|35\d|3[0-4]\d|[12]\d\d|0?\d?\d),(0|100|\d{1,2})%,(0|100|\d{1,2})%\)$/i;

    if (hexPattern.test(input)) {
      // console.log("color is hex");
      return ColorType.HEX;
    } else if (rgbPattern.test(input)) {
      // console.log("color is rgb");
      return ColorType.RGB;
    } else if (hslPattern.test(input)) {
      // console.log("color is hsl");
      return ColorType.HSL;
    } else {
      // console.log("color is undefined");
      return ColorType.UNKNOW;
    }
  }

  private dispatchActions(
    type: string,
    color: string,
    colorType: ColorType,
    selection: vscode.Selection,
    builder: vscode.TextEditorEdit
  ) {
    const colorName = this.nameThatColor.getName(color, colorType);
    console.log(
      "🚀 ~ file: actions.ts ~ line 67 ~ Actions ~ colorName",
      colorName
    );

    if (type === "get") {
      const message = `#${colorName[0]} is ${colorName[1]} or even #${colorName[2]}.`;
      vscode.window.showInformationMessage(message);
    } else if (type === "replace") {
      const startOfSelection =
        color.charAt(0) === "#"
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
        color.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
      const endOfSelection = selection.end;
      builder.insert(startOfSelection, `$${colorName[2]}: `);
      builder.insert(endOfSelection, ";");
    } else if (type === "cssVar") {
      const startOfSelection =
        color.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
      const endOfSelection = selection.end;
      builder.insert(startOfSelection, `--${colorName[2]}: `);
      builder.insert(endOfSelection, ";");
    }
  }
}

export default Actions;
