import * as vscode from "vscode";

export const enum ColorType {
  HEX = "hex",
  RGB = "rgb",
  HSL = "hsl",
  UNKNOW = "unknown",
}

export interface SelectionBounds {
  start: vscode.Position;
  end: vscode.Position;
}

export interface actionParam {
  type: string;
  color: string;
  colorType: ColorType;
  selection: vscode.Selection;
  builder: vscode.TextEditorEdit;
}
