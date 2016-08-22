import { white, blue, dim } from "chalk";

/**
 * Formatters turn JSON event objects into user-readable messages to be printed
 * to the console.
 */

export interface Formatters {
  [index: string]: {
    [index: string]: (event: any) => string;
  };
}

export default <Formatters>{
  "info": {
    "server-started"({ address }) {
      return `Listening on ${address.url}`;
    },

    "setup-complete"() {
      return `Setup complete`;
    },

    "dns-started"() {
      return "DNS server started";
    },

    "dispatch-start"() {
      return null;
    },

    "dispatch-not-found"({ path }) {
      return `404 - ${path}`;
    },

    "dispatch-dispatching"({ path, controller, method }) {
      let invocation = blue(controller + dim(".") + method + dim("()"));
      return `${white(path)} ⇒ ${invocation}`;
    }
  },

  "error": {
    "no-ssl"({ missingFile }) {
      return `Unable to enable SSL: couldn't find missing file ${missingFile}`;
    },

    "Error"(error) {
      return error.stack;
    }
  },

  "prompt": {
    "ask-setup-prelude"({ appName, subtaskMessages }: { appName: string, subtaskMessages: string[] }) {
      let subtaskMessage = subtaskMessages.map(m => `  * ${m.trim()}`).join("\n");

      return `To use ${appName}, we need to do some setup to get\
 SSL working. This requires root access, but only happens once.

Specifically, we need to:

${subtaskMessage}\n
`;
    },

    "ask-setup"() {
      return "OK to proceed? You will be prompted for your password.";
    }
  }
};