import * as vscode from "vscode";
import * as WebSocketServer from "ws";

const preventLeak = (code: string) => {
  if (code.toLowerCase().indexOf("password") > -1) {
    return "// the code is hidden on the stream cause a password was detected.";
  }

  return code;
};

export function activate(context: vscode.ExtensionContext) {
  const wss = new WebSocketServer.Server({ port: 5050 });
  console.log("The WebSocket server is running on port 5050");

  const sendUdpateToClient = (event: any) => {
    const code = event.document.getText();

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocketServer.WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            setCode: preventLeak(code),
            setLanguage: event.document.languageId,
          }),
          { binary: false }
        );
      }
    });
  };

  const sendSelectionUpdateToClient = (event: any) => {
    const { start, end } = event.selections[0];

    wss.clients.forEach((client) => {
      client.send(
        JSON.stringify({
          setSelection: {
            start,
            end,
          },
        }),
        { binary: false }
      );
    });
  };

  vscode.window.onDidChangeActiveTextEditor((event) => {
    sendUdpateToClient(event);
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    sendUdpateToClient(event);
  });

  vscode.window.onDidChangeTextEditorSelection((event) => {
    sendSelectionUpdateToClient(event);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
