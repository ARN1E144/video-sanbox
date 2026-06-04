import { applyTheme } from "../../theme/applyTheme";

export const setColor = async (ctx, params) => {
  if (!params?.key || !params?.value) return;

  document.documentElement.style.setProperty(
    `--${params.key}`,
    params.value
  );

  ctx?.notify?.(`Updated ${params.key}`);
};

export const applyThemeAction = async (ctx, params) => {
  if (!params?.theme) return;

  applyTheme(params.theme);

  ctx?.notify?.("Theme applied");
};