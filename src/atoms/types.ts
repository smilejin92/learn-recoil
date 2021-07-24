export type ElementStyle = {
  position: { top: number; left: number };
  size: { width: number; height: number };
};

export type Element = {
  style: ElementStyle;
  image?: { id: number; src: string };
};

export type ElementPropsSelectorParams = {
  propPath: string;
  id: number;
};

export type ElementSizePropSelectorProps = {
  dimension: 'width' | 'height';
  id: number;
};
