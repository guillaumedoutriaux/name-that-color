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
        const isBlockSelection = editorContent.includes("\n");
        if (isBlockSelection) {
          this.processBlockSelection(builder, selection, editorContent);
        } else {
          this.processMultiSelection({
            type,
            editorContent,
            selection,
            builder,
          });
        }
      }
    });
  }

  private processBlockSelection(
    builder: vscode.TextEditorEdit,
    selection: vscode.Selection,
    editorContent: string
  ): void {
    const blockSelectionContent = editorContent.split("\n");
    const editorContentUpdated = blockSelectionContent
      .map((line) => {
        const item = line.split(" ").join("");
        const colorType = this.getColorType(item);

        if (colorType === ColorType.UNKNOW) {
          return ""; // Not a color so we just leave an empty line
        }

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

    builder.replace(selection, editorContentUpdated);

    // const doc = vscode.window.activeTextEditor.document;
    // builder.replace(
    //   new vscode.Range(
    //     doc.lineAt(0).range.start,
    //     doc.lineAt(doc.lineCount - 1).range.end
    //   ),
    //   editorContentUpdated
    // );
  }

  private processMultiSelection(param: Omit<actionParam, "colorType">): void {
    const { type, editorContent, selection, builder } = param;

    const colorType = this.getColorType(editorContent);
    if (colorType === ColorType.UNKNOW) {
      const message = `Sorry but '${editorContent}' is not a valid color representation. Supported values are hex and RGB.`;
      vscode.window.showErrorMessage(message);
      return;
    }

    this.dispatchActions({
      type,
      editorContent,
      colorType,
      selection,
      builder,
    });
  }

  private getColorType(input: string): ColorType {
    const inputWithoutSpaces = input.split(" ").join("");

    // #ccc or #cccccc
    const hexPattern = /(^#?[a-f\d]{6}$)|(^#?[a-f\d]{3}$)/i;

    // rgb(0,0,0) or rgb(0 0 0) + 0-255
    const rgbPattern =
      /^rgb\((0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)[, ](0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)[, ](0|255|25[0-4]|2[0-4]\d|1\d\d|0?\d?\d)\)$/i;
    // const hslPattern = /^hsl\((0|360|35\d|3[0-4]\d|[12]\d\d|0?\d?\d),(0|100|\d{1,2})%,(0|100|\d{1,2})%\)$/i;

    if (hexPattern.test(inputWithoutSpaces)) {
      return ColorType.HEX;
    } else if (rgbPattern.test(inputWithoutSpaces)) {
      return ColorType.RGB;
      // } else if (hslPattern.test(input)) {
      //   return ColorType.HSL;
    } else {
      return ColorType.UNKNOW;
    }
  }

  private dispatchActions(param: actionParam): void {
    const { type, editorContent, colorType } = param;
    const colorName = this.nameThatColor.getName(editorContent, colorType);

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
    }
  }

  private doGetAction(param: actionParam, colorName: string[]): void {
    const { colorType, editorContent } = param;
    const outputColor =
      colorType === ColorType.HEX ? `#${colorName[0]}` : editorContent;
    const message = `${outputColor} is ${colorName[1]} (${colorName[2]}).`;
    vscode.window.showInformationMessage(message);
  }

  private doReplaceAction(param: actionParam, colorName: string[]): void {
    const { colorType, editorContent, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(
      editorContent,
      selection,
      colorType
    );
    const extendedSelection = selection.with(start, end);
    builder.replace(extendedSelection, `${colorName[2]}`);
  }

  private doSassVarAction(param: actionParam, colorName: string[]): void {
    const { colorType, editorContent, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(
      editorContent,
      selection,
      colorType
    );
    builder.insert(start, `$${colorName[2]}: `);
    builder.insert(end, ";");
  }

  private doCssVarAction(param: actionParam, colorName: string[]): void {
    const { colorType, editorContent, selection, builder } = param;
    const { start, end } = this.getSelectionBounds(
      editorContent,
      selection,
      colorType
    );
    builder.insert(start, `--${colorName[2]}: `);
    builder.insert(end, ";");
  }

  private getSelectionBounds(
    color: string,
    selection: vscode.Selection,
    colorType: ColorType
  ): SelectionBounds {
    let start;
    if (colorType === ColorType.HEX) {
      const colorWithoutSpaces = color.split(" ").join("");
      start =
        colorWithoutSpaces.charAt(0) === "#"
          ? selection.start
          : selection.start.translate(0, -1);
    } else {
      start = selection.start;
    }
    const end = selection.end;
    return { start, end };
  }
}
