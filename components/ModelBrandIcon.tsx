import React from "react";
import Claude from "@lobehub/icons/es/Claude/components/Mono";
import DeepSeek from "@lobehub/icons/es/DeepSeek/components/Mono";
import Gemini from "@lobehub/icons/es/Gemini/components/Mono";
import Grok from "@lobehub/icons/es/Grok/components/Mono";
import Kimi from "@lobehub/icons/es/Kimi/components/Mono";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";

// Typesafe mark supplied by the user; currentColor matches the other monochrome brands.
const Typesafe = ({ size = 20 }: { size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 98.9 144" fill="none" focusable="false">
    <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M76.458 17.565v24.833l22.357 14.524.006 54.989L49.405 144l-27.041-17.559V100.92L0 86.396v-54.3l2.129-1.387L49.41 0zM35.604 123.9l13.795 8.959 36.163-23.496-13.788-8.952zm18.472-61.904v24.407l-22.37 14.525v14.365l35.41-22.996V53.529zm22.382 30.313 13.015 8.454V61.989l-13.015-8.454zM13.247 83.86l13.788 8.96 13.794-8.96-13.788-8.953zM9.342 37.162V75.26l13.022-8.46V42.392L44.74 27.856v-13.69zm22.364 29.632 13.028 8.46V61.989l-13.028-8.46zm3.898-21.871 13.807 8.965 13.794-8.96-13.8-8.964zm18.478-17.067 13.033 8.466V22.638l-13.033-8.473z" />
  </svg>
);

const brands = { "~typesafe": Typesafe, google: Gemini, anthropic: Claude, openai: OpenAI, "x-ai": Grok, deepseek: DeepSeek, moonshotai: Kimi };

// Decorative beside the visible model name; unknown brands keep their text identity.
export const ModelBrandIcon: React.FC<{ model: string; size?: number }> = ({ model, size = 20 }) => {
  const Icon = brands[model.split("/")[0] as keyof typeof brands];
  if (!Icon) return null;
  return <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}><Icon size={size} /></span>;
};
