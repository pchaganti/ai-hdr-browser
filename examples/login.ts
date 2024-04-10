import yargs from "yargs/yargs";

import { AgentBrowser } from "../src/agentBrowser";
import { Browser } from "../src/browser";
import { Agent } from "../src/agent/agent";
import { Inventory } from "../src/inventory";
import { completionApiBuilder } from "../src/agent/config";

import { ModelResponseSchema } from "../src/types/browser/actionStep.types";

const parser = yargs(process.argv.slice(2)).options({
  headless: { type: "boolean", default: true },
});

async function main() {
  const argv = await parser.parse();

  const startUrl = "https://practicetestautomation.com/practice-test-login/";
  const objective = "please login into the website";
  const maxIterations = 10;

  const providerOptions = {
    apiKey: process.env.ANTHROPIC_API_KEY!,
    provider: "anthropic",
  };
  const chatApi = completionApiBuilder(providerOptions, {
    model: "claude-2.1",
  });

  if (!chatApi) {
    throw new Error(
      `Failed to create chat api for ${providerOptions.provider}`
    );
  }

  // here we define the inventory
  // inventories are used to store values that can be used in the browser
  // for example, a username and password
  // information in the inventory can be used in the browser to to complete tasks
  // inventory values are never exposed to either collective memory or the model api
  const inventory = new Inventory([
    { value: "student", name: "Username", type: "string" },
    { value: "Password123", name: "Password", type: "string" },
  ]);

  const agentBrowser = new AgentBrowser({
    agent: new Agent({ modelApi: chatApi }),
    browser: await Browser.create(argv.headless),
    inventory,
  });

  const answer = await agentBrowser.browse(
    {
      startUrl: startUrl,
      objective: [objective],
      maxIterations: maxIterations,
    },
    ModelResponseSchema
  );

  console.log("Answer:", answer?.result);
  await agentBrowser.close();
}

main();
