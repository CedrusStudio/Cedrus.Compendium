import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  framework: "@storybook/nextjs",
  stories: ["../stories/**/*.stories.tsx"],
  core: { disableTelemetry: true },
};

export default config;
