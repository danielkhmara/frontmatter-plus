import { FrontmatterService } from "../../src/frontmatter-service";
import type FrontmatterPlusPlugin from "../../src/main";
import { PropertiesBadge } from "../../src/properties-badge";
import { DEFAULT_SETTINGS, FrontmatterPlusSettings } from "../../src/settings";
import { TemplateRouter } from "../../src/template-router";
import { FakeApp } from "./app";

export interface TestPlugin {
  app: FakeApp;
  settings: FrontmatterPlusSettings;
  service: FrontmatterService;
  templateRouter: TemplateRouter;
  badge: PropertiesBadge;
  focusDisplay: string | null;
}

export function createPlugin(overrides: Partial<FrontmatterPlusSettings> = {}): TestPlugin {
  const app = new FakeApp();
  const plugin = {
    app,
    settings: {
      ...DEFAULT_SETTINGS,
      createDelayMs: 0,
      updateDelayMs: 0,
      excludedFolders: [],
      excludedFiles: [],
      ignoredProperties: [],
      folderTemplates: [],
      ...overrides,
    },
    pathSync: { isSuppressed: () => false },
    focusSession: { getDisplay: () => plugin.focusDisplay },
    focusDisplay: null as string | null,
    saveSettings: async () => undefined,
    refreshContentBaselines: () => undefined,
  } as unknown as TestPlugin & Record<string, unknown>;

  const host = plugin as unknown as FrontmatterPlusPlugin;
  plugin.service = new FrontmatterService(host);
  plugin.templateRouter = new TemplateRouter(host);
  plugin.badge = new PropertiesBadge(host);
  return plugin;
}
