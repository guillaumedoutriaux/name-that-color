import * as vscode from "vscode";
import { config } from "./config";

export function utilSlugify(str: string) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const settings = vscode.workspace.getConfiguration(config.appId);
  const delimiter: string = settings.delimiter === "Hyphen" ? "-" : "_";
  const substituteChars = delimiter.repeat(6);
  const from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  const to = `aaaaeeeeiiiioooouuuunc${substituteChars}`;

  for (let i = 0, l = from.length; i < l; i++)
    str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));

  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, delimiter) // collapse whitespace and replace by -
    .replace(/-+/g, delimiter); // collapse dashes

  return str;
}

export function addPrefixSuffix(str: string) {
  const settings = vscode.workspace.getConfiguration(config.appId);
  const prefix: string = settings.variablePrefix;
  const suffix: string = settings.variableSuffix;
  if (prefix) {
    str = prefix + str;
  }
  if (suffix) {
    str = str + suffix;
  }
  return str;
}
