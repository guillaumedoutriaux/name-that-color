'use strict';

import * as vscode from 'vscode';
import Actions 		 from './actions';

export function activate(context: vscode.ExtensionContext) {

	const uiAction:Actions = new Actions();

	const disposableGet = vscode.commands.registerCommand('extension.ntcGet', () => {
		uiAction.trigger('get');
	});

	const disposableReplace = vscode.commands.registerCommand('extension.ntcReplace', () => {
		uiAction.trigger('replace');
	});

	const disposableSassVar = vscode.commands.registerCommand('extension.ntcSassVar', () => {
		uiAction.trigger('sassVar');
	});

	context.subscriptions.push(disposableGet, disposableReplace, disposableSassVar);
}