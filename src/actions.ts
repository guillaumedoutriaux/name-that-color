import * as vscode from "vscode";
import { actionParam, ColorType, SelectionBounds } from "./models";
import { NameThatColor } from "./name-that-color";

export class Actions {
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
        const editorContent = editor.document.getText(selection);

        // Block Selection
        const isMultiline = editorContent.includes("\n");
        if (isMultiline) {
          const multilineContent = editorContent.split("\n");
          const editorContentUpdated = multilineContent
            .map((line) => {
              const item = line.split(" ").join("");
              const colorType = this.getColorType(item);
              const colorName = this.nameThatColor.getName(item, colorType);
              return `$${colorName[2]} : #${colorName[0]};`;
              // this.dispatchActions({
              //   type: "newline",
              //   color: line,
              //   colorType,
              //   selection,
              //   builder,
              // });
            })
            .join("\n");

          const doc = vscode.window.activeTextEditor.document;
          builder.replace(
            new vscode.Range(
              doc.lineAt(0).range.start,
              doc.lineAt(doc.lineCount - 1).range.end
            ),
            editorContentUpdated
          );
          break;
        }

        // Multiline Selection
        const colorType = this.getColorType(editorContent);
        if (colorType === ColorType.UNKNOW) {
          const message = `Sorry but '${editorContent}' is not a valid color representation. Supported values are hex and RGB.`;
          vscode.window.showErrorMessage(message);
          return;
        }

        this.dispatchActions({
          type,
          color: editorContent,
          colorType,
          selection,
          builder,
        });
      }
    });
  }

  private getColorType(input: string): ColorType {
    // #ccc or #cccccc
    const hexPattern = /(^#?[a-f\d]{6}$)|(^#?[a-f\d]{3}$)/i;

    // rgb(0,0,0) or rgb(0 0 0) + 0-255
    const rgbPattern =
      /^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)[, ](0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)[, ](0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/i;
    // const hslPattern = /^hsl\((0|360|35\d|3[0-4]\d|[12]\d\d|0?\d?\d),(0|100|\d{1,2})%,(0|100|\d{1,2})%\)$/i;

    if (hexPattern.test(input)) {
      return ColorType.HEX;
    } else if (rgbPattern.test(input)) {
      return ColorType.RGB;
      // } else if (hslPattern.test(input)) {
      //   return ColorType.HSL;
    } else {
      return ColorType.UNKNOW;
    }
  }

  private dispatchActions(param: actionParam) {
    console.log(
      "🚀 ~ file: actions.ts ~ line 82 ~ Actions ~ dispatchActions ~ param",
      param
    );
    const { type, color, colorType } = param;
    const colorName = this.nameThatColor.getName(color, colorType);

    switch (type) {
      case "get":
        this.doGetAction(param, colorName);
        break;
      case "replace":
        this.doReplaceAction(param, colorName);
        break;
      case "sassVar":
        this.doSassVarAction(param, colorName);
        break;
      case "cssVar":
        this.doCssVarAction(param, colorName);
        break;
      case "newline":
        this.doNewlinAction(param, colorName);
        break;
    }
  }

  private doGetAction(param: actionParam, colorName: string[]): void {
    const { colorType, color } = param;
    const outputColor =
      colorType === ColorType.HEX ? `#${colorName[0]}` : color;
    const message = `${outputColor} is ${colorName[1]} (${colorName[2]}).`;
    vscode.window.showInformationMessage(message);
  }

  private doReplaceAction(param: actionParam, colorName: string[]): void {
    const { colorType, color, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(color, selection, colorType);
    const extendedSelection = selection.with(start, end);
    builder.replace(extendedSelection, `${colorName[2]}`);
  }

  private doSassVarAction(param: actionParam, colorName: string[]): void {
    const { colorType, color, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(color, selection, colorType);
    builder.insert(start, `$${colorName[2]}: `);
    builder.insert(end, ";");
  }

  private doCssVarAction(param: actionParam, colorName: string[]): void {
    const { colorType, color, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(color, selection, colorType);
    builder.insert(start, `--${colorName[2]}: `);
    builder.insert(end, ";");
  }

  private doNewlinAction(param: actionParam, colorName: string[]): void {
    const { selection, builder } = param;
    console.log(
      "🚀 ~ file: actions.ts ~ line 136 ~ Actions ~ doNewlinAction ~ selection",
      selection
    );
    builder.delete(selection);
    //builder.insert(selection.start, `$${colorName[2]}: ${colorName[1]}`);
    // builder.insert(selection., ";");
  }

  private getSelectionBounds(
    color: string,
    selection: vscode.Selection,
    colorType: ColorType
  ): SelectionBounds {
    let start;
    if (colorType === ColorType.HEX) {
      start =
        color.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
    } else {
      start = selection.start;
    }
    const end = selection.end;
    return { start, end };
  }
}
