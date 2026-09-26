import type { ComponentType } from "react";

export type TemplateProps = {
  /** Render only the above-the-fold sections (used for thumbnails). */
  preview?: boolean;
};

export type Category = "Food & drink" | "Beauty & wellness" | "Professional" | "Home & lifestyle";

export type Template = {
  slug: string;
  name: string;
  category: Category;
  blurb: string;
  Component: ComponentType<TemplateProps>;
};
