import type { Plugin } from "@opencode-ai/plugin";
import type { Config as ConfigV2 } from "@opencode-ai/sdk/v2"
import { existsSync, readFileSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const current_dir = dirname(fileURLToPath(import.meta.url));
const root_dir = path.join(current_dir, "..");

export const ApifyPlugin: Plugin = async () => {
  const agentPath = path.join(root_dir, "agents/apify.md")
  if (!existsSync(agentPath)) {
    throw new Error('Apify agent.md not found')
  }
  const agent = readFileSync(agentPath, "utf8")

  const skillsPath = path.join(root_dir, "skills")
  if (!existsSync(skillsPath)) {
    throw new Error('Apify skills not found')
  }

  const instructionsPath = path.join(root_dir, "instructions/apify-routing.md")
  if (!existsSync(instructionsPath)) {
    throw new Error('Apify instructions not found')
  }

  return {
    config: async (config) => {
      // ConfigV2 includes `skills` which isn't in the plugin's Config type yet
      const cfg = config as typeof config & Pick<ConfigV2, "skills">

      cfg.mcp = { ...cfg.mcp, apify: { type: "remote", enabled: true, url: "https://mcp.apify.com" } }
      cfg.agent = {
        ...cfg.agent,
        apify: {
          prompt: agent,
          mode: "all",
          description: "Anything related to Apify, use the apify_* tools to interact with the Apify platform.",
        },
      }
      cfg.skills = {
        ...cfg.skills,
        paths: [...(cfg.skills?.paths ?? []), skillsPath],
      }
      cfg.tools = {
        ...cfg.tools,
        "apify_*": true,
      }
      cfg.instructions = [...(cfg.instructions ?? []), instructionsPath]
    },
    "shell.env": async (_input, output) => {
      if (process.env.APIFY_TOKEN) {
        output.env.APIFY_TOKEN = process.env.APIFY_TOKEN;
      }
    },
  }
}

export default ApifyPlugin;